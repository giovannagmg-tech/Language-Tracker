import { dias, type DataISO } from "./datas";

export type Lacuna = { inicio: DataISO; fim: DataISO; dias: number };

/**
 * RN-704. Maior sequência de dias sem nenhum registro dentro do período,
 * contando as bordas: do início do período até o primeiro registro, e do
 * último registro até hoje (ou até o fim do período, o que vier antes).
 *
 * Período sem registro nenhum devolve o período inteiro — é justamente o caso
 * que interessa: "seu mês inteiro foi uma lacuna".
 */
export function maiorLacuna(
  datasComRegistro: Iterable<DataISO>,
  periodo: { inicio: DataISO; fim: DataISO },
  hoje: DataISO,
): Lacuna {
  const fimEfetivo = dias(hoje, periodo.fim) > 0 ? hoje : periodo.fim;
  const dentro = [...new Set(datasComRegistro)]
    .filter((d) => dias(periodo.inicio, d) >= 0 && dias(d, fimEfetivo) >= 0)
    .sort();

  if (dentro.length === 0) {
    return {
      inicio: periodo.inicio,
      fim: fimEfetivo,
      dias: Math.max(0, dias(periodo.inicio, fimEfetivo) + 1),
    };
  }

  const candidatas: Lacuna[] = [];

  const antes = dias(periodo.inicio, dentro[0]);
  if (antes > 0) {
    candidatas.push({ inicio: periodo.inicio, fim: dentro[0], dias: antes });
  }

  for (let i = 1; i < dentro.length; i += 1) {
    const vao = dias(dentro[i - 1], dentro[i]) - 1;
    if (vao > 0) candidatas.push({ inicio: dentro[i - 1], fim: dentro[i], dias: vao });
  }

  const depois = dias(dentro[dentro.length - 1], fimEfetivo);
  if (depois > 0) {
    candidatas.push({
      inicio: dentro[dentro.length - 1],
      fim: fimEfetivo,
      dias: depois,
    });
  }

  if (candidatas.length === 0) {
    return { inicio: dentro[0], fim: dentro[dentro.length - 1], dias: 0 };
  }

  // Empate vai para a mais recente: é a que ainda dá para explicar.
  return candidatas.reduce((a, b) => (b.dias >= a.dias ? b : a));
}

/** Dias corridos desde o último registro. É o gatilho do modo retomada (RN-601). */
export function diasSemRegistro(
  datasComRegistro: Iterable<DataISO>,
  hoje: DataISO,
): number {
  const ordenadas = [...new Set(datasComRegistro)].sort();
  if (ordenadas.length === 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, dias(ordenadas[ordenadas.length - 1], hoje));
}
