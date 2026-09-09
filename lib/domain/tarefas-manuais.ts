import { dias, type DataISO } from "./datas";
import type { EstadoTarefa, Pilar } from "./tipos";

/**
 * Tarefas escritas à mão no calendário (docs/10, fase C).
 * As automáticas continuam nascendo em `lib/motores/tarefas.ts` — aqui é só o
 * que a usuária cria, e as regras que decidem o que ela pode fazer com elas.
 */
export type TarefaManual = {
  id: string;
  titulo: string;
  descricao: string | null;
  idiomaId: string | null;
  data: DataISO;
  pilar: Pilar | null;
  horaPrevista: string | null;
  duracaoPrevistaMin: number | null;
  estado: EstadoTarefa;
  automatica: boolean;
  doDia: boolean;
  adiadaVezes: number;
};

export type TarefaManualAvaliada = TarefaManual & {
  concluida: boolean;
  atrasada: boolean;
  podeAdiar: boolean;
  podeEditar: boolean;
  /** Dias de atraso; 0 quando não está atrasada. */
  diasDeAtraso: number;
};

/** RN-803: adiar uma vez só. A segunda tentativa é recusada. */
export const LIMITE_DE_ADIAMENTOS = 1;

export function avaliarTarefa(t: TarefaManual, hoje: DataISO): TarefaManualAvaliada {
  const concluida = t.estado === "concluida";
  const atrasoEmDias = dias(t.data, hoje);
  // RN-1211: o dia de hoje ainda não acabou, então não é atraso.
  const atrasada = !concluida && t.estado !== "dispensada" && atrasoEmDias > 0;

  return {
    ...t,
    concluida,
    atrasada,
    diasDeAtraso: atrasada ? atrasoEmDias : 0,
    podeAdiar: !concluida && t.estado !== "dispensada" && t.adiadaVezes < LIMITE_DE_ADIAMENTOS,
    // RN-1204: automática não é editável — quem manda nela é o motor de marcha.
    podeEditar: !t.automatica,
  };
}

/**
 * Ordem dentro do painel do dia: a do dia primeiro, depois as abertas, depois
 * as concluídas. Empate resolve por hora prevista, e depois por título — sem
 * isso a lista dança a cada recarga.
 */
export function ordenarTarefas(tarefas: TarefaManualAvaliada[]): TarefaManualAvaliada[] {
  return [...tarefas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    if (a.doDia !== b.doDia) return a.doDia ? -1 : 1;
    if (a.horaPrevista !== b.horaPrevista) {
      if (a.horaPrevista === null) return 1;
      if (b.horaPrevista === null) return -1;
      return a.horaPrevista.localeCompare(b.horaPrevista);
    }
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

/**
 * O que o registro rápido recebe quando ela conclui uma tarefa (RN-1207).
 * Concluir **não** grava sessão sozinho: devolve o rascunho para ela confirmar
 * o que de fato aconteceu. Medir intenção como execução inflaria o Dashboard.
 */
export type RascunhoDeSessao = {
  idiomaId: string | null;
  pilar: Pilar | null;
  data: DataISO;
  duracaoMin: number | null;
  tarefaId: string;
};

export function rascunhoDaTarefa(t: TarefaManual): RascunhoDeSessao {
  return {
    idiomaId: t.idiomaId,
    pilar: t.pilar,
    data: t.data,
    duracaoMin: t.duracaoPrevistaMin,
    tarefaId: t.id,
  };
}

/** Vira query string para `/registro`. Campo ausente simplesmente não vai. */
export function paramsDoRascunho(r: RascunhoDeSessao): string {
  const p = new URLSearchParams();
  if (r.idiomaId) p.set("idioma", r.idiomaId);
  if (r.pilar) p.set("pilar", r.pilar);
  p.set("data", r.data);
  if (r.duracaoMin !== null) p.set("duracao", String(r.duracaoMin));
  p.set("tarefa", r.tarefaId);
  return p.toString();
}

export type ResumoDoDia = {
  total: number;
  abertas: number;
  concluidas: number;
  atrasadas: number;
};

export function resumirDia(tarefas: TarefaManualAvaliada[]): ResumoDoDia {
  return {
    total: tarefas.length,
    abertas: tarefas.filter((t) => !t.concluida && t.estado !== "dispensada").length,
    concluidas: tarefas.filter((t) => t.concluida).length,
    atrasadas: tarefas.filter((t) => t.atrasada).length,
  };
}
