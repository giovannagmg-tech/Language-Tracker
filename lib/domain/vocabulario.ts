/**
 * RN-405. A velocidade de criação do lote: a régua do método é 2 min por
 * palavra na velocidade A e 1 min na B.
 */

export type FaixaVelocidade = "acima_de_a" | "a" | "entre" | "b";

export const ROTULO_VELOCIDADE: Record<FaixaVelocidade, string> = {
  acima_de_a: "acima de A",
  a: "velocidade A",
  entre: "entre A e B",
  b: "velocidade B",
};

export function faixaVelocidade(minPorPalavra: number): FaixaVelocidade {
  if (minPorPalavra > 2) return "acima_de_a";
  if (minPorPalavra > 1.5) return "a";
  if (minPorPalavra > 1) return "entre";
  return "b";
}

export type Velocidade = {
  minPorPalavra: number;
  faixa: FaixaVelocidade;
  rotulo: string;
};

/** Cronômetro parado sem palavras informadas não calcula nada. */
export function calcularVelocidade(
  minutos: number,
  palavras: number,
): Velocidade | null {
  if (palavras <= 0 || minutos <= 0) return null;
  const minPorPalavra = minutos / palavras;
  const faixa = faixaVelocidade(minPorPalavra);
  return { minPorPalavra, faixa, rotulo: ROTULO_VELOCIDADE[faixa] };
}

/** Mediana das últimas criações, para comparar o lote de hoje com o hábito. */
export function medianaVelocidade(historico: number[]): number | null {
  const valores = historico.filter((v) => v > 0).sort((a, b) => a - b);
  if (valores.length === 0) return null;
  const meio = Math.floor(valores.length / 2);
  return valores.length % 2 === 0 ? (valores[meio - 1] + valores[meio]) / 2 : valores[meio];
}

/** RN-408. O saldo de palavras que ainda não viraram frase falada. */
export function pendentesDeAtivacao(
  registros: { palavrasNovas: number; palavrasAtivadas: number }[],
): number {
  return Math.max(
    0,
    registros.reduce((t, r) => t + (r.palavrasNovas - r.palavrasAtivadas), 0),
  );
}
