"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { NIVEIS } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

const edicao = z.object({
  id: z.string().uuid(),
  valorAlvo: z.coerce.number().min(0),
  valorBase: z.coerce.number().min(0).optional(),
  dataAlvo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  ativa: z.coerce.boolean().optional(),
});

export async function editarMeta(
  bruta: z.input<typeof edicao>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = edicao.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase } = await sessao();
  const d = parsed.data;
  const { error } = await supabase
    .from("metas")
    .update({
      valor_alvo: d.valorAlvo,
      ...(d.valorBase !== undefined ? { valor_base: d.valorBase } : {}),
      ...(d.dataAlvo !== undefined ? { data_alvo: d.dataAlvo } : {}),
      ...(d.ativa !== undefined ? { ativa: d.ativa } : {}),
    })
    .eq("id", d.id);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Meta de palavras por dia mora no idioma — é dela que a tela Hoje puxa. */
export async function editarMetaPalavras(
  idiomaId: string,
  metaDia: number,
): Promise<{ ok: boolean; erro?: string }> {
  const valor = Math.max(0, Math.round(metaDia));
  const { supabase } = await sessao();

  const { error } = await supabase
    .from("idiomas")
    .update({ meta_palavras_dia: valor })
    .eq("id", idiomaId);
  if (error) return { ok: false, erro: error.message };

  await supabase
    .from("metas")
    .update({ valor_alvo: valor })
    .eq("idioma_id", idiomaId)
    .eq("indicador", "palavras_dia");

  revalidatePath("/metas");
  revalidatePath("/hoje");
  return { ok: true };
}

const autoavaliacao = z.object({
  idiomaId: z.string().uuid(),
  blocoId: z.string().uuid(),
  nivel: z.enum(NIVEIS),
  observacao: z.string().max(1000).nullish(),
  pontosFortes: z.string().max(500).nullish(),
  pontosFracos: z.string().max(500).nullish(),
});

/**
 * RN-504. Fecha o bloco: grava a avaliação, atualiza o nível atual do idioma
 * e conclui a tarefa automática correspondente.
 */
export async function registrarAutoavaliacao(
  bruta: z.input<typeof autoavaliacao>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = autoavaliacao.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  const { data: idioma } = await supabase
    .from("idiomas")
    .select("nivel_atual")
    .eq("id", d.idiomaId)
    .maybeSingle();
  if (!idioma) return { ok: false, erro: "Idioma não encontrado." };

  const { error } = await supabase.from("autoavaliacoes").upsert(
    {
      user_id: userId,
      idioma_id: d.idiomaId,
      bloco_id: d.blocoId,
      data: hojeLocal(),
      nivel_declarado: d.nivel,
      nivel_anterior: idioma.nivel_atual,
      observacao: d.observacao ?? null,
      pontos_fortes: d.pontosFortes ?? null,
      pontos_fracos: d.pontosFracos ?? null,
    },
    { onConflict: "user_id,idioma_id,bloco_id" },
  );

  if (error) return { ok: false, erro: error.message };

  await supabase.from("idiomas").update({ nivel_atual: d.nivel }).eq("id", d.idiomaId);

  await supabase
    .from("tarefas")
    .update({ estado: "concluida", concluida_em: hojeLocal(), quantidade_feita: 1 })
    .eq("tipo", "autoavaliacao")
    .eq("idioma_id", d.idiomaId)
    .eq("estado", "aberta");

  revalidatePath("/metas");
  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  return { ok: true };
}
