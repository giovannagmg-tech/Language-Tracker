import type { DataISO } from "./datas";

/**
 * RN-601 a RN-604. O ponto de falha real do histórico: dez lacunas de 5+ dias
 * e uma de 22. O protocolo não pune a recaída — punir a recaída dentro do
 * próprio protocolo de recaída é o desenho mais provável de fazer o app ser
 * abandonado (RN-603).
 */

export type NumeroFase = 1 | 2 | 3 | 4 | 5;

export type DefinicaoFase = {
  numero: NumeroFase;
  nome: string;
  resumo: string;
  /** Dias cumpridos para avançar. Não precisam ser consecutivos. */
  diasExigidos: number;
  /** O que conta como dia cumprido nesta fase. */
  exige: {
    browserMode?: boolean;
    checkFlashcards?: boolean;
    revisaoDeConteudo?: boolean;
    palavrasNovasMin?: number;
    palavrasNaMetaCheia?: boolean;
    conteudoNovo?: boolean;
  };
};

export const FASES: DefinicaoFase[] = [
  {
    numero: 1,
    nome: "Só voltar",
    resumo: "Browser mode + revisão de flashcards",
    diasExigidos: 1,
    exige: { browserMode: true, checkFlashcards: true },
  },
  {
    numero: 2,
    nome: "Revisar o que já sabe",
    resumo: "Revisão de flashcards + revisão de gramática ou pronúncia",
    diasExigidos: 2,
    exige: { checkFlashcards: true, revisaoDeConteudo: true },
  },
  {
    numero: 3,
    nome: "Poucas palavras novas",
    resumo: "5 palavras novas + revisão",
    diasExigidos: 2,
    exige: { checkFlashcards: true, palavrasNovasMin: 5 },
  },
  {
    numero: 4,
    nome: "Conteúdo novo",
    resumo: "Gramática e pronúncia novas, em dias diferentes",
    diasExigidos: 2,
    exige: { conteudoNovo: true },
  },
  {
    numero: 5,
    nome: "Meta cheia",
    resumo: "De volta à meta diária de palavras",
    diasExigidos: 2,
    exige: { palavrasNaMetaCheia: true },
  },
];

export function definicaoDaFase(numero: NumeroFase): DefinicaoFase {
  return FASES[numero - 1];
}

/** RN-601. Sete dias sem nada — o limiar vem da configuração, não do código. */
export function deveEntrarEmRetomada(
  diasSemRegistro: number,
  limiar: number,
  jaAtiva: boolean,
): boolean {
  return !jaAtiva && Number.isFinite(diasSemRegistro) && diasSemRegistro >= limiar;
}

export type DiaDaRetomada = {
  temBrowserMode: boolean;
  temCheckFlashcards: boolean;
  temRevisaoDeConteudo: boolean;
  temConteudoNovo: boolean;
  palavrasNovas: number;
  metaPalavrasDia: number;
};

/** O dia cumpre a fase? Todas as exigências da fase precisam bater. */
export function diaCumpreFase(fase: NumeroFase, dia: DiaDaRetomada): boolean {
  const { exige } = definicaoDaFase(fase);

  if (exige.browserMode && !dia.temBrowserMode) return false;
  if (exige.checkFlashcards && !dia.temCheckFlashcards) return false;
  if (exige.revisaoDeConteudo && !dia.temRevisaoDeConteudo) return false;
  if (exige.conteudoNovo && !dia.temConteudoNovo) return false;
  if (exige.palavrasNovasMin !== undefined && dia.palavrasNovas < exige.palavrasNovasMin) {
    return false;
  }
  if (exige.palavrasNaMetaCheia && dia.palavrasNovas < Math.max(1, dia.metaPalavrasDia)) {
    return false;
  }
  return true;
}

export type EstadoRetomada = {
  fase: NumeroFase;
  diasCumpridos: number;
  diasExigidos: number;
  avancou: boolean;
  concluida: boolean;
};

/**
 * RN-602. Avança quando os dias exigidos são cumpridos. Os dias já contados
 * nunca são perdidos: a retomada não regride (RN-603).
 */
export function avaliarProgresso(
  fase: NumeroFase,
  diasCumpridosNaFase: number,
): EstadoRetomada {
  const def = definicaoDaFase(fase);
  const completou = diasCumpridosNaFase >= def.diasExigidos;
  const ultima = fase === 5;

  return {
    fase: completou && !ultima ? ((fase + 1) as NumeroFase) : fase,
    diasCumpridos: completou && !ultima ? 0 : diasCumpridosNaFase,
    diasExigidos: completou && !ultima ? definicaoDaFase((fase + 1) as NumeroFase).diasExigidos : def.diasExigidos,
    avancou: completou && !ultima,
    concluida: completou && ultima,
  };
}

export function mensagemDeAvanco(estado: EstadoRetomada): string {
  if (estado.concluida) return "Cinco fases. Você voltou inteira. Isso vale mais que streak.";
  if (estado.avancou) {
    const def = definicaoDaFase(estado.fase);
    return `Fase ${estado.fase - 1} fechada. Fase ${estado.fase}: ${def.resumo.toLowerCase()}.`;
  }
  const faltam = estado.diasExigidos - estado.diasCumpridos;
  return `Fase ${estado.fase}, faltam ${faltam} ${faltam === 1 ? "dia" : "dias"}.`;
}

export function mensagemDeEntrada(diasSemRegistro: number): string {
  return `${diasSemRegistro} dias fora. Não vamos fingir que nada aconteceu — modo retomada, fase 1 de 5.`;
}

/** Enquanto a retomada está ativa, as conquistas de consistência não são avaliadas. */
export const CATEGORIAS_SUSPENSAS_NA_RETOMADA = ["consistencia"] as const;

export function duracaoEmDias(inicio: DataISO, fim: DataISO): number {
  const ms = new Date(`${fim}T12:00:00Z`).getTime() - new Date(`${inicio}T12:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}
