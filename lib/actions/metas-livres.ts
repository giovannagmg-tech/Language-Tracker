"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { supabaseServidor } from "@/lib/supabase/server";

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

function revalidar() {
  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const entrada = z.object({
  titulo: z.string().trim().min(1, "A meta precisa de um nome.").max(120),
  idiomaId: z.string().uuid().nullish(),
  unidade: z.string().trim().min(1).max(24).default("unidade"),
  alvo: z.coerce.number().int().min(1, "O alvo começa em 1.").max(100_000),
  prazo: dataISO.nullish(),
  nota: z.string().trim().max(500).nullish(),
});

export type EntradaMetaLivre = z.input<typeof entrada>;

export async function criarMetaLivre(
  bruta: EntradaMetaLivre,
): Promise<{ ok: boolean; erro?: string; id?: string }> {
  const parsed = entrada.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  const { data, error } = await supabase
    .from("metas_livres")
    .insert({
      user_id: userId,
      titulo: d.titulo,
      idioma_id: d.idiomaId ?? null,
      unidade: d.unidade,
      alvo: d.alvo,
      prazo: d.prazo ?? null,
      nota: d.nota || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true, id: data.id };
}

export async function editarMetaLivre(
  id: string,
  bruta: EntradaMetaLivre,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = entrada.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "Meta inválida." };

  const { supabase } = await sessao();
  const d = parsed.data;

  const { error } = await supabase
    .from("metas_livres")
    .update({
      titulo: d.titulo,
      idioma_id: d.idiomaId ?? null,
      unidade: d.unidade,
      alvo: d.alvo,
      prazo: d.prazo ?? null,
      nota: d.nota || null,
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

/**
 * Soma (ou subtrai) no progresso. A conclusão é consequência de chegar no
 * alvo, nunca um estado marcado à mão — o banco recusa `concluida_em` com
 * `feito < alvo`, e é essa recusa que impede o número de mentir.
 */
export async function avancarMetaLivre(
  id: string,
  passo: number,
): Promise<{ ok: boolean; erro?: string; feito?: number; concluida?: boolean }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "Meta inválida." };
  if (!Number.isInteger(passo) || passo === 0 || Math.abs(passo) > 1000) {
    return { ok: false, erro: "Passo inválido." };
  }

  const { supabase } = await sessao();

  const { data: atual, error: erroLeitura } = await supabase
    .from("metas_livres")
    .select("feito, alvo, concluida_em")
    .eq("id", id)
    .single();

  if (erroLeitura || !atual) return { ok: false, erro: "Meta não encontrada." };

  const feito = Math.min(100_000, Math.max(0, atual.feito + passo));
  const concluida = feito >= atual.alvo;

  const { error } = await supabase
    .from("metas_livres")
    .update({
      feito,
      // Voltar abaixo do alvo desfaz a conclusão; manter a data seria mentira.
      concluida_em: concluida ? (atual.concluida_em ?? hojeLocal()) : null,
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true, feito, concluida };
}

export async function arquivarMetaLivre(
  id: string,
  ativa: boolean,
): Promise<{ ok: boolean; erro?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "Meta inválida." };

  const { supabase } = await sessao();
  const { error } = await supabase.from("metas_livres").update({ ativa }).eq("id", id);
  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

export async function excluirMetaLivre(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "Meta inválida." };

  const { supabase } = await sessao();
  const { error } = await supabase.from("metas_livres").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}
