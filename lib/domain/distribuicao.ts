import type { DataISO } from "./datas";
import type { FatiaPilar } from "./metrics";
import type { Pilar } from "./tipos";

/**
 * RN-902 e RN-904. A Planilha de Distribuição é onde ela decide para onde o
 * tempo deve ir. Editar um percentual precisa ser barato: por isso a
 * normalização redistribui a diferença nos outros campos em vez de reclamar.
 */

export type ItemDistribuicao = { chave: string; percentual: number };

export function soma(itens: ItemDistribuicao[]): number {
  return itens.reduce((t, i) => t + i.percentual, 0);
}

/** Diferença de até 1 ponto é arredondamento, não erro (RN-904). */
export function somaValida(itens: ItemDistribuicao[]): boolean {
  return Math.abs(soma(itens) - 100) <= 1;
}

/**
 * Redistribui a diferença proporcionalmente entre os outros itens.
 * O item recém-editado (`fixa`) não é tocado — senão a edição se desfaz
 * na frente da usuária.
 */
export function normalizarPara100(
  itens: ItemDistribuicao[],
  fixa?: string,
): ItemDistribuicao[] {
  if (itens.length === 0) return itens;

  const travados = fixa ? itens.filter((i) => i.chave === fixa) : [];
  const ajustaveis = itens.filter((i) => !travados.some((t) => t.chave === i.chave));

  if (ajustaveis.length === 0) return itens;

  const restante = 100 - soma(travados);
  const somaAjustaveis = soma(ajustaveis);

  const novos = ajustaveis.map((i) => ({
    chave: i.chave,
    percentual:
      somaAjustaveis === 0
        ? Math.floor(restante / ajustaveis.length)
        : Math.round((i.percentual / somaAjustaveis) * restante),
  }));

  // O arredondamento sobra ou falta: joga a diferença no maior item.
  const diferenca = restante - soma(novos);
  if (diferenca !== 0 && novos.length > 0) {
    const maior = novos.reduce((a, b) => (b.percentual > a.percentual ? b : a));
    maior.percentual += diferenca;
  }

  const porChave = new Map(novos.map((n) => [n.chave, n.percentual]));
  return itens.map((i) => ({
    chave: i.chave,
    percentual: porChave.get(i.chave) ?? i.percentual,
  }));
}

export type Desvio = {
  chave: string;
  alvo: number;
  realizado: number;
  delta: number;
  faixa: "no_alvo" | "atencao" | "fora";
};

/** RN-902. Verde até 5 pontos, amarelo até 15, laranja acima. */
export function faixaDoDesvio(deltaPontos: number): Desvio["faixa"] {
  const modulo = Math.abs(deltaPontos);
  if (modulo <= 5) return "no_alvo";
  if (modulo <= 15) return "atencao";
  return "fora";
}

export function compararAlvoRealizado(
  alvo: ItemDistribuicao[],
  realizado: Record<string, number>,
): Desvio[] {
  return alvo.map((a) => {
    const real = Math.round((realizado[a.chave] ?? 0) * 100);
    const delta = real - a.percentual;
    return {
      chave: a.chave,
      alvo: a.percentual,
      realizado: real,
      delta,
      faixa: faixaDoDesvio(delta),
    };
  });
}

export function corDaFaixa(faixa: Desvio["faixa"]): string {
  if (faixa === "no_alvo") return "var(--sucesso)";
  if (faixa === "atencao") return "var(--atencao)";
  return "var(--meta-longo)";
}

/**
 * RN-903. O foco do mês sugerido: o idioma do bloco vigente e o pilar que
 * ficou mais abaixo do alvo no mês anterior. Nada de escolher o pilar que já
 * está indo bem.
 */
export function sugerirFocoDoMes(
  idiomaFocoBloco: string | null,
  pilaresDoMesAnterior: FatiaPilar[],
): { idiomaId: string | null; pilar: Pilar | null } {
  const abaixo = pilaresDoMesAnterior.filter((p) => p.desvio < 0);
  const pior = abaixo.length > 0 ? abaixo.reduce((a, b) => (b.desvio < a.desvio ? b : a)) : null;
  return { idiomaId: idiomaFocoBloco, pilar: pior?.pilar ?? null };
}

export type Bloco = {
  id: string;
  nome: string;
  dataInicio: DataISO;
  dataFim: DataISO;
  idiomaFoco: string | null;
};

export function blocoVigente(blocos: Bloco[], hoje: DataISO): Bloco | null {
  return blocos.find((b) => b.dataInicio <= hoje && hoje <= b.dataFim) ?? null;
}

/** Blocos não podem se sobrepor — é o único bloqueio de gravação da tela. */
export function sobrepoe(a: Pick<Bloco, "dataInicio" | "dataFim">, b: Pick<Bloco, "dataInicio" | "dataFim">): boolean {
  return a.dataInicio <= b.dataFim && b.dataInicio <= a.dataFim;
}

export function conflitoDeBlocos(
  candidato: Pick<Bloco, "dataInicio" | "dataFim">,
  existentes: Bloco[],
  ignorarId?: string,
): Bloco | null {
  return existentes.find((b) => b.id !== ignorarId && sobrepoe(candidato, b)) ?? null;
}
