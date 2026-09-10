"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bandeiraValida, corValida, slugLivre } from "@/lib/domain/idiomas";
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

// ---------------------------------------------------------------------------
// Criar idioma
// ---------------------------------------------------------------------------

const idiomaNovo = z.object({
  nome: z.string().trim().min(1, "O idioma precisa de um nome.").max(40),
  bandeira: z.string().trim().max(8).default(""),
  cor: z.string().trim(),
  nivelAtual: z.enum(NIVEIS).default("A0"),
  nivelMeta: z.enum(NIVEIS).default("B2.1"),
  metaPalavrasDia: z.coerce.number().int().min(0).max(100).default(5),
  ativo: z.coerce.boolean().default(true),
});

/**
 * Um idioma novo não é só uma linha em `idiomas`: sem as metas de palavras e
 * de nível ele apareceria na tela de Metas como um buraco, e sem sincronizar
 * as conquistas as `por_idioma` dele nasceriam faltando. As três coisas andam
 * juntas ou o idioma nasce quebrado.
 */
export async function criarIdioma(
  bruta: z.input<typeof idiomaNovo>,
): Promise<{ ok: boolean; erro?: string; id?: string }> {
  const parsed = idiomaNovo.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const d = parsed.data;
  if (!corValida(d.cor)) return { ok: false, erro: "Cor inválida — use algo como #2F6FED." };
  if (!bandeiraValida(d.bandeira)) {
    return { ok: false, erro: "Bandeira precisa ser um emoji, não texto." };
  }

  const { supabase, userId } = await sessao();

  const { data: existentes } = await supabase.from("idiomas").select("slug, ordem");
  const slug = slugLivre(
    d.nome,
    (existentes ?? []).map((i) => i.slug),
  );
  const ordem = Math.max(0, ...(existentes ?? []).map((i) => i.ordem)) + 1;

  const { data: criado, error } = await supabase
    .from("idiomas")
    .insert({
      user_id: userId,
      slug,
      nome: d.nome,
      bandeira: d.bandeira,
      cor: d.cor,
      ordem,
      ativo: d.ativo,
      nivel_inicial: d.nivelAtual,
      nivel_atual: d.nivelAtual,
      nivel_meta: d.nivelMeta,
      meta_palavras_dia: d.metaPalavrasDia,
    })
    .select("id")
    .single();

  if (error) return { ok: false, erro: error.message };

  const { error: erroMetas } = await supabase.from("metas").insert([
    {
      user_id: userId,
      tipo: "palavras" as const,
      idioma_id: criado.id,
      titulo: `Palavras novas por dia — ${d.nome}`,
      indicador: "palavras_dia",
      valor_alvo: d.metaPalavrasDia,
      periodicidade: "dia" as const,
      cor: "longo_prazo" as const,
    },
    {
      user_id: userId,
      tipo: "nivel" as const,
      idioma_id: criado.id,
      titulo: `Nível — ${d.nome}`,
      indicador: "nivel",
      valor_alvo: 1,
      periodicidade: "bloco" as const,
      cor: "longo_prazo" as const,
    },
  ]);

  if (erroMetas) {
    // Idioma sem metas é idioma quebrado: desfaz em vez de deixar pela metade.
    await supabase.from("idiomas").delete().eq("id", criado.id);
    return { ok: false, erro: `Idioma não criado: ${erroMetas.message}` };
  }

  await supabase.rpc("sincronizar_conquistas", { uid: userId });

  revalidatePath("/configuracoes");
  revalidatePath("/metas");
  revalidatePath("/hoje");
  revalidatePath("/dashboard");
  revalidatePath("/calendario");
  revalidatePath("/conquistas");
  return { ok: true, id: criado.id };
}
