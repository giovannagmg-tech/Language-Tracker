/**
 * Espelho tipado dos enums do banco (supabase/migrations).
 * Vive no domínio porque as regras do método são escritas sobre ele.
 * Se um valor mudar aqui, muda na migração — e vice-versa.
 */

export const PILARES = ["vocabulario", "gramatica", "pronuncia", "fala"] as const;
export type Pilar = (typeof PILARES)[number];

export const CATEGORIAS = ["ativo", "imersao"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const TEMPOS = ["cadeira", "maos_livres", "maos_ocupadas"] as const;
export type TempoDoDia = (typeof TEMPOS)[number];

export const ATIVIDADES = [
  "flashcards",
  "gramatica",
  "pronuncia",
  "fala_sozinha",
  "conversacao",
  "aula",
  "audio_grupo",
  "gravacao_video",
  "escrita",
  "conteudo_instagram",
  "leitura",
  "serie_filme",
  "podcast",
  "audiobook",
  "youtube",
  "browser_mode",
  "outro",
] as const;
export type Atividade = (typeof ATIVIDADES)[number];

/** Escuta não é pilar: estas atividades são sempre imersão (RN-102). */
export const ATIVIDADES_IMERSAO_FIXA = [
  "serie_filme",
  "podcast",
  "audiobook",
  "youtube",
  "browser_mode",
] as const satisfies readonly Atividade[];

/** Leitura é a única atividade de imersão que aceita virar estudo ativo. */
export const ATIVIDADES_IMERSAO_PADRAO = [
  ...ATIVIDADES_IMERSAO_FIXA,
  "leitura",
] as const satisfies readonly Atividade[];

/** Fala + escrita: é o que a linha de base chama de produção (8,6% em 2026). */
export const ATIVIDADES_PRODUCAO = [
  "fala_sozinha",
  "conversacao",
  "aula",
  "audio_grupo",
  "gravacao_video",
  "escrita",
  "conteudo_instagram",
] as const satisfies readonly Atividade[];

export const NIVEIS = [
  "A0",
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
  "C2",
] as const;
export type Nivel = (typeof NIVEIS)[number];

export const ORIGENS_SESSAO = ["manual", "toggl", "automatica"] as const;
export type OrigemSessao = (typeof ORIGENS_SESSAO)[number];

export const VIAS_REGISTRO = ["formulario", "cronometro", "atalho", "botao_regra"] as const;
export type ViaRegistro = (typeof VIAS_REGISTRO)[number];

export const TIPOS_TAREFA = [
  "frases_apos_erro",
  "ativar_palavras",
  "audio_grupo",
  "clube_conversacao",
  "autoavaliacao",
  "gravar_video",
  "aula_paga",
  "retomada_fase",
  "manual",
] as const;
export type TipoTarefa = (typeof TIPOS_TAREFA)[number];

export const ESTADOS_TAREFA = ["aberta", "concluida", "adiada", "dispensada"] as const;
export type EstadoTarefa = (typeof ESTADOS_TAREFA)[number];

export const TIPOS_META = ["palavras", "nivel", "conversacao", "painel_mensal"] as const;
export type TipoMeta = (typeof TIPOS_META)[number];

export const CATEGORIAS_CONQUISTA = [
  "consistencia",
  "camada",
  "producao",
  "metodo",
  "recuperacao",
] as const;
export type CategoriaConquista = (typeof CATEGORIAS_CONQUISTA)[number];

export const TIPOS_MATERIAL = [
  "app",
  "livro",
  "canal_youtube",
  "podcast",
  "curso",
  "playlist",
  "lista_palavras",
  "deck",
  "outro",
] as const;
export type TipoMaterial = (typeof TIPOS_MATERIAL)[number];

export const MARCHAS = [1, 2, 3] as const;
export type Marcha = (typeof MARCHAS)[number];

export type EstadoSemaforo = "verde" | "amarelo" | "vermelho" | "cinza";

/** Rótulos de interface. O domínio nunca renderiza — só oferece o texto. */
export const ROTULO_PILAR: Record<Pilar, string> = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  pronuncia: "Pronúncia",
  fala: "Fala",
};

export const ROTULO_TEMPO: Record<TempoDoDia, string> = {
  cadeira: "Bundinha na cadeira",
  maos_livres: "Mãos livres",
  maos_ocupadas: "Mãos ocupadas",
};

export const ROTULO_ATIVIDADE: Record<Atividade, string> = {
  flashcards: "Flashcards",
  gramatica: "Gramática",
  pronuncia: "Pronúncia",
  fala_sozinha: "Fala sozinha",
  conversacao: "Conversação",
  aula: "Aula",
  audio_grupo: "Áudio no grupo",
  gravacao_video: "Gravação de vídeo",
  escrita: "Escrita",
  conteudo_instagram: "Conteúdo no Instagram",
  leitura: "Leitura",
  serie_filme: "Série ou filme",
  podcast: "Podcast",
  audiobook: "Audiobook",
  youtube: "YouTube",
  browser_mode: "Browser mode",
  outro: "Outro",
};

export const ROTULO_MARCHA: Record<Marcha, string> = {
  1: "Sobrevivência",
  2: "Cruzeiro",
  3: "Turbo",
};
