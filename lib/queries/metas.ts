import "server-only";
import { cache } from "react";
import {
  acumuladoDe,
  progressoCamada,
  type Camada,
  type FaixaFrequencia,
  type ProgressoCamada,
} from "@/lib/domain/camadas";
import { hoje as hojeLocal, mesDe, semanaDe, somaDias } from "@/lib/domain/datas";
import {
  avaliarMetaLivre,
  ordenarMetasLivres,
  resumoDaLista,
  type MetaLivreAvaliada,
} from "@/lib/domain/metas-livres";
import { progressoMeta, type ProgressoMeta } from "@/lib/domain/metas";
import { progressoNivel } from "@/lib/domain/niveis";
import {
  cobertura,
  composicao,
  falaPorSemana,
  flashcardsPorSemana,
  mediaSemanal,
} from "@/lib/domain/metrics";
import type { RevisaoDominio, SessaoDominio } from "@/lib/domain/modelos";
import type { Atividade, Categoria, Nivel, Pilar, TempoDoDia } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type { MetaLivreAvaliada };

export type MetaPainel = {
  id: string;
  titulo: string;
  indicador: string;
  progresso: ProgressoMeta;
  formato: "numero" | "percentual" | "dias";
};

export type MetaPalavras = {
  idioma: IdiomaResumo;
  metaDia: number;
  feitoHoje: number;
  progressoDia: ProgressoMeta;
  media7d: number;
  camada: ProgressoCamada;
  projecaoDias: number | null;
};

export type MetaNivel = {
  idioma: IdiomaResumo;
  inicial: Nivel;
  atual: Nivel;
  meta: Nivel;
  progresso: number;
  dataAlvo: string | null;
  diasRestantes: number | null;
  autoavaliacaoPendente: boolean;
};

export type MetaConversacao = {
  conversasSemana: ProgressoMeta;
  falaSemana: ProgressoMeta;
  audioSemana: boolean;
};

export type FocoDoMes = {
  blocoId: string | null;
  nomeBloco: string | null;
  idiomaId: string | null;
  pilar: Pilar | null;
  nota: string | null;
};

export type EstadoMetas = {
  hoje: string;
  idiomas: IdiomaResumo[];
  metasLivres: MetaLivreAvaliada[];
  resumoMetasLivres: { total: number; concluidas: number; atrasadas: number };
  painelMensal: MetaPainel[];
  palavras: MetaPalavras[];
  niveis: MetaNivel[];
  conversacao: MetaConversacao;
  foco: FocoDoMes;
  blocoVigenteId: string | null;
};

const FORMATO: Record<string, MetaPainel["formato"]> = {
  dias_registro: "dias",
  pct_ativo: "percentual",
  min_fala_semana: "numero",
  dias_flash_semana: "numero",
  maior_lacuna: "dias",
};

export const carregarMetas = cache(async function carregarMetas(): Promise<EstadoMetas> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const mes = mesDe(hoje);
  const semana = semanaDe(hoje);

  const [
    { data: config },
    { data: idiomasRaw },
    { data: metasRaw },
    { data: camadasRaw },
    { data: sessoesRaw },
    { data: revisoesRaw },
    { data: vocabRaw },
    { data: blocoRaw },
    { data: tarefasRaw },
    { data: metasLivresRaw },
  ] = await Promise.all([
    supabase.from("config").select("faixas_frequencia").maybeSingle(),
    supabase
      .from("idiomas")
      .select("id, slug, nome, bandeira, cor, palavras_base, meta_palavras_dia, nivel_inicial, nivel_atual, nivel_meta, data_meta_nivel")
      .eq("ativo", true)
      .order("ordem"),
    supabase.from("metas").select("id, tipo, idioma_id, titulo, indicador, valor_base, valor_alvo, direcao, periodicidade, data_alvo, cor, ativa").eq("ativa", true),
    supabase.from("camadas").select("numero, nome, limiar").order("limiar"),
    supabase
      .from("sessoes")
      .select("id, data, idioma_id, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, producao, violou_regra_5")
      .gte("data", mes.inicio)
      .lte("data", mes.fim),
    supabase
      .from("revisoes_flashcards")
      .select("data, idioma_id, revisou")
      .gte("data", mes.inicio)
      .lte("data", mes.fim),
    supabase.from("registros_vocabulario").select("data, idioma_id, palavras_novas"),
    supabase
      .from("blocos_plano")
      .select("id, nome, foco_mes_idioma, foco_mes_pilar, foco_mes_nota")
      .lte("data_inicio", hoje)
      .gte("data_fim", hoje)
      .maybeSingle(),
    supabase.from("tarefas").select("idioma_id").eq("tipo", "autoavaliacao").eq("estado", "aberta"),
    supabase
      .from("metas_livres")
      .select("id, idioma_id, titulo, unidade, alvo, feito, prazo, concluida_em, criado_em, ativa, nota")
      .eq("ativa", true),
  ]);

  const idiomas: IdiomaResumo[] = (idiomasRaw ?? []).map((i) => ({
    id: i.id,
    slug: i.slug,
    nome: i.nome,
    bandeira: i.bandeira,
    cor: i.cor,
  }));

  const sessoes: SessaoDominio[] = (sessoesRaw ?? []).map((s) => ({
    id: s.id,
    data: s.data,
    idiomaId: s.idioma_id,
    duracaoMin: s.duracao_min,
    categoria: s.categoria as Categoria,
    pilar: s.pilar as Pilar | null,
    atividade: s.atividade as Atividade,
    tempo: s.tempo as TempoDoDia,
    minutosFala: s.minutos_fala,
    producao: s.producao,
    violouRegra5: s.violou_regra_5,
  }));

  const revisoes: RevisaoDominio[] = (revisoesRaw ?? []).map((r) => ({
    data: r.data,
    idiomaId: r.idioma_id,
    revisou: r.revisou,
  }));

  const doMes = composicao(sessoes);
  const cob = cobertura(sessoes, revisoes, mes, hoje);
  const mediaFala = mediaSemanal(falaPorSemana(sessoes, mes));
  const mediaFlash = mediaSemanal(flashcardsPorSemana(sessoes, revisoes, mes));

  const atualDo = (indicador: string): number => {
    if (indicador === "dias_registro") return cob.diasComRegistro;
    if (indicador === "pct_ativo") return doMes.pctAtivo;
    if (indicador === "min_fala_semana") return mediaFala;
    if (indicador === "dias_flash_semana") return mediaFlash;
    if (indicador === "maior_lacuna") return cob.lacuna.dias;
    return 0;
  };

  const painelMensal: MetaPainel[] = (metasRaw ?? [])
    .filter((m) => m.tipo === "painel_mensal")
    .map((m) => ({
      id: m.id,
      titulo: m.titulo,
      indicador: m.indicador,
      formato: FORMATO[m.indicador] ?? "numero",
      progresso: progressoMeta({
        atual: atualDo(m.indicador),
        base: Number(m.valor_base),
        alvo: Number(m.valor_alvo),
        direcao: m.direcao,
      }),
    }));

  const camadas: Camada[] = (camadasRaw ?? []).map((c) => ({
    numero: c.numero,
    nome: c.nome,
    limiar: c.limiar,
  }));
  const faixas = (config?.faixas_frequencia ?? []) as FaixaFrequencia[];

  const palavras: MetaPalavras[] = (idiomasRaw ?? []).map((i) => {
    const registros = (vocabRaw ?? [])
      .filter((v) => v.idioma_id === i.id)
      .map((v) => ({ data: v.data, idiomaId: v.idioma_id, palavrasNovas: v.palavras_novas }));

    const feitoHoje = registros
      .filter((r) => r.data === hoje)
      .reduce((t, r) => t + r.palavrasNovas, 0);

    const inicio7d = somaDias(hoje, -6);
    const media7d =
      registros
        .filter((r) => r.data >= inicio7d && r.data <= hoje)
        .reduce((t, r) => t + r.palavrasNovas, 0) / 7;

    const camada = progressoCamada(acumuladoDe(i.palavras_base, registros), camadas, faixas);

    return {
      idioma: { id: i.id, slug: i.slug, nome: i.nome, bandeira: i.bandeira, cor: i.cor },
      metaDia: i.meta_palavras_dia,
      feitoHoje,
      progressoDia: progressoMeta({ atual: feitoHoje, base: 0, alvo: Math.max(1, i.meta_palavras_dia) }),
      media7d,
      camada,
      projecaoDias: media7d > 0 ? Math.ceil(camada.faltam / media7d) : null,
    };
  });

  const pendentesAuto = new Set((tarefasRaw ?? []).map((t) => t.idioma_id));

  const niveis: MetaNivel[] = (idiomasRaw ?? []).map((i) => {
    const dias = i.data_meta_nivel
      ? Math.round(
          (new Date(`${i.data_meta_nivel}T12:00:00Z`).getTime() -
            new Date(`${hoje}T12:00:00Z`).getTime()) /
            86_400_000,
        )
      : null;
    return {
      idioma: { id: i.id, slug: i.slug, nome: i.nome, bandeira: i.bandeira, cor: i.cor },
      inicial: i.nivel_inicial,
      atual: i.nivel_atual,
      meta: i.nivel_meta,
      progresso: progressoNivel(i.nivel_inicial, i.nivel_atual, i.nivel_meta),
      dataAlvo: i.data_meta_nivel,
      diasRestantes: dias,
      autoavaliacaoPendente: pendentesAuto.has(i.id),
    };
  });

  const daSemana = sessoes.filter((s) => s.data >= semana.inicio && s.data <= semana.fim);
  const metaConversas = (metasRaw ?? []).find((m) => m.indicador === "conversas_semana");
  const metaFala = (metasRaw ?? []).find(
    (m) => m.indicador === "min_fala_semana" && m.tipo === "conversacao",
  );

  const conversacao: MetaConversacao = {
    conversasSemana: progressoMeta({
      atual: daSemana.filter((s) => s.atividade === "conversacao" || s.atividade === "aula").length,
      base: 0,
      alvo: Number(metaConversas?.valor_alvo ?? 1),
    }),
    falaSemana: progressoMeta({
      atual: daSemana.reduce((t, s) => t + s.minutosFala, 0),
      base: 0,
      alvo: Number(metaFala?.valor_alvo ?? 60),
    }),
    audioSemana: daSemana.some((s) => s.atividade === "audio_grupo"),
  };

  const metasLivres = ordenarMetasLivres(
    (metasLivresRaw ?? []).map((m) =>
      avaliarMetaLivre(
        {
          id: m.id,
          idiomaId: m.idioma_id,
          titulo: m.titulo,
          unidade: m.unidade,
          alvo: m.alvo,
          feito: m.feito,
          prazo: m.prazo,
          concluidaEm: m.concluida_em,
          // `criado_em` é timestamptz; o dia civil é o que a regra usa.
          criadaEm: m.criado_em.slice(0, 10),
          ativa: m.ativa,
        },
        hoje,
      ),
    ),
  );

  return {
    hoje,
    idiomas,
    metasLivres,
    resumoMetasLivres: resumoDaLista(metasLivres),
    painelMensal,
    palavras,
    niveis,
    conversacao,
    foco: {
      blocoId: blocoRaw?.id ?? null,
      nomeBloco: blocoRaw?.nome ?? null,
      idiomaId: blocoRaw?.foco_mes_idioma ?? null,
      pilar: (blocoRaw?.foco_mes_pilar as Pilar | null) ?? null,
      nota: blocoRaw?.foco_mes_nota ?? null,
    },
    blocoVigenteId: blocoRaw?.id ?? null,
  };
});
