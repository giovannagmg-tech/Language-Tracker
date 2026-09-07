import { TZDate } from "@date-fns/tz";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

/**
 * Regra 3 do CLAUDE.md: timestamps em UTC no banco, conversão na borda.
 * "Hoje" é o dia civil em São Paulo — nunca `new Date()` cru do servidor,
 * que na Vercel roda em UTC e vira o dia às 21h locais.
 */
export const FUSO = "America/Sao_Paulo";

/** Data civil no formato `YYYY-MM-DD`. É assim que toda data é guardada e comparada. */
export type DataISO = string;

const FORMATO = "yyyy-MM-dd";

/** Converte um instante (UTC) para a data civil em São Paulo. */
export function dataLocal(instante: Date = new Date()): DataISO {
  return format(new TZDate(instante, FUSO), FORMATO);
}

/** A data civil de hoje em São Paulo. Única fonte de "hoje" no app inteiro. */
export function hoje(agora: Date = new Date()): DataISO {
  return dataLocal(agora);
}

/** Hora do dia (0–23) em São Paulo. Usada pelos gatilhos de horário (RN-1101). */
export function horaLocal(instante: Date = new Date()): number {
  return new TZDate(instante, FUSO).getHours();
}

/** Instante UTC correspondente a 00:00:00 de uma data civil em São Paulo. */
export function inicioDoDia(data: DataISO): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(new TZDate(ano, mes - 1, dia, 0, 0, 0, 0, FUSO).getTime());
}

/** Instante UTC correspondente a 23:59:59.999 de uma data civil em São Paulo. */
export function fimDoDia(data: DataISO): Date {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(new TZDate(ano, mes - 1, dia, 23, 59, 59, 999, FUSO).getTime());
}

/** Dia da semana em base ISO: 1 = segunda … 7 = domingo. */
export function diaDaSemana(data: DataISO): number {
  const d = parseISO(data).getUTCDay();
  return d === 0 ? 7 : d;
}

export function ehSexta(data: DataISO): boolean {
  return diaDaSemana(data) === 5;
}

/** Diferença em dias civis. `dias("2026-09-07", "2026-09-09")` = 2. */
export function dias(de: DataISO, ate: DataISO): number {
  return differenceInCalendarDays(parseISO(ate), parseISO(de));
}

export function somaDias(data: DataISO, quantidade: number): DataISO {
  return format(addDays(parseISO(data), quantidade), FORMATO);
}

/** Semana ISO (segunda a domingo) que contém a data. */
export function semanaDe(data: DataISO): { inicio: DataISO; fim: DataISO } {
  const offset = diaDaSemana(data) - 1;
  const inicio = somaDias(data, -offset);
  return { inicio, fim: somaDias(inicio, 6) };
}

/** Chave estável de semana ISO, usada em idempotência de tarefas (RN-802). */
export function chaveSemana(data: DataISO): string {
  return semanaDe(data).inicio;
}

export function mesDe(data: DataISO): { inicio: DataISO; fim: DataISO } {
  const [ano, mes] = data.split("-").map(Number);
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return { inicio, fim: `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}` };
}

export function anoDe(data: DataISO): { inicio: DataISO; fim: DataISO } {
  const ano = data.slice(0, 4);
  return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` };
}

/** Todas as datas civis de um intervalo, inclusive nas duas pontas. */
export function intervalo(de: DataISO, ate: DataISO): DataISO[] {
  const total = dias(de, ate);
  if (total < 0) return [];
  return Array.from({ length: total + 1 }, (_, i) => somaDias(de, i));
}
