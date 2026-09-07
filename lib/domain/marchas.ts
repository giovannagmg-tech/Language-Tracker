import { diaDaSemana, type DataISO } from "./datas";
import type {
  CriterioTarefa,
  DefinicaoMarcha,
  RevisaoDominio,
  SessaoDominio,
  TarefaAvaliada,
  TarefaDeMarcha,
} from "./modelos";
import type { Marcha } from "./tipos";

export type ContextoMarcha = {
  definicoes: DefinicaoMarcha[];
  marchaAtiva: Marcha;
  data: DataISO;
  sessoesDoDia: SessaoDominio[];
  revisoesDoDia: RevisaoDominio[];
  sessoesDaSemana: SessaoDominio[];
  itensRevisaoResolvidosNoDia: number;
};

type Progresso = { atual: number; alvo: number; unidade: TarefaAvaliada["unidade"] };

function avaliarCriterio(criterio: CriterioTarefa, ctx: ContextoMarcha, escopo: "dia" | "semana"): Progresso {
  const sessoes = escopo === "semana" ? ctx.sessoesDaSemana : ctx.sessoesDoDia;

  switch (criterio.tipo) {
    case "check_flashcards":
      return {
        atual: ctx.revisoesDoDia.some((r) => r.revisou) ? 1 : 0,
        alvo: 1,
        unidade: "check",
      };
    case "minutos_fala":
      return {
        atual: sessoes.reduce((t, s) => t + s.minutosFala, 0),
        alvo: criterio.min,
        unidade: "min",
      };
    case "sessao_atividade":
      return {
        atual: sessoes.filter((s) => s.atividade === criterio.atividade).length,
        alvo: criterio.min,
        unidade: "sessao",
      };
    case "minutos_categoria_tempo":
      return {
        atual: sessoes
          .filter((s) => s.categoria === criterio.categoria && s.tempo === criterio.tempo)
          .reduce((t, s) => t + s.duracaoMin, 0),
        alvo: criterio.min,
        unidade: "min",
      };
    case "minutos_pilar":
      return {
        atual: sessoes
          .filter((s) => s.pilar === criterio.pilar)
          .reduce((t, s) => t + s.duracaoMin, 0),
        alvo: criterio.min,
        unidade: "min",
      };
    case "item_revisao":
      return { atual: ctx.itensRevisaoResolvidosNoDia, alvo: criterio.min, unidade: "sessao" };
  }
}

function valeHoje(tarefa: TarefaDeMarcha, data: DataISO): boolean {
  if (tarefa.escopo === "semana") return true;
  if (tarefa.dias_semana.length === 0) return true;
  return tarefa.dias_semana.includes(diaDaSemana(data));
}

/**
 * RN-203. As tarefas que a marcha vigente exige hoje, já avaliadas.
 * As marchas são cumulativas: a 2 inclui a 1, a 3 inclui as duas.
 * RN-206: o bloco da marcha 1 vem sempre primeiro e nunca é removido.
 * RN-204: a sexta de pronúncia e a ausência de gramática na sexta vêm da
 * própria definição das marchas — é dado, não código.
 */
export function tarefasDoDia(ctx: ContextoMarcha): TarefaAvaliada[] {
  const avaliadas: TarefaAvaliada[] = [];

  for (const def of ctx.definicoes) {
    if (def.numero > ctx.marchaAtiva) continue;

    for (const tarefa of def.tarefas) {
      if (!valeHoje(tarefa, ctx.data)) continue;

      const progresso = avaliarCriterio(tarefa.criterio, ctx, tarefa.escopo);
      avaliadas.push({
        chave: tarefa.chave,
        titulo: tarefa.titulo,
        escopo: tarefa.escopo,
        opcional: tarefa.opcional,
        cumprida: progresso.atual >= progresso.alvo,
        atual: progresso.atual,
        alvo: progresso.alvo,
        unidade: progresso.unidade,
        marcha: def.numero,
      });
    }
  }

  return avaliadas.sort((a, b) => {
    if (a.marcha !== b.marcha) return a.marcha - b.marcha;
    if (a.cumprida !== b.cumprida) return a.cumprida ? 1 : -1;
    return 0;
  });
}

/** O que falta hoje — alimenta o badge da sidebar (RN-1102). */
export function pendentesDoDia(tarefas: TarefaAvaliada[]): number {
  return tarefas.filter((t) => !t.cumprida && !t.opcional).length;
}
