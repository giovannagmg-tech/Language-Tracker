import { dias, type DataISO } from "./datas";

/**
 * RN-1103. Tudo que está em dívida num lugar só, ordenado por urgência.
 * A fila de cartões devidos NÃO entra aqui — ela mora no Flashcards Deluxe.
 */

export type TipoItemRevisao =
  | "frases_apos_erro"
  | "audio_grupo"
  | "ativar_palavras"
  | "autoavaliacao"
  | "gravar_video"
  | "ponto_gramatical";

export const PESO_TIPO: Record<TipoItemRevisao, number> = {
  frases_apos_erro: 100,
  audio_grupo: 90,
  ativar_palavras: 80,
  autoavaliacao: 70,
  gravar_video: 60,
  ponto_gramatical: 50,
};

export const ROTULO_TIPO: Record<TipoItemRevisao, string> = {
  frases_apos_erro: "Frases depois do erro",
  audio_grupo: "Áudio no grupo",
  ativar_palavras: "Palavras para ativar",
  autoavaliacao: "Autoavaliação de bloco",
  gravar_video: "Gravação de produção",
  ponto_gramatical: "Ponto gramatical",
};

export type ItemRevisao = {
  id: string;
  tipo: TipoItemRevisao;
  titulo: string;
  idiomaId: string | null;
  /** Data em que a dívida nasceu ou venceu. */
  data: DataISO;
  quantidadeExigida: number;
  quantidadeFeita: number;
  /** Chave da ação que resolve o item na interface. */
  acao: "frases" | "ativar" | "sessao" | "audio" | "autoavaliar" | "marcar_gravado";
};

export function diasDeAtraso(item: ItemRevisao, hoje: DataISO): number {
  return Math.max(0, dias(item.data, hoje));
}

/** Atraso domina; o peso do tipo desempata. */
export function urgencia(item: ItemRevisao, hoje: DataISO): number {
  return diasDeAtraso(item, hoje) * 1000 + PESO_TIPO[item.tipo];
}

export function ordenarPorUrgencia(itens: ItemRevisao[], hoje: DataISO): ItemRevisao[] {
  return [...itens].sort((a, b) => urgencia(b, hoje) - urgencia(a, hoje));
}

export function textoDeAtraso(item: ItemRevisao, hoje: DataISO): string {
  const atraso = diasDeAtraso(item, hoje);
  if (atraso === 0) return "de hoje";
  if (atraso === 1) return "de ontem";
  return `atrasado há ${atraso} dias`;
}
