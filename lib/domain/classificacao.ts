import type { SessaoDominio } from "./modelos";
import {
  ATIVIDADES_IMERSAO_FIXA,
  ATIVIDADES_PRODUCAO,
  type Atividade,
  type Categoria,
  type Marcha,
  type Pilar,
  type TempoDoDia,
} from "./tipos";

/** RN-101. A atividade é quem manda: dela saem categoria, pilar, tempo e produção. */
export const DEFAULTS: Record<
  Atividade,
  { categoria: Categoria; pilar: Pilar | null; tempo: TempoDoDia }
> = {
  flashcards: { categoria: "ativo", pilar: "vocabulario", tempo: "maos_livres" },
  gramatica: { categoria: "ativo", pilar: "gramatica", tempo: "cadeira" },
  pronuncia: { categoria: "ativo", pilar: "pronuncia", tempo: "cadeira" },
  fala_sozinha: { categoria: "ativo", pilar: "fala", tempo: "maos_ocupadas" },
  conversacao: { categoria: "ativo", pilar: "fala", tempo: "cadeira" },
  aula: { categoria: "ativo", pilar: "fala", tempo: "cadeira" },
  audio_grupo: { categoria: "ativo", pilar: "fala", tempo: "maos_livres" },
  gravacao_video: { categoria: "ativo", pilar: "fala", tempo: "cadeira" },
  escrita: { categoria: "ativo", pilar: "gramatica", tempo: "cadeira" },
  conteudo_instagram: { categoria: "ativo", pilar: "fala", tempo: "cadeira" },
  leitura: { categoria: "imersao", pilar: null, tempo: "maos_livres" },
  serie_filme: { categoria: "imersao", pilar: null, tempo: "maos_livres" },
  podcast: { categoria: "imersao", pilar: null, tempo: "maos_ocupadas" },
  audiobook: { categoria: "imersao", pilar: null, tempo: "maos_ocupadas" },
  youtube: { categoria: "imersao", pilar: null, tempo: "maos_livres" },
  browser_mode: { categoria: "imersao", pilar: null, tempo: "maos_livres" },
  outro: { categoria: "ativo", pilar: null, tempo: "cadeira" },
};

const IMERSAO_FIXA = new Set<string>(ATIVIDADES_IMERSAO_FIXA);
const PRODUCAO = new Set<string>(ATIVIDADES_PRODUCAO);

/** RN-102: escuta e consumo nunca viram estudo ativo. Leitura é a única exceção. */
export function categoriaTravada(atividade: Atividade): boolean {
  return IMERSAO_FIXA.has(atividade);
}

export function ehProducao(atividade: Atividade): boolean {
  return PRODUCAO.has(atividade);
}

export type EntradaClassificacao = {
  atividade: Atividade;
  duracaoMin: number;
  pilar?: Pilar | null;
  tempo?: TempoDoDia;
  categoria?: Categoria;
  minutosFala?: number;
};

export type SessaoClassificada = {
  categoria: Categoria;
  pilar: Pilar | null;
  tempo: TempoDoDia;
  producao: boolean;
  minutosFala: number;
};

/**
 * RN-103 a RN-105. Recebe o que a usuária escolheu e devolve a sessão coerente.
 * Nunca rejeita: corrige e segue (RN-004).
 */
export function classificar(entrada: EntradaClassificacao): SessaoClassificada {
  const padrao = DEFAULTS[entrada.atividade];

  const categoria: Categoria = categoriaTravada(entrada.atividade)
    ? "imersao"
    : (entrada.categoria ?? padrao.categoria);

  const pilar: Pilar | null =
    categoria === "imersao" ? null : (entrada.pilar ?? padrao.pilar);

  const producao = categoria === "imersao" ? false : ehProducao(entrada.atividade);

  const falaPadrao = producao && entrada.atividade !== "escrita" ? entrada.duracaoMin : 0;
  const falaBruta = entrada.minutosFala ?? falaPadrao;
  const minutosFala = Math.max(0, Math.min(falaBruta, entrada.duracaoMin));

  return {
    categoria,
    pilar,
    tempo: entrada.tempo ?? padrao.tempo,
    producao,
    minutosFala,
  };
}

/** Sessão ativa precisa de pilar. Quem escolhe "outro" tem que dizer qual. */
export function faltaPilar(c: SessaoClassificada): boolean {
  return c.categoria === "ativo" && c.pilar === null;
}

/** RN-106. */
export const DURACAO_MIN = 1;
export const DURACAO_MAX = 480;

export function normalizarDuracao(minutos: number): number {
  const inteiro = Math.round(minutos);
  return Math.min(DURACAO_MAX, Math.max(DURACAO_MIN, inteiro));
}

/**
 * RN-305. Gramática e pronúncia se atrapalham no mesmo dia.
 * Devolve o pilar que já está no dia, ou null se não há conflito.
 * Não bloqueia nada — quem decide é a usuária.
 */
export function conflitoGramaticaPronuncia(
  pilarNovo: Pilar | null,
  sessoesDoDia: Pick<SessaoDominio, "pilar">[],
): Pilar | null {
  if (pilarNovo !== "gramatica" && pilarNovo !== "pronuncia") return null;
  const oposto: Pilar = pilarNovo === "gramatica" ? "pronuncia" : "gramatica";
  return sessoesDoDia.some((s) => s.pilar === oposto) ? oposto : null;
}

/** RN-306. */
export function instagramLiberado(marcha: Marcha): boolean {
  return marcha === 3;
}

export function atividadeDisponivel(atividade: Atividade, marcha: Marcha): boolean {
  return atividade === "conteudo_instagram" ? instagramLiberado(marcha) : true;
}
