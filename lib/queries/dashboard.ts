import "server-only";
import { cache } from "react";
import {
  acumuladoDe,
  diasParaProximaCamada,
  mediaMovel7d,
  progressoCamada,
  type Camada,
  type FaixaFrequencia,
  type ProgressoCamada,
} from "@/lib/domain/camadas";
import {
  anoDe,
  hoje as hojeLocal,
  mesDe,
  semanaDe,
  somaDias,
  type DataISO,
} from "@/lib/domain/datas";
import { diagnosticar, type Diagnostico } from "@/lib/domain/diagnostico";
import {
  cobertura,
  composicao,
  concentracao,
  diaComFlashcards,
  distribuicaoPilares,
  distribuicaoPorDiaSemana,
  distribuicaoPorHora,
  distribuicaoTempos,
  falaPorSemana,
  flashcardsPorSemana,
  maiorDesvioPilar,
  medianaDiaria,
  mediaSemanal,
  minutosPorIdioma,
  minutosProducao,
  noPeriodo,
  serieTemporal,
  sessoesProducao,
  type Composicao,
  type Cobertura,
  type FatiaIdioma,
  type FatiaPilar,
  type FatiaTempo,
  type Periodo,
  type PontoSerie,
  type PorDiaSemana,
  type PorHora,
  type SemanaValor,
} from "@/lib/domain/metrics";
import type { RevisaoDominio, SessaoDominio } from "@/lib/domain/modelos";
import { PILARES, type Atividade, type Categoria, type Marcha, type Pilar, type TempoDoDia } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type Recorte = "semana" | "mes" | "ano";

type SessaoComHora = SessaoDominio & { horaInicio: string | null };

export type FaixaMarcha = { numero: Marcha; inicio: DataISO; fim: DataISO };

export type CamadaDeIdioma = {
  idioma: IdiomaResumo;
  progresso: ProgressoCamada;
  mediaDiaria7d: number;
  projecaoDias: number | null;
};

export type EstadoDashboard = {
  recorte: Recorte;
  periodo: Periodo;
  rotuloPeriodo: string;
  anterior: DataISO;
  proximo: DataISO | null;
  hoje: DataISO;
  idiomas: IdiomaResumo[];
  composicao: Composicao;
  composicaoAnterior: Composicao;
  cobertura: Cobertura;
  coberturaAnterior: Cobertura;
  pilares: FatiaPilar[];
  tempos: FatiaTempo[];
  porIdioma: FatiaIdioma[];
  serie: PontoSerie[];
  granularidade: "dia" | "semana";
  faixasMarcha: FaixaMarcha[];
  fala: SemanaValor[];
  mediaFala: number;
  flashcards: SemanaValor[];
  mediaFlashcards: number;
  diasComFlashcards: DataISO[];
  porHora: PorHora;
  porDiaSemana: PorDiaSemana;
  camadas: CamadaDeIdioma[];
  concentracaoTop3: { pct: number; dias: { data: DataISO; minutos: number }[] };
  concentracaoTop10: { pct: number; dias: { data: DataISO; minutos: number }[] };
  medianaDiaria: number;
  producaoMin: number;
  producaoSessoes: number;
  diagnostico: Diagnostico[];
  metaPctAtivo: number;
  metaFalaSemana: number;
  metaFlashSemana: number;
};

function periodoDe(recorte: Recorte, referencia: DataISO): Periodo {
  if (recorte === "semana") return semanaDe(referencia);
  if (recorte === "mes") return mesDe(referencia);
  return anoDe(referencia);
}

function periodoAnterior(recorte: Recorte, periodo: Periodo): Periodo {
  const antes = somaDias(periodo.inicio, -1);
  return periodoDe(recorte, antes);
}

function rotular(recorte: Recorte, p: Periodo): string {
  const fmt = (d: DataISO, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", { ...opts, timeZone: "UTC" }).format(
      new Date(`${d}T12:00:00Z`),
    );

  if (recorte === "semana") {
    return `${fmt(p.inicio, { day: "numeric" })}–${fmt(p.fim, { day: "numeric", month: "short" })} ${p.fim.slice(0, 4)}`;
  }
  if (recorte === "mes") return fmt(p.inicio, { month: "long", year: "numeric" });
  return p.inicio.slice(0, 4);
}

export const carregarDashboard = cache(async function carregarDashboard(
  recorte: Recorte,
  referencia?: DataISO,
): Promise<EstadoDashboard> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const ref = referencia ?? hoje;
  const periodo = periodoDe(recorte, ref);
  const anterior = periodoAnterior(recorte, periodo);

  const [
    { data: config },
    { data: idiomasRaw },
    { data: camadasRaw },
    { data: alvoRaw },
    { data: sessoesRaw },
    { data: revisoesRaw },
    { data: vocabRaw },
    { data: marchasRaw },
  ] = await Promise.all([
    supabase
      .from("config")
      .select("meta_pct_ativo, meta_min_fala_semana, meta_dias_flash_semana, limiar_concentracao, limiar_desvio_pilar, lacuna_alerta, faixas_frequencia")
      .maybeSingle(),
    supabase
      .from("idiomas")
      .select("id, slug, nome, bandeira, cor, palavras_base")
      .eq("ativo", true)
      .order("ordem"),
    supabase.from("camadas").select("numero, nome, limiar").order("limiar"),
    supabase.from("distribuicao_alvo").select("chave, percentual").eq("dimensao", "pilar").is("bloco_id", null),
    supabase
      .from("sessoes")
      .select(
        "id, data, idioma_id, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, producao, violou_regra_5, hora_inicio",
      )
      .gte("data", anterior.inicio)
      .lte("data", periodo.fim),
    supabase
      .from("revisoes_flashcards")
      .select("data, idioma_id, revisou")
      .gte("data", anterior.inicio)
      .lte("data", periodo.fim),
    supabase
      .from("registros_vocabulario")
      .select("data, idioma_id, palavras_novas"),
    supabase.from("marcha_historico").select("numero, data_inicio, data_fim").order("data_inicio"),
  ]);

  const idiomas: IdiomaResumo[] = (idiomasRaw ?? []).map((i) => ({
    id: i.id,
    slug: i.slug,
    nome: i.nome,
    bandeira: i.bandeira,
    cor: i.cor,
  }));
  const palavrasBase = new Map((idiomasRaw ?? []).map((i) => [i.id, i.palavras_base]));

  const todas: SessaoComHora[] = (sessoesRaw ?? []).map((s) => ({
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
    horaInicio: s.hora_inicio,
  }));

  const revisoes: RevisaoDominio[] = (revisoesRaw ?? []).map((r) => ({
    data: r.data,
    idiomaId: r.idioma_id,
    revisou: r.revisou,
  }));

  const sessoes = noPeriodo(todas, periodo);
  const sessoesAntes = noPeriodo(todas, anterior);
  const revisoesPeriodo = noPeriodo(revisoes, periodo);

  const alvoPilar = Object.fromEntries(
    PILARES.map((p) => {
      const linha = (alvoRaw ?? []).find((a) => a.chave === p);
      return [p, (linha?.percentual ?? 25) / 100];
    }),
  ) as Record<Pilar, number>;

  const camadas: Camada[] = (camadasRaw ?? []).map((c) => ({
    numero: c.numero,
    nome: c.nome,
    limiar: c.limiar,
  }));

  const faixas = (config?.faixas_frequencia ?? []) as FaixaFrequencia[];

  const camadasPorIdioma: CamadaDeIdioma[] = idiomas.map((idioma) => {
    const registros = (vocabRaw ?? [])
      .filter((v) => v.idioma_id === idioma.id)
      .map((v) => ({ data: v.data, idiomaId: v.idioma_id, palavrasNovas: v.palavras_novas }));
    const progresso = progressoCamada(
      acumuladoDe(palavrasBase.get(idioma.id) ?? 0, registros),
      camadas,
      faixas,
    );
    const media = mediaMovel7d(registros, hoje, somaDias);
    return {
      idioma,
      progresso,
      mediaDiaria7d: media,
      projecaoDias: diasParaProximaCamada(progresso.faltam, media),
    };
  });

  const c = composicao(sessoes);
  const cob = cobertura(sessoes, revisoesPeriodo, periodo, hoje);
  const pilares = distribuicaoPilares(sessoes, alvoPilar);
  const tempos = distribuicaoTempos(sessoes);
  const fala = falaPorSemana(sessoes, periodo);
  const flash = flashcardsPorSemana(sessoes, revisoesPeriodo, periodo);
  const granularidade = recorte === "ano" ? "semana" : "dia";

  const faixasMarcha: FaixaMarcha[] = (marchasRaw ?? [])
    .map((m) => ({
      numero: m.numero as Marcha,
      inicio: m.data_inicio > periodo.inicio ? m.data_inicio : periodo.inicio,
      fim: m.data_fim && m.data_fim < periodo.fim ? m.data_fim : periodo.fim,
    }))
    .filter((f) => f.inicio <= f.fim);

  const top3 = concentracao(sessoes, 3);
  const mediaFala = mediaSemanal(fala);
  const mediaFlash = mediaSemanal(flash);
  const metaPctAtivo = Number(config?.meta_pct_ativo ?? 0.35);
  const metaFalaSemana = config?.meta_min_fala_semana ?? 60;
  const metaFlashSemana = config?.meta_dias_flash_semana ?? 5;

  return {
    recorte,
    periodo,
    rotuloPeriodo: rotular(recorte, periodo),
    anterior: somaDias(periodo.inicio, -1),
    proximo: periodo.fim >= hoje ? null : somaDias(periodo.fim, 1),
    hoje,
    idiomas,
    composicao: c,
    composicaoAnterior: composicao(sessoesAntes),
    cobertura: cob,
    coberturaAnterior: cobertura(sessoesAntes, noPeriodo(revisoes, anterior), anterior, hoje),
    pilares,
    tempos,
    porIdioma: minutosPorIdioma(sessoes),
    serie: serieTemporal(sessoes, periodo, granularidade),
    granularidade,
    faixasMarcha,
    fala,
    mediaFala,
    flashcards: flash,
    mediaFlashcards: mediaFlash,
    diasComFlashcards: [...diaComFlashcards(sessoes, revisoesPeriodo)],
    porHora: distribuicaoPorHora(sessoes),
    porDiaSemana: distribuicaoPorDiaSemana(sessoes),
    camadas: camadasPorIdioma,
    concentracaoTop3: { pct: top3.pct, dias: top3.dias },
    concentracaoTop10: (() => {
      const t = concentracao(sessoes, 10);
      return { pct: t.pct, dias: t.dias };
    })(),
    medianaDiaria: medianaDiaria(sessoes),
    producaoMin: minutosProducao(sessoes),
    producaoSessoes: sessoesProducao(sessoes),
    diagnostico: diagnosticar({
      composicao: c,
      minutosProducao: minutosProducao(sessoes),
      sessoesProducao: sessoesProducao(sessoes),
      concentracaoTop3: top3.pct,
      lacuna: cob.lacuna,
      mediaFalaSemanal: mediaFala,
      mediaFlashSemanal: mediaFlash,
      maiorDesvioPilar: maiorDesvioPilar(pilares),
      pctCadeira: tempos.find((t) => t.tempo === "cadeira")?.pct ?? 0,
      diasComRegistro: cob.diasComRegistro,
      diasNoPeriodo: cob.diasNoPeriodo,
      metaPctAtivo,
      metaFalaSemana,
      metaFlashSemana,
      limiarConcentracao: Number(config?.limiar_concentracao ?? 0.4),
      limiarDesvioPilar: Number(config?.limiar_desvio_pilar ?? 0.15),
      lacunaAlerta: config?.lacuna_alerta ?? 3,
    }),
    metaPctAtivo,
    metaFalaSemana,
    metaFlashSemana,
  };
});
