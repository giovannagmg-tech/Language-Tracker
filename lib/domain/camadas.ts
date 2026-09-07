import type { DataISO } from "./datas";

/** RN-501 e RN-502. Os limiares vêm da tabela `camadas`, nunca do código. */
export type Camada = { numero: number; nome: string; limiar: number };

export type RegistroVocab = { data: DataISO; idiomaId: string; palavrasNovas: number };

export type ProgressoCamada = {
  acumulado: number;
  camada: Camada | null;
  proxima: Camada | null;
  faltam: number;
  progresso: number;
  regua: string;
};

export function acumuladoDe(
  palavrasBase: number,
  registros: RegistroVocab[],
): number {
  return palavrasBase + registros.reduce((t, r) => t + r.palavrasNovas, 0);
}

/** Faixas da régua de frequência; vêm de `config.faixas_frequencia`. */
export type FaixaFrequencia = { ate: number | null; rotulo: string };

export function reguaFrequencia(acumulado: number, faixas: FaixaFrequencia[]): string {
  for (const faixa of faixas) {
    if (faixa.ate === null || acumulado < faixa.ate) return faixa.rotulo;
  }
  return faixas.at(-1)?.rotulo ?? "";
}

export function progressoCamada(
  acumulado: number,
  camadas: Camada[],
  faixas: FaixaFrequencia[] = [],
): ProgressoCamada {
  const ordenadas = [...camadas].sort((a, b) => a.limiar - b.limiar);
  const atingidas = ordenadas.filter((c) => c.limiar <= acumulado);
  const camada = atingidas.at(-1) ?? null;
  const proxima = ordenadas.find((c) => c.limiar > acumulado) ?? null;

  const piso = camada?.limiar ?? 0;
  const teto = proxima?.limiar ?? piso;

  return {
    acumulado,
    camada,
    proxima,
    faltam: proxima ? proxima.limiar - acumulado : 0,
    progresso: proxima ? Math.min(1, (acumulado - piso) / (teto - piso)) : 1,
    regua: reguaFrequencia(acumulado, faixas),
  };
}

/**
 * RN-505. Projeção em dias pela média móvel de 7 dias. Sem palavra nenhuma na
 * semana, a resposta honesta é `null` — a interface escreve "nesse ritmo, nunca".
 */
export function diasParaProximaCamada(
  faltam: number,
  mediaDiaria7d: number,
): number | null {
  if (faltam <= 0) return 0;
  if (mediaDiaria7d <= 0) return null;
  return Math.ceil(faltam / mediaDiaria7d);
}

export function mediaMovel7d(
  registros: RegistroVocab[],
  hoje: DataISO,
  diasAtras: (d: DataISO, n: number) => DataISO,
): number {
  const inicio = diasAtras(hoje, -6);
  const janela = registros.filter((r) => r.data >= inicio && r.data <= hoje);
  return janela.reduce((t, r) => t + r.palavrasNovas, 0) / 7;
}
