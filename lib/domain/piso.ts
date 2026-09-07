import type { RevisaoDominio, SessaoDominio } from "./modelos";
import type { DataISO } from "./datas";
import type { EstadoSemaforo } from "./tipos";

/**
 * RN-302. O piso diário: flashcards revisados + pelo menos 1 minuto de fala.
 * Não depende da marcha, não depende do dia da semana, não tem exceção.
 */
export type Piso = {
  flashcards: boolean;
  fala: boolean;
  cumprido: boolean;
  minutosFala: number;
  estado: EstadoSemaforo;
};

export function minutosFalaDoDia(sessoes: Pick<SessaoDominio, "minutosFala">[]): number {
  return sessoes.reduce((total, s) => total + s.minutosFala, 0);
}

export function temRevisaoNoDia(
  revisoes: Pick<RevisaoDominio, "revisou">[],
): boolean {
  return revisoes.some((r) => r.revisou);
}

export function pisoDoDia(entrada: {
  revisoes: Pick<RevisaoDominio, "revisou">[];
  sessoes: Pick<SessaoDominio, "minutosFala">[];
  /** Hora local em São Paulo; o dia só "aperta" a partir de `horaAperto`. */
  hora: number;
  horaAperto: number;
}): Piso {
  const flashcards = temRevisaoNoDia(entrada.revisoes);
  const minutos = minutosFalaDoDia(entrada.sessoes);
  const fala = minutos >= 1;
  const cumprido = flashcards && fala;

  let estado: EstadoSemaforo;
  if (cumprido) estado = "verde";
  else if (flashcards || fala) estado = "amarelo";
  else estado = entrada.hora >= entrada.horaAperto ? "vermelho" : "cinza";

  return { flashcards, fala, cumprido, minutosFala: minutos, estado };
}

/** Conjunto de dias em que o piso foi cumprido — entrada da sequência do piso. */
export function diasComPiso(
  sessoes: Pick<SessaoDominio, "data" | "minutosFala">[],
  revisoes: Pick<RevisaoDominio, "data" | "revisou">[],
): Set<DataISO> {
  const fala = new Map<DataISO, number>();
  for (const s of sessoes) {
    fala.set(s.data, (fala.get(s.data) ?? 0) + s.minutosFala);
  }

  const comRevisao = new Set<DataISO>();
  for (const r of revisoes) {
    if (r.revisou) comRevisao.add(r.data);
  }

  const resultado = new Set<DataISO>();
  for (const data of comRevisao) {
    if ((fala.get(data) ?? 0) >= 1) resultado.add(data);
  }
  return resultado;
}

/** Um dia em branco é um dia sem nada: nem sessão, nem check (RN-301). */
export function diasComRegistro(
  sessoes: Pick<SessaoDominio, "data">[],
  revisoes: Pick<RevisaoDominio, "data" | "revisou">[],
): Set<DataISO> {
  const datas = new Set<DataISO>();
  for (const s of sessoes) datas.add(s.data);
  for (const r of revisoes) if (r.revisou) datas.add(r.data);
  return datas;
}
