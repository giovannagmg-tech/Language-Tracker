import type { DataISO } from "./datas";
import type { CategoriaConquista } from "./tipos";

/**
 * Documento 06. Cada conquista é uma função pura que recebe o contexto já
 * agregado e devolve progresso. Nenhuma pode ser obtida só com imersão —
 * premiar horas acumuladas premiaria justamente o problema.
 */

export type DefinicaoConquista = {
  codigo: string;
  nome: string;
  categoria: CategoriaConquista;
  criterioTexto: string;
  criterioChave: string;
  parametros: Record<string, number | string>;
  escopo: "global" | "por_idioma";
  repetivel: boolean;
  janelaRepeticao: string | null;
  ordem: number;
};

export type Avaliacao = {
  conquistada: boolean;
  atual: number;
  alvo: number;
  /** Data em que a condição passou a valer — usada no recálculo retroativo. */
  em: DataISO | null;
};

/** Números por idioma, já agregados pela consulta. */
export type ContextoIdioma = {
  idiomaId: string;
  acumuladoPalavras: number;
  limiarPorCamada: Record<number, number>;
  palavrasNoAno: number;
  melhorMinPorPalavra: number | null;
  loteMinimoAtingido: boolean;
  avancoMaterialNoMes: number;
};

export type ContextoConquistas = {
  hoje: DataISO;
  /** Sequências e cobertura. */
  streakRegistro: number;
  streakPiso: number;
  streakFlashcards: number;
  diasRegistroMes: number;
  diasFlashcardsMes: number;
  maiorLacunaMesFechado: number | null;
  mesFechadoTemRegistro: boolean;
  diasSemDoisEmBranco: number;
  sextasSeguidasComRegistro: number;
  /** Produção. */
  conversasNoMes: number;
  falaNaSemana: number;
  audiosAcumulados: number;
  videosAcumulados: number;
  aulasAcumuladas: number;
  pctAtivoMesFechado: number | null;
  sessoesProducaoMes: number;
  semanasFalaSeguidas60: number;
  semanasFalaSeguidas90: number;
  idiomasComFalaNaSemana: number;
  idiomasAtivos: number;
  sabadosEscritaSeguidos: number;
  /** Método. */
  mesFechadoSemViolarRegra5: boolean;
  sextasPronunciaSeguidas: number;
  checagensAcumuladas: number;
  lotesLimposSeguidos: number;
  diasSemPendentesAtivacao: number;
  diasMaosOcupadasMes: number;
  maiorNumeroDeTemposNoDia: number;
  pilaresDentroDaTolerancia: number;
  mesTemVolumeParaAvaliarPilares: boolean;
  correcoesNoPrazo: number;
  autoavaliacoesDoBlocoFechado: number;
  diasNaMarchaAtual: number;
  marchaAtual: number;
  /** Recuperação. */
  retomadaConcluidaAgora: boolean;
  faseAtualDaRetomada: number;
  duracaoUltimaRetomada: number | null;
  retomadasConcluidas: number;
  diasDesdeLacunaGrande: number;
  diasSalvosPelaRegra1: number;
  /** Por idioma. */
  porIdioma: Record<string, ContextoIdioma>;
};

type Avaliador = (
  p: Record<string, number | string>,
  ctx: ContextoConquistas,
  idiomaId?: string,
) => Avaliacao;

const n = (v: number | string | undefined, padrao = 0): number =>
  typeof v === "number" ? v : padrao;

function medir(atual: number, alvo: number, hoje: DataISO): Avaliacao {
  const conquistada = atual >= alvo;
  return { conquistada, atual, alvo, em: conquistada ? hoje : null };
}

function booleana(condicao: boolean, hoje: DataISO): Avaliacao {
  return { conquistada: condicao, atual: condicao ? 1 : 0, alvo: 1, em: condicao ? hoje : null };
}

const AVALIADORES: Record<string, Avaliador> = {
  // --- consistência -------------------------------------------------------
  streak_registro: (p, c) => medir(c.streakRegistro, n(p.dias, 1), c.hoje),
  streak_piso: (p, c) => medir(c.streakPiso, n(p.dias, 1), c.hoje),
  dias_registro_mes: (p, c) => medir(c.diasRegistroMes, n(p.dias, 1), c.hoje),
  sem_dois_em_branco: (p, c) => medir(c.diasSemDoisEmBranco, n(p.dias, 1), c.hoje),
  dia_semana_seguido: (p, c) => medir(c.sextasSeguidasComRegistro, n(p.vezes, 1), c.hoje),
  mes_lacuna_maxima: (p, c) => {
    const max = n(p.max, 2);
    const lacuna = c.maiorLacunaMesFechado;
    const ok = c.mesFechadoTemRegistro && lacuna !== null && lacuna <= max;
    return { conquistada: ok, atual: lacuna ?? 0, alvo: max, em: ok ? c.hoje : null };
  },

  // --- camadas ------------------------------------------------------------
  camada_atingida: (p, c, idiomaId) => {
    const i = idiomaId ? c.porIdioma[idiomaId] : undefined;
    const limiar = i?.limiarPorCamada[n(p.camada, 1)] ?? Number.POSITIVE_INFINITY;
    return medir(i?.acumuladoPalavras ?? 0, limiar, c.hoje);
  },
  todos_idiomas_camada: (p, c) => {
    const camada = n(p.camada, 1);
    const atingiram = Object.values(c.porIdioma).filter(
      (i) => i.acumuladoPalavras >= (i.limiarPorCamada[camada] ?? Number.POSITIVE_INFINITY),
    ).length;
    return medir(atingiram, c.idiomasAtivos, c.hoje);
  },
  palavras_no_ano: (p, c, idiomaId) =>
    medir(idiomaId ? (c.porIdioma[idiomaId]?.palavrasNoAno ?? 0) : 0, n(p.palavras, 1), c.hoje),

  // --- produção -----------------------------------------------------------
  conversas_no_mes: (p, c) => medir(c.conversasNoMes, n(p.n, 1), c.hoje),
  fala_na_semana: (p, c) => medir(c.falaNaSemana, n(p.min, 1), c.hoje),
  audios_acumulados: (p, c) => medir(c.audiosAcumulados, n(p.n, 1), c.hoje),
  videos_acumulados: (p, c) => medir(c.videosAcumulados, n(p.n, 1), c.hoje),
  aulas_acumuladas: (p, c) => medir(c.aulasAcumuladas, n(p.n, 1), c.hoje),
  sessoes_producao_mes: (p, c) => medir(c.sessoesProducaoMes, n(p.n, 1), c.hoje),
  sabados_escrita: (p, c) => medir(c.sabadosEscritaSeguidos, n(p.n, 1), c.hoje),
  fala_todos_idiomas_semana: (_p, c) => medir(c.idiomasComFalaNaSemana, c.idiomasAtivos, c.hoje),
  pct_ativo_mes: (p, c) => {
    const alvo = n(p.pct, 0.35);
    const atual = c.pctAtivoMesFechado;
    const ok = atual !== null && atual >= alvo;
    return { conquistada: ok, atual: atual ?? 0, alvo, em: ok ? c.hoje : null };
  },
  semanas_fala_seguidas: (p, c) => {
    const min = n(p.min, 60);
    const atual = min >= 90 ? c.semanasFalaSeguidas90 : c.semanasFalaSeguidas60;
    return medir(atual, n(p.semanas, 1), c.hoje);
  },

  // --- método -------------------------------------------------------------
  streak_flashcards: (p, c) => medir(c.streakFlashcards, n(p.dias, 1), c.hoje),
  dias_flashcards_mes: (p, c) => medir(c.diasFlashcardsMes, n(p.dias, 1), c.hoje),
  checagens_acumuladas: (p, c) => medir(c.checagensAcumuladas, n(p.n, 1), c.hoje),
  lotes_limpos_seguidos: (p, c) => medir(c.lotesLimposSeguidos, n(p.n, 1), c.hoje),
  sem_pendentes_ativacao: (p, c) => medir(c.diasSemPendentesAtivacao, n(p.dias, 1), c.hoje),
  dias_tempo_mes: (p, c) => medir(c.diasMaosOcupadasMes, n(p.dias, 1), c.hoje),
  tres_tempos_no_dia: (_p, c) => medir(c.maiorNumeroDeTemposNoDia, 3, c.hoje),
  correcoes_no_prazo: (p, c) => medir(c.correcoesNoPrazo, n(p.n, 1), c.hoje),
  sextas_pronuncia: (p, c) => medir(c.sextasPronunciaSeguidas, n(p.vezes, 1), c.hoje),
  marcha_seguida: (p, c) => {
    const alvo = n(p.dias, 30);
    const atual = c.marchaAtual === n(p.marcha, 3) ? c.diasNaMarchaAtual : 0;
    return medir(atual, alvo, c.hoje);
  },
  mes_sem_violar_regra5: (_p, c) => booleana(c.mesFechadoSemViolarRegra5, c.hoje),
  autoavaliacao_bloco_completa: (_p, c) =>
    medir(c.autoavaliacoesDoBlocoFechado, c.idiomasAtivos, c.hoje),
  pilares_no_alvo_mes: (_p, c) => {
    const ok = c.mesTemVolumeParaAvaliarPilares && c.pilaresDentroDaTolerancia === 4;
    return { conquistada: ok, atual: c.pilaresDentroDaTolerancia, alvo: 4, em: ok ? c.hoje : null };
  },
  velocidade_lote: (p, c, idiomaId) => {
    const i = idiomaId ? c.porIdioma[idiomaId] : undefined;
    const alvo = n(p.min_por_palavra, 1);
    const melhor = i?.melhorMinPorPalavra ?? null;
    const ok = i?.loteMinimoAtingido === true && melhor !== null && melhor <= alvo;
    // O progresso é invertido: quanto menor o min/palavra, mais perto.
    const atual = melhor === null ? 0 : Math.min(1, alvo / melhor);
    return { conquistada: ok, atual, alvo: 1, em: ok ? c.hoje : null };
  },
  avanco_material_mes: (p, c, idiomaId) =>
    medir(idiomaId ? (c.porIdioma[idiomaId]?.avancoMaterialNoMes ?? 0) : 0, n(p.n, 1), c.hoje),

  // --- recuperação --------------------------------------------------------
  retomada_concluida: (_p, c) => {
    const ok = c.retomadaConcluidaAgora;
    return { conquistada: ok, atual: c.faseAtualDaRetomada, alvo: 5, em: ok ? c.hoje : null };
  },
  retomada_rapida: (p, c) => {
    const limite = n(p.dias, 12);
    const ok =
      c.retomadaConcluidaAgora &&
      c.duracaoUltimaRetomada !== null &&
      c.duracaoUltimaRetomada <= limite;
    return { conquistada: ok, atual: c.duracaoUltimaRetomada ?? 0, alvo: limite, em: ok ? c.hoje : null };
  },
  retomadas_acumuladas: (p, c) => medir(c.retomadasConcluidas, n(p.n, 1), c.hoje),
  sem_lacuna_grande: (p, c) => medir(c.diasDesdeLacunaGrande, n(p.dias_janela, 180), c.hoje),
  dias_salvos_regra1: (p, c) => medir(c.diasSalvosPelaRegra1, n(p.n, 1), c.hoje),
};

export function avaliadorExiste(chave: string): boolean {
  return chave in AVALIADORES;
}

/** Chave desconhecida não trava a tela: devolve bloqueada e segue. */
export function avaliar(
  definicao: DefinicaoConquista,
  ctx: ContextoConquistas,
  idiomaId?: string,
): Avaliacao {
  const avaliador = AVALIADORES[definicao.criterioChave];
  if (!avaliador) return { conquistada: false, atual: 0, alvo: 1, em: null };
  return avaliador(definicao.parametros, ctx, idiomaId);
}

export type EstadoConquista = {
  codigo: string;
  idiomaId: string | null;
  conquistada: boolean;
  progressoAtual: number;
  progressoAlvo: number;
  conquistadaEm: DataISO | null;
  vezes: number;
};

/**
 * Junta o catálogo, o estado gravado e a avaliação de agora.
 * Conquista já ganha nunca é retirada; repetível só reconta ao mudar de janela.
 */
export function reconciliar(
  definicao: DefinicaoConquista,
  anterior: EstadoConquista | undefined,
  avaliacao: Avaliacao,
  janelaAtual: string,
  janelaAnterior: string | null,
  suspensa: boolean,
): EstadoConquista | null {
  const base: EstadoConquista = anterior ?? {
    codigo: definicao.codigo,
    idiomaId: null,
    conquistada: false,
    progressoAtual: 0,
    progressoAlvo: avaliacao.alvo,
    conquistadaEm: null,
    vezes: 0,
  };

  if (suspensa) return null;

  const progressoMudou =
    base.progressoAtual !== avaliacao.atual || base.progressoAlvo !== avaliacao.alvo;

  if (!avaliacao.conquistada) {
    return progressoMudou
      ? { ...base, progressoAtual: avaliacao.atual, progressoAlvo: avaliacao.alvo }
      : null;
  }

  const jaContadaNestaJanela =
    base.conquistada && (!definicao.repetivel || janelaAnterior === janelaAtual);

  if (jaContadaNestaJanela) {
    return progressoMudou
      ? { ...base, progressoAtual: avaliacao.atual, progressoAlvo: avaliacao.alvo }
      : null;
  }

  return {
    ...base,
    conquistada: true,
    progressoAtual: avaliacao.atual,
    progressoAlvo: avaliacao.alvo,
    conquistadaEm: base.conquistadaEm ?? avaliacao.em,
    vezes: base.vezes + 1,
  };
}

export const CORES_CATEGORIA: Record<CategoriaConquista, { bg: string; forte: string }> = {
  consistencia: { bg: "var(--conq-consistencia-bg)", forte: "var(--conq-consistencia)" },
  metodo: { bg: "var(--conq-metodo-bg)", forte: "var(--conq-metodo)" },
  producao: { bg: "var(--conq-producao-bg)", forte: "var(--conq-producao)" },
  camada: { bg: "var(--conq-camada-bg)", forte: "var(--conq-camada)" },
  recuperacao: { bg: "var(--conq-recuperacao-bg)", forte: "var(--conq-recuperacao)" },
};

export const ROTULO_CATEGORIA: Record<CategoriaConquista, string> = {
  consistencia: "Consistência",
  camada: "Camadas",
  producao: "Produção",
  metodo: "Método",
  recuperacao: "Recuperação",
};
