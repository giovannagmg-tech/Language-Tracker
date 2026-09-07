import { chaveSemana, dias, diaDaSemana, intervalo, type DataISO } from "./datas";
import { maiorLacuna, type Lacuna } from "./lacunas";
import type { RevisaoDominio, SessaoDominio } from "./modelos";
import { diasComRegistro } from "./piso";
import { PILARES, type Pilar, type TempoDoDia } from "./tipos";

export type Periodo = { inicio: DataISO; fim: DataISO };

const dentro = (d: DataISO, p: Periodo) => d >= p.inicio && d <= p.fim;

export function noPeriodo<T extends { data: DataISO }>(itens: T[], p: Periodo): T[] {
  return itens.filter((i) => dentro(i.data, p));
}

const somaMin = (s: SessaoDominio[]) => s.reduce((t, x) => t + x.duracaoMin, 0);
const pct = (parte: number, total: number) => (total === 0 ? 0 : parte / total);

// ---------------------------------------------------------------------------
// RN-701 / RN-702 — composição
// ---------------------------------------------------------------------------

export type Composicao = {
  ativo: number;
  flashcards: number;
  imersao: number;
  total: number;
  pctAtivo: number;
  pctFlashcards: number;
  pctImersao: number;
};

/**
 * As três parcelas somam exatamente o total, e é assim que são exibidas.
 * Nenhum número do app soma ativo com imersão sob um rótulo só (RN-001).
 */
export function composicao(sessoes: SessaoDominio[]): Composicao {
  const flashcards = somaMin(sessoes.filter((s) => s.atividade === "flashcards"));
  const ativo = somaMin(
    sessoes.filter((s) => s.categoria === "ativo" && s.atividade !== "flashcards"),
  );
  const imersao = somaMin(sessoes.filter((s) => s.categoria === "imersao"));
  const total = ativo + flashcards + imersao;

  return {
    ativo,
    flashcards,
    imersao,
    total,
    pctAtivo: pct(ativo, total),
    pctFlashcards: pct(flashcards, total),
    pctImersao: pct(imersao, total),
  };
}

/** Produção é fala + escrita — o gargalo real do método. */
export function minutosProducao(sessoes: SessaoDominio[]): number {
  return somaMin(sessoes.filter((s) => s.producao));
}

export function sessoesProducao(sessoes: SessaoDominio[]): number {
  return sessoes.filter((s) => s.producao).length;
}

// ---------------------------------------------------------------------------
// RN-703 — pilares contra a divisão-alvo
// ---------------------------------------------------------------------------

export type FatiaPilar = { pilar: Pilar; minutos: number; real: number; alvo: number; desvio: number };

/** A base inclui flashcards: sem isso vocabulário ficaria perto de zero. */
export function distribuicaoPilares(
  sessoes: SessaoDominio[],
  alvo: Record<Pilar, number>,
): FatiaPilar[] {
  const ativas = sessoes.filter((s) => s.categoria === "ativo");
  const base = somaMin(ativas);

  return PILARES.map((pilar) => {
    const minutos = somaMin(ativas.filter((s) => s.pilar === pilar));
    const real = pct(minutos, base);
    return { pilar, minutos, real, alvo: alvo[pilar], desvio: real - alvo[pilar] };
  });
}

export function maiorDesvioPilar(fatias: FatiaPilar[]): FatiaPilar | null {
  if (fatias.length === 0) return null;
  return fatias.reduce((a, b) => (Math.abs(b.desvio) > Math.abs(a.desvio) ? b : a));
}

// ---------------------------------------------------------------------------
// RN-709 / RN-710 — tempos, horas e dias da semana
// ---------------------------------------------------------------------------

export type FatiaTempo = { tempo: TempoDoDia; minutos: number; pct: number };

export function distribuicaoTempos(sessoes: SessaoDominio[]): FatiaTempo[] {
  const total = somaMin(sessoes);
  return (["cadeira", "maos_livres", "maos_ocupadas"] as const).map((tempo) => {
    const minutos = somaMin(sessoes.filter((s) => s.tempo === tempo));
    return { tempo, minutos, pct: pct(minutos, total) };
  });
}

export type PorHora = { horas: number[]; semHora: number; pico: number | null };

export function distribuicaoPorHora(
  sessoes: (SessaoDominio & { horaInicio?: string | null })[],
): PorHora {
  const horas = Array.from({ length: 24 }, () => 0);
  let semHora = 0;

  for (const s of sessoes) {
    const h = s.horaInicio ? Number(s.horaInicio.slice(0, 2)) : null;
    if (h === null || Number.isNaN(h)) semHora += s.duracaoMin;
    else horas[h] += s.duracaoMin;
  }

  const maximo = Math.max(...horas);
  return { horas, semHora, pico: maximo > 0 ? horas.indexOf(maximo) : null };
}

export type PorDiaSemana = { dias: number[]; maisForte: number | null; maisFraco: number | null };

export function distribuicaoPorDiaSemana(sessoes: SessaoDominio[]): PorDiaSemana {
  const acumulado = Array.from({ length: 7 }, () => 0);
  for (const s of sessoes) acumulado[diaDaSemana(s.data) - 1] += s.duracaoMin;

  const temDado = acumulado.some((v) => v > 0);
  if (!temDado) return { dias: acumulado, maisForte: null, maisFraco: null };

  const maisForte = acumulado.indexOf(Math.max(...acumulado)) + 1;
  const comDado = acumulado.filter((v) => v > 0);
  const maisFraco = acumulado.indexOf(Math.min(...comDado)) + 1;
  return { dias: acumulado, maisForte, maisFraco };
}

// ---------------------------------------------------------------------------
// RN-706 / RN-707 — fala e flashcards por semana
// ---------------------------------------------------------------------------

export type SemanaValor = { semana: DataISO; valor: number; diasNoPeriodo: number };

function semanasDo(periodo: Periodo): Map<DataISO, number> {
  const contagem = new Map<DataISO, number>();
  for (const d of intervalo(periodo.inicio, periodo.fim)) {
    const chave = chaveSemana(d);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return contagem;
}

export function falaPorSemana(sessoes: SessaoDominio[], periodo: Periodo): SemanaValor[] {
  const semanas = semanasDo(periodo);
  const porSemana = new Map<DataISO, number>();
  for (const s of noPeriodo(sessoes, periodo)) {
    const chave = chaveSemana(s.data);
    porSemana.set(chave, (porSemana.get(chave) ?? 0) + s.minutosFala);
  }
  return [...semanas.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, diasNoPeriodo]) => ({
      semana,
      valor: porSemana.get(semana) ?? 0,
      diasNoPeriodo,
    }));
}

/**
 * Semana parcial na borda do período entra proporcional aos dias que caem
 * dentro dele — senão a primeira e a última semana puxariam a média para baixo.
 */
export function mediaSemanal(valores: SemanaValor[]): number {
  if (valores.length === 0) return 0;
  const soma = valores.reduce((t, v) => t + (v.valor * 7) / v.diasNoPeriodo, 0);
  return soma / valores.length;
}

export function diaComFlashcards(
  sessoes: SessaoDominio[],
  revisoes: RevisaoDominio[],
): Set<DataISO> {
  const datas = new Set<DataISO>();
  for (const r of revisoes) if (r.revisou) datas.add(r.data);
  for (const s of sessoes) if (s.atividade === "flashcards") datas.add(s.data);
  return datas;
}

export function flashcardsPorSemana(
  sessoes: SessaoDominio[],
  revisoes: RevisaoDominio[],
  periodo: Periodo,
): SemanaValor[] {
  const comFlash = diaComFlashcards(sessoes, revisoes);
  const semanas = semanasDo(periodo);
  const porSemana = new Map<DataISO, number>();

  for (const d of comFlash) {
    if (!dentro(d, periodo)) continue;
    const chave = chaveSemana(d);
    porSemana.set(chave, (porSemana.get(chave) ?? 0) + 1);
  }

  return [...semanas.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([semana, diasNoPeriodo]) => ({
      semana,
      valor: porSemana.get(semana) ?? 0,
      diasNoPeriodo,
    }));
}

// ---------------------------------------------------------------------------
// RN-708 — dias com registro e concentração
// ---------------------------------------------------------------------------

export type Cobertura = {
  diasComRegistro: number;
  diasNoPeriodo: number;
  pct: number;
  lacuna: Lacuna;
};

export function cobertura(
  sessoes: SessaoDominio[],
  revisoes: RevisaoDominio[],
  periodo: Periodo,
  hoje: DataISO,
): Cobertura {
  const datas = [...diasComRegistro(sessoes, revisoes)].filter((d) => dentro(d, periodo));
  const diasNoPeriodo = dias(periodo.inicio, periodo.fim) + 1;
  return {
    diasComRegistro: datas.length,
    diasNoPeriodo,
    pct: pct(datas.length, diasNoPeriodo),
    lacuna: maiorLacuna(datas, periodo, hoje),
  };
}

export type DiaTotal = { data: DataISO; minutos: number };

export function minutosPorDia(sessoes: SessaoDominio[]): DiaTotal[] {
  const mapa = new Map<DataISO, number>();
  for (const s of sessoes) mapa.set(s.data, (mapa.get(s.data) ?? 0) + s.duracaoMin);
  return [...mapa.entries()]
    .map(([data, minutos]) => ({ data, minutos }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** "Seu mês inteiro cabe em três dias." */
export function concentracao(sessoes: SessaoDominio[], topN: number) {
  const porDia = minutosPorDia(sessoes).sort((a, b) => b.minutos - a.minutos);
  const total = porDia.reduce((t, d) => t + d.minutos, 0);
  const topo = porDia.slice(0, topN);
  return {
    dias: topo,
    minutos: topo.reduce((t, d) => t + d.minutos, 0),
    pct: pct(
      topo.reduce((t, d) => t + d.minutos, 0),
      total,
    ),
  };
}

// ---------------------------------------------------------------------------
// Por idioma e série temporal
// ---------------------------------------------------------------------------

export type FatiaIdioma = { idiomaId: string; minutos: number; pct: number };

export function minutosPorIdioma(sessoes: SessaoDominio[]): FatiaIdioma[] {
  const total = somaMin(sessoes);
  const mapa = new Map<string, number>();
  for (const s of sessoes) mapa.set(s.idiomaId, (mapa.get(s.idiomaId) ?? 0) + s.duracaoMin);
  return [...mapa.entries()]
    .map(([idiomaId, minutos]) => ({ idiomaId, minutos, pct: pct(minutos, total) }))
    .sort((a, b) => b.minutos - a.minutos);
}

export type PontoSerie = {
  rotulo: DataISO;
  ativo: number;
  flashcards: number;
  imersao: number;
  total: number;
};

/** Colunas empilhadas: por dia nos recortes curtos, por semana ISO no anual. */
export function serieTemporal(
  sessoes: SessaoDominio[],
  periodo: Periodo,
  granularidade: "dia" | "semana",
): PontoSerie[] {
  const chaves =
    granularidade === "dia"
      ? intervalo(periodo.inicio, periodo.fim)
      : [...semanasDo(periodo).keys()].sort();

  const vazio = () => ({ ativo: 0, flashcards: 0, imersao: 0 });
  const mapa = new Map(chaves.map((k) => [k, vazio()]));

  for (const s of noPeriodo(sessoes, periodo)) {
    const chave = granularidade === "dia" ? s.data : chaveSemana(s.data);
    const alvo = mapa.get(chave);
    if (!alvo) continue;
    if (s.categoria === "imersao") alvo.imersao += s.duracaoMin;
    else if (s.atividade === "flashcards") alvo.flashcards += s.duracaoMin;
    else alvo.ativo += s.duracaoMin;
  }

  return [...mapa.entries()].map(([rotulo, v]) => ({
    rotulo,
    ...v,
    total: v.ativo + v.flashcards + v.imersao,
  }));
}

export function medianaDiaria(sessoes: SessaoDominio[]): number {
  const valores = minutosPorDia(sessoes)
    .map((d) => d.minutos)
    .sort((a, b) => a - b);
  if (valores.length === 0) return 0;
  const meio = Math.floor(valores.length / 2);
  return valores.length % 2 === 0 ? (valores[meio - 1] + valores[meio]) / 2 : valores[meio];
}
