import { NIVEIS, type Nivel } from "./tipos";

/**
 * RN-503. A escala é ordinal: o que importa é a distância em degraus entre
 * onde ela começou, onde está e onde quer chegar.
 */
export function indiceNivel(nivel: Nivel): number {
  return NIVEIS.indexOf(nivel);
}

export function progressoNivel(inicial: Nivel, atual: Nivel, meta: Nivel): number {
  const i = indiceNivel(inicial);
  const a = indiceNivel(atual);
  const m = indiceNivel(meta);
  if (m <= i) return a >= m ? 1 : 0;
  return Math.min(1, Math.max(0, (a - i) / (m - i)));
}

/** Os degraus entre inicial e meta, inclusive as duas pontas — a barra de nível. */
export function degrausAte(inicial: Nivel, meta: Nivel): Nivel[] {
  const i = indiceNivel(inicial);
  const m = indiceNivel(meta);
  if (m < i) return [meta, inicial];
  return NIVEIS.slice(i, m + 1);
}

export function degrausRestantes(atual: Nivel, meta: Nivel): number {
  return Math.max(0, indiceNivel(meta) - indiceNivel(atual));
}

/** Quantos degraus subiu (ou desceu, com sinal) entre duas autoavaliações. */
export function variacaoNivel(anterior: Nivel, novo: Nivel): number {
  return indiceNivel(novo) - indiceNivel(anterior);
}

export function nivelValido(valor: string): valor is Nivel {
  return (NIVEIS as readonly string[]).includes(valor);
}
