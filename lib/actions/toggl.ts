"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  MAXIMO_DE_LINHAS,
  classificarLinhas,
  resumir,
  type LinhaClassificada,
  type LinhaToggl,
  type RegraMapeamento,
  type ResumoImportacao,
  type SessaoExistente,
} from "@/lib/domain/toggl";
import { ATIVIDADES, PILARES, TEMPOS } from "@/lib/domain/tipos";
import { sincronizarConquistas } from "@/lib/motores/conquistas";
import { supabaseServidor } from "@/lib/supabase/server";

const linhaSchema = z.object({
  numero: z.number().int(),
  project: z.string(),
  description: z.string(),
  tags: z.string(),
  client: z.string(),
  task: z.string(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  horaInicio: z.string().nullable(),
  duracaoMin: z.number().int().min(0),
  erro: z.string().nullable(),
});

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

async function carregarRegras(): Promise<RegraMapeamento[]> {
  const { supabase } = await sessao();
  const { data } = await supabase
    .from("regras_mapeamento_toggl")
    .select("id, ordem, campo, operador, valor, saida_idioma, saida_atividade, saida_pilar, saida_tempo, ativa")
    .order("ordem");

  return (data ?? []).map((r) => ({
    id: r.id,
    ordem: r.ordem,
    campo: r.campo,
    operador: r.operador,
    valor: r.valor,
    saidaIdioma: r.saida_idioma,
    saidaAtividade: r.saida_atividade,
    saidaPilar: r.saida_pilar,
    saidaTempo: r.saida_tempo,
    ativa: r.ativa,
  }));
}

export type Analise = {
  ok: boolean;
  erro?: string;
  linhas: LinhaClassificada[];
  resumo: ResumoImportacao;
};

/**
 * RN-1005. Passo 2 do fluxo: o arquivo já foi lido no navegador; aqui o
 * servidor aplica as regras salvas e confronta com o que já existe.
 * Nada é gravado — a pré-visualização é obrigatória antes de confirmar.
 */
export async function analisarImportacao(linhasBrutas: unknown): Promise<Analise> {
  const parsed = z.array(linhaSchema).max(MAXIMO_DE_LINHAS).safeParse(linhasBrutas);
  if (!parsed.success) {
    return {
      ok: false,
      erro: `Arquivo grande demais ou em formato inesperado (máximo de ${MAXIMO_DE_LINHAS} linhas).`,
      linhas: [],
      resumo: resumir([]),
    };
  }

  const linhas = parsed.data as LinhaToggl[];
  const datas = linhas.map((l) => l.data).filter((d): d is string => d !== null).sort();

  const { supabase } = await sessao();
  const regras = await carregarRegras();

  const { data: existentesRaw } = datas.length
    ? await supabase
        .from("sessoes")
        .select("id, data, idioma_id, atividade, duracao_min, origem, chave_toggl")
        .gte("data", datas[0])
        .lte("data", datas[datas.length - 1])
    : { data: [] };

  const existentes: SessaoExistente[] = (existentesRaw ?? []).map((s) => ({
    id: s.id,
    data: s.data,
    idiomaId: s.idioma_id,
    atividade: s.atividade,
    duracaoMin: s.duracao_min,
    origem: s.origem,
    chaveToggl: s.chave_toggl,
  }));

  const classificadas = classificarLinhas(linhas, regras, existentes);
  return { ok: true, linhas: classificadas, resumo: resumir(classificadas) };
}

const paraImportar = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().nullable(),
  duracaoMin: z.number().int().min(1).max(480),
  idiomaId: z.string().uuid(),
  atividade: z.enum(ATIVIDADES),
  pilar: z.enum(PILARES).nullable(),
  tempo: z.enum(TEMPOS),
  categoria: z.enum(["ativo", "imersao"]),
  producao: z.boolean(),
  chave: z.string(),
  nota: z.string().max(500).nullable(),
  /** Quando preenchido, a sessão manual conflitante é substituída. */
  substituirSessaoId: z.string().uuid().nullish(),
});

export type ResultadoImportacao = {
  ok: boolean;
  erro?: string;
  loteId?: string;
  importadas: number;
  substituidas: number;
};

/**
 * RN-1005 e RN-1006. Grava o lote inteiro ou nada, e recalcula as conquistas
 * sobre o histórico recém-chegado.
 */
export async function confirmarImportacao(
  nome: string,
  linhas: unknown,
  contagens: { duplicadas: number; conflitos: number; revisadas: number },
): Promise<ResultadoImportacao> {
  const parsed = z.array(paraImportar).max(MAXIMO_DE_LINHAS).safeParse(linhas);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0].message, importadas: 0, substituidas: 0 };
  }
  if (parsed.data.length === 0) {
    return { ok: false, erro: "Nada para importar.", importadas: 0, substituidas: 0 };
  }

  const { supabase, userId } = await sessao();
  const datas = parsed.data.map((l) => l.data).sort();

  const { data: lote, error: erroLote } = await supabase
    .from("lotes_importacao")
    .insert({
      user_id: userId,
      arquivo_nome: nome.slice(0, 200),
      intervalo_inicio: datas[0],
      intervalo_fim: datas[datas.length - 1],
      linhas_total: parsed.data.length + contagens.duplicadas + contagens.conflitos,
      importadas: parsed.data.length,
      ignoradas: contagens.duplicadas,
      conflitos: contagens.conflitos,
      revisadas_manualmente: contagens.revisadas,
    })
    .select("id")
    .single();

  if (erroLote || !lote) {
    return { ok: false, erro: erroLote?.message ?? "Não deu para abrir o lote.", importadas: 0, substituidas: 0 };
  }

  const aSubstituir = parsed.data
    .map((l) => l.substituirSessaoId)
    .filter((id): id is string => typeof id === "string");

  if (aSubstituir.length > 0) {
    await supabase.from("sessoes").delete().in("id", aSubstituir);
  }

  const { error } = await supabase.from("sessoes").insert(
    parsed.data.map((l) => ({
      user_id: userId,
      idioma_id: l.idiomaId,
      data: l.data,
      hora_inicio: l.horaInicio,
      duracao_min: l.duracaoMin,
      categoria: l.categoria,
      pilar: l.pilar,
      atividade: l.atividade,
      tempo: l.tempo,
      producao: l.producao,
      minutos_fala: 0,
      nota: l.nota,
      origem: "toggl" as const,
      via: "formulario" as const,
      chave_toggl: l.chave,
      lote_importacao: lote.id,
    })),
  );

  if (error) {
    // Lote pela metade é pior que lote nenhum: desfaz o cabeçalho.
    await supabase.from("lotes_importacao").delete().eq("id", lote.id);
    return { ok: false, erro: error.message, importadas: 0, substituidas: 0 };
  }

  await sincronizarConquistas();

  revalidatePath("/importacao");
  revalidatePath("/dashboard");
  revalidatePath("/hoje");
  revalidatePath("/conquistas");

  return {
    ok: true,
    loteId: lote.id,
    importadas: parsed.data.length,
    substituidas: aSubstituir.length,
  };
}

/** RN-1006. Desfazer remove as sessões do lote e recalcula. */
export async function desfazerLote(loteId: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();

  const { error } = await supabase.from("sessoes").delete().eq("lote_importacao", loteId);
  if (error) return { ok: false, erro: error.message };

  await supabase
    .from("lotes_importacao")
    .update({ desfeito_em: new Date().toISOString() })
    .eq("id", loteId);

  await sincronizarConquistas();

  revalidatePath("/importacao");
  revalidatePath("/dashboard");
  return { ok: true };
}

const regraSchema = z.object({
  ordem: z.coerce.number().int().min(0).max(9999),
  campo: z.enum(["project", "description", "tags", "client", "task"]),
  operador: z.enum(["contem", "igual", "regex"]),
  valor: z.string().min(1, "A regra precisa de um valor.").max(200),
  saidaIdioma: z.string().uuid().nullable(),
  saidaAtividade: z.enum(ATIVIDADES).nullable(),
  saidaPilar: z.enum(PILARES).nullable(),
  saidaTempo: z.enum(TEMPOS).nullable(),
  ativa: z.boolean().default(true),
});

export async function salvarRegra(
  bruta: z.input<typeof regraSchema>,
  id?: string,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = regraSchema.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;
  const campos = {
    ordem: d.ordem,
    campo: d.campo,
    operador: d.operador,
    valor: d.valor,
    saida_idioma: d.saidaIdioma,
    saida_atividade: d.saidaAtividade,
    saida_pilar: d.saidaPilar,
    saida_tempo: d.saidaTempo,
    ativa: d.ativa,
  };

  const { error } = id
    ? await supabase.from("regras_mapeamento_toggl").update(campos).eq("id", id)
    : await supabase.from("regras_mapeamento_toggl").insert({ user_id: userId, ...campos });

  if (error) return { ok: false, erro: error.message };
  revalidatePath("/importacao");
  return { ok: true };
}

export async function removerRegra(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase.from("regras_mapeamento_toggl").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/importacao");
  return { ok: true };
}
