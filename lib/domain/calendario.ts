import { dias, intervalo, mesDe, somaDias, type DataISO } from "./datas";

/**
 * Fase A do calendário (docs/10): agregação por dia, só-leitura.
 * Tudo aqui é função pura — a tela desenha o que estas funções decidem.
 */

/** Semana começa no **domingo** (docs/10, decisão 6), contra a referência. */
export function colunaDaSemana(data: DataISO): number {
  // `diaDaSemana` é ISO: 1 = segunda … 7 = domingo. Domingo vira coluna 0.
  const iso = new Date(`${data}T12:00:00Z`).getUTCDay();
  return iso; // getUTCDay já é 0 = domingo … 6 = sábado
}

/**
 * As semanas que cobrem o mês inteiro, sempre com sete colunas cheias.
 * Os dias das pontas pertencem aos meses vizinhos e vêm marcados `noMes: false`
 * — sem eles a primeira linha ficaria torta.
 */
export function semanasDoMes(qualquerDiaDoMes: DataISO): DataISO[][] {
  const { inicio, fim } = mesDe(qualquerDiaDoMes);
  const primeiro = somaDias(inicio, -colunaDaSemana(inicio));
  const ultimo = somaDias(fim, 6 - colunaDaSemana(fim));

  const todos = intervalo(primeiro, ultimo);
  const semanas: DataISO[][] = [];
  for (let i = 0; i < todos.length; i += 7) semanas.push(todos.slice(i, i + 7));
  return semanas;
}

export type SessaoDoCalendario = {
  data: DataISO;
  idiomaId: string;
  duracaoMin: number;
};

export type TarefaDoCalendario = {
  data: DataISO;
  idiomaId: string | null;
  concluida: boolean;
};

export type ResumoDia = {
  data: DataISO;
  noMes: boolean;
  futuro: boolean;
  hoje: boolean;
  minutos: number;
  /** Ids de idioma com sessão nesse dia, sem repetir, na ordem de chegada. */
  idiomas: string[];
  tarefasAbertas: number;
  tarefasConcluidas: number;
  /** Tarefa aberta num dia que já passou (RN-1211). Hoje ainda não é atraso. */
  atrasada: boolean;
};

export function resumirMes(entrada: {
  mes: DataISO;
  hoje: DataISO;
  sessoes: SessaoDoCalendario[];
  tarefas: TarefaDoCalendario[];
}): ResumoDia[][] {
  const { inicio, fim } = mesDe(entrada.mes);

  const porDia = new Map<DataISO, { minutos: number; idiomas: string[] }>();
  for (const s of entrada.sessoes) {
    const atual = porDia.get(s.data) ?? { minutos: 0, idiomas: [] };
    atual.minutos += s.duracaoMin;
    if (!atual.idiomas.includes(s.idiomaId)) atual.idiomas.push(s.idiomaId);
    porDia.set(s.data, atual);
  }

  const tarefasPorDia = new Map<DataISO, { abertas: number; concluidas: number }>();
  for (const t of entrada.tarefas) {
    const atual = tarefasPorDia.get(t.data) ?? { abertas: 0, concluidas: 0 };
    if (t.concluida) atual.concluidas += 1;
    else atual.abertas += 1;
    tarefasPorDia.set(t.data, atual);
  }

  return semanasDoMes(entrada.mes).map((semana) =>
    semana.map((data): ResumoDia => {
      const s = porDia.get(data);
      const t = tarefasPorDia.get(data);
      const passou = dias(data, entrada.hoje) > 0;
      return {
        data,
        noMes: data >= inicio && data <= fim,
        futuro: dias(entrada.hoje, data) > 0,
        hoje: data === entrada.hoje,
        minutos: s?.minutos ?? 0,
        idiomas: s?.idiomas ?? [],
        tarefasAbertas: t?.abertas ?? 0,
        tarefasConcluidas: t?.concluidas ?? 0,
        atrasada: passou && (t?.abertas ?? 0) > 0,
      };
    }),
  );
}

/**
 * Teto da barra de volume: o maior dia **do próprio mês**. Comparar dentro do
 * mês é o que dá noção de volume; usar um teto fixo achataria um mês fraco e
 * estouraria um forte. Dias das pontas não contam — eles são de outro mês.
 */
export function escalaVolume(semanas: ResumoDia[][]): number {
  let maior = 0;
  for (const semana of semanas) {
    for (const dia of semana) {
      if (dia.noMes && dia.minutos > maior) maior = dia.minutos;
    }
  }
  return maior;
}

/** Fração da barra, entre 0 e 1. Escala zero devolve zero, sem dividir por zero. */
export function alturaDaBarra(minutos: number, escala: number): number {
  if (escala <= 0 || minutos <= 0) return 0;
  return Math.min(1, minutos / escala);
}

export type TotaisDoMes = {
  minutos: number;
  diasComRegistro: number;
  diasNoMes: number;
  tarefasAbertas: number;
  tarefasConcluidas: number;
  atrasadas: number;
};

export function totaisDoMes(semanas: ResumoDia[][]): TotaisDoMes {
  const doMes = semanas.flat().filter((d) => d.noMes);
  return {
    minutos: doMes.reduce((t, d) => t + d.minutos, 0),
    diasComRegistro: doMes.filter((d) => d.minutos > 0).length,
    diasNoMes: doMes.length,
    tarefasAbertas: doMes.reduce((t, d) => t + d.tarefasAbertas, 0),
    tarefasConcluidas: doMes.reduce((t, d) => t + d.tarefasConcluidas, 0),
    atrasadas: doMes.filter((d) => d.atrasada).length,
  };
}

/** Mês anterior e seguinte, para as setas. */
export function mesVizinho(mes: DataISO, passo: -1 | 1): DataISO {
  const { inicio, fim } = mesDe(mes);
  return passo === -1 ? mesDe(somaDias(inicio, -1)).inicio : mesDe(somaDias(fim, 1)).inicio;
}

export const NOMES_DOS_DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function nomeDoMes(mes: DataISO): string {
  const rotulo = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${mes}T12:00:00Z`));
  return rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
}
