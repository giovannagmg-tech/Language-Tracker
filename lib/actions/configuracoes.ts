"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

// ---------------------------------------------------------------------------
// RN-1101 — gatilhos dos alertas
// ---------------------------------------------------------------------------

const alertas = z.object({
  horaAperto: z.coerce.number().int().min(0).max(23),
  diasParaRetomada: z.coerce.number().int().min(1).max(60),
  metaPctAtivo: z.coerce.number().min(0).max(1),
  metaMinFalaSemana: z.coerce.number().int().min(0).max(1000),
  metaDiasFlashSemana: z.coerce.number().int().min(0).max(7),
  lacunaAlerta: z.coerce.number().int().min(1).max(30),
  limiarDesvioPilar: z.coerce.number().min(0).max(1),
  limiarConcentracao: z.coerce.number().min(0).max(1),
  loteMinimoChecagem: z.coerce.number().int().min(1).max(100),
});

export async function salvarAlertas(
  bruta: z.input<typeof alertas>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = alertas.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  const { error } = await supabase
    .from("config")
    .update({
      hora_aperto: d.horaAperto,
      dias_para_retomada: d.diasParaRetomada,
      meta_pct_ativo: d.metaPctAtivo,
      meta_min_fala_semana: d.metaMinFalaSemana,
      meta_dias_flash_semana: d.metaDiasFlashSemana,
      lacuna_alerta: d.lacunaAlerta,
      limiar_desvio_pilar: d.limiarDesvioPilar,
      limiar_concentracao: d.limiarConcentracao,
      lote_minimo_checagem: d.loteMinimoChecagem,
    })
    .eq("user_id", userId);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/hoje");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function salvarTema(
  tema: "claro" | "escuro" | "sistema",
): Promise<{ ok: boolean }> {
  const { supabase, userId } = await sessao();
  await supabase.from("config").update({ tema }).eq("user_id", userId);
  revalidatePath("/configuracoes");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Idiomas e camadas
// ---------------------------------------------------------------------------

const idioma = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1).max(40),
  bandeira: z.string().max(8),
  nivelInicial: z.enum(NIVEIS),
  nivelAtual: z.enum(NIVEIS),
  nivelMeta: z.enum(NIVEIS),
  dataMetaNivel: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  palavrasBase: z.coerce.number().int().min(0).max(100_000),
  metaPalavrasDia: z.coerce.number().int().min(0).max(100),
  ativo: z.coerce.boolean(),
});

export async function salvarIdioma(
  bruta: z.input<typeof idioma>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = idioma.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase } = await sessao();
  const d = parsed.data;

  const { error } = await supabase
    .from("idiomas")
    .update({
      nome: d.nome,
      bandeira: d.bandeira,
      nivel_inicial: d.nivelInicial,
      nivel_atual: d.nivelAtual,
      nivel_meta: d.nivelMeta,
      data_meta_nivel: d.dataMetaNivel ?? null,
      palavras_base: d.palavrasBase,
      meta_palavras_dia: d.metaPalavrasDia,
      ativo: d.ativo,
    })
    .eq("id", d.id);

  if (error) return { ok: false, erro: error.message };

  await supabase
    .from("metas")
    .update({ valor_alvo: d.metaPalavrasDia })
    .eq("idioma_id", d.id)
    .eq("indicador", "palavras_dia");

  revalidatePath("/configuracoes");
  revalidatePath("/metas");
  revalidatePath("/hoje");
  return { ok: true };
}

const camada = z.object({
  numero: z.coerce.number().int().min(1).max(9),
  nome: z.string().min(1).max(40),
  limiar: z.coerce.number().int().min(1).max(200_000),
});

export async function salvarCamadas(
  brutas: z.input<typeof camada>[],
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = z.array(camada).min(1).safeParse(brutas);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const limiares = parsed.data.map((c) => c.limiar);
  if (limiares.some((l, i) => i > 0 && l <= limiares[i - 1])) {
    return { ok: false, erro: "Os limiares precisam ser crescentes." };
  }

  const { supabase, userId } = await sessao();
  for (const c of parsed.data) {
    await supabase
      .from("camadas")
      .update({ nome: c.nome, limiar: c.limiar })
      .eq("user_id", userId)
      .eq("numero", c.numero);
  }

  revalidatePath("/configuracoes");
  revalidatePath("/metas");
  revalidatePath("/flashcards");
  return { ok: true };
}
