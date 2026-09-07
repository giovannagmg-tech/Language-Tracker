import type { DataISO } from "./datas";
import type {
  Atividade,
  Categoria,
  Marcha,
  Pilar,
  TempoDoDia,
} from "./tipos";

/**
 * Formas que o domínio consome. Não são as linhas do banco: são o mínimo que
 * as regras precisam. Quem traduz a linha do Supabase para cá é `lib/queries`.
 */

export type SessaoDominio = {
  id: string;
  data: DataISO;
  idiomaId: string;
  duracaoMin: number;
  categoria: Categoria;
  pilar: Pilar | null;
  atividade: Atividade;
  tempo: TempoDoDia;
  minutosFala: number;
  producao: boolean;
  violouRegra5: boolean;
};

export type RevisaoDominio = {
  data: DataISO;
  idiomaId: string;
  revisou: boolean;
};

export type TarefaDominio = {
  id: string;
  tipo: string;
  dataPrevista: DataISO;
  estado: "aberta" | "concluida" | "adiada" | "dispensada";
  concluidaEm: DataISO | null;
};

/** Uma tarefa do catálogo da marcha, como vem do jsonb de `marchas_def`. */
export type CriterioTarefa =
  | { tipo: "check_flashcards" }
  | { tipo: "minutos_fala"; min: number }
  | { tipo: "sessao_atividade"; atividade: Atividade; min: number }
  | {
      tipo: "minutos_categoria_tempo";
      categoria: Categoria;
      tempo: TempoDoDia;
      min: number;
    }
  | { tipo: "minutos_pilar"; pilar: Pilar; min: number }
  | { tipo: "item_revisao"; min: number };

export type TarefaDeMarcha = {
  chave: string;
  titulo: string;
  dias_semana: number[];
  escopo: "dia" | "semana";
  criterio: CriterioTarefa;
  opcional: boolean;
};

export type DefinicaoMarcha = {
  numero: Marcha;
  nome: string;
  descricao: string;
  tarefas: TarefaDeMarcha[];
};

/** Resultado da avaliação de uma tarefa contra os dados reais. */
export type TarefaAvaliada = {
  chave: string;
  titulo: string;
  escopo: "dia" | "semana";
  opcional: boolean;
  cumprida: boolean;
  atual: number;
  alvo: number;
  /** Unidade do progresso, para a interface escrever "18/40 min". */
  unidade: "min" | "sessao" | "check";
  marcha: Marcha;
};
