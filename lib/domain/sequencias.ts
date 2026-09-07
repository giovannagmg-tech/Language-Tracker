import { dias, somaDias, type DataISO } from "./datas";

/**
 * RN-705. Duas sequências, de propósito: a de registro é fácil (um podcast
 * conta) e a do piso é a que o método cobra. Mostrar só a primeira reproduz
 * o problema dos 76,8% de imersão.
 */

/**
 * Conta para trás a partir de hoje. Se hoje ainda não tem registro, a
 * sequência não quebra: o dia corrente só conta contra às 23:59.
 */
export function sequencia(datas: Iterable<DataISO>, hoje: DataISO): number {
  const conjunto = datas instanceof Set ? datas : new Set(datas);
  if (conjunto.size === 0) return 0;

  const inicio = conjunto.has(hoje) ? hoje : somaDias(hoje, -1);
  if (!conjunto.has(inicio)) return 0;

  let total = 0;
  let cursor = inicio;
  while (conjunto.has(cursor)) {
    total += 1;
    cursor = somaDias(cursor, -1);
  }
  return total;
}

/** A maior sequência já alcançada no conjunto — o recorde a bater. */
export function maiorSequencia(datas: Iterable<DataISO>): number {
  const ordenadas = [...new Set(datas)].sort();
  if (ordenadas.length === 0) return 0;

  let melhor = 1;
  let corrente = 1;
  for (let i = 1; i < ordenadas.length; i += 1) {
    corrente = dias(ordenadas[i - 1], ordenadas[i]) === 1 ? corrente + 1 : 1;
    melhor = Math.max(melhor, corrente);
  }
  return melhor;
}

/**
 * Quantos dias faltam para bater o recorde. Empatar não basta: para "bater"
 * é preciso um dia a mais. Já sendo o recorde, devolve 0.
 */
export function faltamParaRecorde(sequenciaAtual: number, recorde: number): number {
  return Math.max(0, recorde - sequenciaAtual + 1);
}
