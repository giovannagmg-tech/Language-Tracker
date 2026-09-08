"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checarInterferencia, separarItens, type Aviso } from "@/lib/domain/interferencia";
import { IDIOMAS_SLUG } from "@/lib/domain/tipos";
import { calcularVelocidade } from "@/lib/domain/vocabulario";
import { entradaRevisao } from "@/lib/schemas/sessao";
import { supabaseServidor } from "@/lib/supabase/server";

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

function revalidar() {
  revalidatePath("/flashcards");
  revalidatePath("/hoje");
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

/**
 * RN-403. Check diário, um por idioma e por dia. Reclicar desmarca.
 * Não pergunta quantos cartões: o indicador é frequência, não volume.
 */
export async function alternarRevisao(
  idiomaId: string,
  data: string,
): Promise<{ ok: boolean; revisou: boolean; erro?: string }> {
  const parsed = entradaRevisao.safeParse({ idiomaId, data });
  if (!parsed.success) {
    return { ok: false, revisou: false, erro: parsed.error.issues[0].message };
  }

  const { supabase, userId } = await sessao();
  const { data: existente } = await supabase
    .from("revisoes_flashcards")
    .select("id, revisou")
    .eq("idioma_id", idiomaId)
    .eq("data", data)
    .maybeSingle();

  const novoValor = !existente?.revisou;

  const { error } = existente
    ? await supabase.from("revisoes_flashcards").update({ revisou: novoValor }).eq("id", existente.id)
    : await supabase
        .from("revisoes_flashcards")
        .insert({ user_id: userId, idioma_id: idiomaId, data, revisou: true });

  if (error) return { ok: false, revisou: existente?.revisou ?? false, erro: error.message };

  revalidar();
  return { ok: true, revisou: novoValor };
}

const palavras = z.object({
  idiomaId: z.string().uuid(),
  data: dataISO,
  quantidade: z.coerce.number().int().min(-500).max(500),
});

/** RN-402. Palavras novas criadas no dia. Aceita ajuste negativo para corrigir. */
export async function registrarPalavrasNovas(
  bruta: z.input<typeof palavras>,
): Promise<{ ok: boolean; total: number; erro?: string }> {
  const parsed = palavras.safeParse(bruta);
  if (!parsed.success) return { ok: false, total: 0, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  const { data: existente } = await supabase
    .from("registros_vocabulario")
    .select("id, palavras_novas")
    .eq("idioma_id", d.idiomaId)
    .eq("data", d.data)
    .maybeSingle();

  const total = Math.max(0, (existente?.palavras_novas ?? 0) + d.quantidade);

  const { error } = existente
    ? await supabase.from("registros_vocabulario").update({ palavras_novas: total }).eq("id", existente.id)
    : await supabase.from("registros_vocabulario").insert({
        user_id: userId,
        idioma_id: d.idiomaId,
        data: d.data,
        palavras_novas: total,
      });

  if (error) return { ok: false, total: 0, erro: error.message };
  revalidar();
  return { ok: true, total };
}

/** RN-408. Palavra ativada é a que já virou frase falada. */
export async function registrarAtivacao(
  idiomaId: string,
  quantidade: number,
): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();

  const { data: pendentes } = await supabase
    .from("registros_vocabulario")
    .select("id, palavras_novas, palavras_ativadas, data")
    .eq("idioma_id", idiomaId)
    .order("data");

  let restante = Math.max(0, Math.round(quantidade));
  for (const registro of pendentes ?? []) {
    if (restante <= 0) break;
    const saldo = registro.palavras_novas - registro.palavras_ativadas;
    if (saldo <= 0) continue;
    const soma = Math.min(saldo, restante);
    await supabase
      .from("registros_vocabulario")
      .update({ palavras_ativadas: registro.palavras_ativadas + soma })
      .eq("id", registro.id);
    restante -= soma;
  }

  revalidar();
  revalidatePath("/revisao");
  return { ok: true };
}

const acerto = z.object({
  idiomaId: z.string().uuid(),
  data: dataISO,
  pctDeck: z.coerce.number().int().min(0).max(100).nullish(),
  pctGramatica: z.coerce.number().int().min(0).max(100).nullish(),
});

/** RN-404. Informado quando ela quiser — o que interessa é a tendência. */
export async function registrarAcerto(
  bruta: z.input<typeof acerto>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = acerto.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  const { error } = await supabase.from("revisoes_flashcards").upsert(
    {
      user_id: userId,
      idioma_id: d.idiomaId,
      data: d.data,
      revisou: true,
      pct_acerto_deck: d.pctDeck ?? null,
      pct_acerto_gramatica: d.pctGramatica ?? null,
    },
    { onConflict: "user_id,idioma_id,data" },
  );

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

const criacao = z.object({
  idiomaId: z.string().uuid(),
  data: dataISO,
  minutos: z.coerce.number().int().min(1).max(480),
  palavras: z.coerce.number().int().min(1).max(500),
});

/** RN-405. Cronômetro do lote: devolve a faixa de velocidade A ou B. */
export async function registrarCriacaoDeLote(
  bruta: z.input<typeof criacao>,
): Promise<{ ok: boolean; minPorPalavra?: number; faixa?: string; erro?: string }> {
  const parsed = criacao.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const d = parsed.data;
  const velocidade = calcularVelocidade(d.minutos, d.palavras);
  if (!velocidade) return { ok: false, erro: "Informe minutos e palavras." };

  const { supabase, userId } = await sessao();
  const { data: existente } = await supabase
    .from("registros_vocabulario")
    .select("id, palavras_novas")
    .eq("idioma_id", d.idiomaId)
    .eq("data", d.data)
    .maybeSingle();

  const total = Math.max(d.palavras, existente?.palavras_novas ?? 0);
  const campos = {
    palavras_novas: total,
    minutos_criacao: d.minutos,
    min_por_palavra: Number(velocidade.minPorPalavra.toFixed(2)),
    faixa_velocidade: velocidade.faixa,
  };

  const { error } = existente
    ? await supabase.from("registros_vocabulario").update(campos).eq("id", existente.id)
    : await supabase
        .from("registros_vocabulario")
        .insert({ user_id: userId, idioma_id: d.idiomaId, data: d.data, ...campos });

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true, minPorPalavra: velocidade.minPorPalavra, faixa: velocidade.rotulo };
}

const lote = z.object({
  idiomaId: z.string().uuid(),
  data: dataISO,
  slug: z.enum(IDIOMAS_SLUG),
  texto: z.string().max(8000),
});

/**
 * RN-406 e RN-409. Roda a checagem e guarda **só o agregado**: quantos avisos.
 * O texto colado não é persistido, não vira cartão e não entra no backup.
 */
export async function checarLoteDoDia(
  bruta: z.input<typeof lote>,
): Promise<{ ok: boolean; avisos: Aviso[]; itens: number; erro?: string }> {
  const parsed = lote.safeParse(bruta);
  if (!parsed.success) return { ok: false, avisos: [], itens: 0, erro: parsed.error.issues[0].message };

  const d = parsed.data;
  const itens = separarItens(d.texto);
  const avisos = checarInterferencia(itens, { idioma: d.slug });

  const { supabase, userId } = await sessao();
  const { data: existente } = await supabase
    .from("registros_vocabulario")
    .select("id")
    .eq("idioma_id", d.idiomaId)
    .eq("data", d.data)
    .maybeSingle();

  const campos = { checagem_rodada: true, qtd_avisos_interferencia: avisos.length };

  if (existente) {
    await supabase.from("registros_vocabulario").update(campos).eq("id", existente.id);
  } else {
    await supabase
      .from("registros_vocabulario")
      .insert({ user_id: userId, idioma_id: d.idiomaId, data: d.data, ...campos });
  }

  revalidatePath("/flashcards");
  return { ok: true, avisos, itens: itens.length };
}
