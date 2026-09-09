/**
 * Tipos e constantes do backup. Ficam fora do módulo `"use server"` porque só
 * funções assíncronas podem ser exportadas de lá.
 *
 * A ordem das tabelas é a ordem de restauração: quem tem chave estrangeira vem
 * depois de quem ela aponta. Para apagar, percorre-se ao contrário.
 */
export const TABELAS = [
  "config",
  "idiomas",
  "camadas",
  "marchas_def",
  "marcha_historico",
  "blocos_plano",
  "distribuicao_alvo",
  "materiais",
  "material_progresso",
  "sessoes",
  "registros_vocabulario",
  "revisoes_flashcards",
  "pontos_gramaticais",
  "metas",
  "tarefas",
  "recursos",
  "autoavaliacoes",
  "conquista_estado",
  "retomadas",
  "retomada_fases",
  "regras_mapeamento_toggl",
  "lotes_importacao",
] as const;

export const VERSAO_BACKUP = 1;

export type Backup = {
  versao: number;
  exportadoEm: string;
  tabelas: Record<string, unknown[]>;
};

export type Diagnostico = {
  medianaRegistroMs: number | null;
  registrosPorOrigem: { origem: string; total: number }[];
  diasComAppAberto: number;
  totalSessoes: number;
  ultimoBackup: string | null;
  hoje: string;
};
