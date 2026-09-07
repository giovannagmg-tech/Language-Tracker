/** Formatadores puros — usados por Server e Client Components. */

export const fmtPct = (v: number, casas = 1) =>
  `${(v * 100).toFixed(casas).replace(".", ",")}%`;

export const fmtPct0 = (v: number) => `${Math.round(v * 100)}%`;

export const fmtMin = (v: number) => `${Math.round(v)} min`;

export function fmtHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function fmtDataCurta(data: string): string {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}
