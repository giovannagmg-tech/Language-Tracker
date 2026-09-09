import { dias, type DataISO } from "./datas";
import type { EstadoSemaforo } from "./tipos";

/**
 * Metas livres — o que você escreve à mão, fora dos indicadores do método.
 * Tudo aqui é função pura: a tela só desenha o que estas funções decidem.
 */
export type MetaLivre = {
  id: string;
  idiomaId: string | null;
  titulo: string;
  unidade: string;
  alvo: number;
  feito: number;
  prazo: DataISO | null;
  concluidaEm: DataISO | null;
  criadaEm: DataISO;
  ativa: boolean;
};

export type MetaLivreAvaliada = MetaLivre & {
  progresso: number;
  concluida: boolean;
  faltam: number;
  diasRestantes: number | null;
  /** Quanto falta por dia para chegar no prazo. `null` sem prazo ou concluída. */
  ritmoNecessario: number | null;
  estado: EstadoSemaforo;
  resumo: string;
};

export function progressoDaMeta(feito: number, alvo: number): number {
  if (alvo <= 0) return 0;
  return Math.min(1, Math.max(0, feito / alvo));
}

/**
 * Verde concluída ou no ritmo · amarelo atrasada mas dá tempo · vermelho
 * prazo vencido sem concluir · cinza sem prazo (não existe atraso sem prazo).
 *
 * "No ritmo" compara a fração feita com a fração do tempo já gasto: no meio do
 * prazo com metade feita está em dia.
 */
export function avaliarMetaLivre(meta: MetaLivre, hoje: DataISO): MetaLivreAvaliada {
  const progresso = progressoDaMeta(meta.feito, meta.alvo);
  const concluida = meta.feito >= meta.alvo;
  const faltam = Math.max(0, meta.alvo - meta.feito);
  const diasRestantes = meta.prazo === null ? null : dias(hoje, meta.prazo);

  let estado: EstadoSemaforo;
  let ritmoNecessario: number | null = null;

  if (concluida) {
    estado = "verde";
  } else if (diasRestantes === null) {
    estado = "cinza";
  } else if (diasRestantes < 0) {
    estado = "vermelho";
  } else {
    // +1 porque hoje ainda conta como dia de trabalho.
    ritmoNecessario = faltam / (diasRestantes + 1);
    estado = progresso >= fracaoDoPrazoGasta(meta, hoje) ? "verde" : "amarelo";
  }

  return {
    ...meta,
    progresso,
    concluida,
    faltam,
    diasRestantes,
    ritmoNecessario,
    estado,
    resumo: resumoDaMeta({ concluida, faltam, diasRestantes, unidade: meta.unidade }),
  };
}

/**
 * Fração do prazo já consumida, medida entre a criação da meta e o prazo.
 * Prazo no mesmo dia da criação (ou antes) conta como corrida inteira gasta —
 * dividir por zero aqui seria transformar meta apertada em meta sempre verde.
 */
export function fracaoDoPrazoGasta(meta: MetaLivre, hoje: DataISO): number {
  if (meta.prazo === null) return 0;
  const total = dias(meta.criadaEm, meta.prazo);
  if (total <= 0) return 1;
  const gastos = dias(meta.criadaEm, hoje);
  return Math.min(1, Math.max(0, gastos / total));
}

function resumoDaMeta(e: {
  concluida: boolean;
  faltam: number;
  diasRestantes: number | null;
  unidade: string;
}): string {
  if (e.concluida) return "concluída";

  const quanto = `${e.faltam} ${plural(e.unidade, e.faltam)}`;
  if (e.diasRestantes === null) return `faltam ${quanto}`;
  if (e.diasRestantes < 0) {
    const atraso = Math.abs(e.diasRestantes);
    return `prazo vencido há ${atraso} ${atraso === 1 ? "dia" : "dias"} · faltam ${quanto}`;
  }
  if (e.diasRestantes === 0) return `vence hoje · faltam ${quanto}`;
  return `faltam ${quanto} em ${e.diasRestantes} ${e.diasRestantes === 1 ? "dia" : "dias"}`;
}

/** Plural ingênuo, suficiente para "livro/livros", "aula/aulas", "episódio/episódios". */
export function plural(unidade: string, quantidade: number): string {
  if (quantidade === 1) return unidade;
  if (unidade.endsWith("s")) return unidade;
  if (unidade.endsWith("ão")) return `${unidade.slice(0, -2)}ões`;
  if (/[rzn]$/.test(unidade)) return `${unidade}es`;
  return `${unidade}s`;
}

/**
 * Pendentes antes de concluídas; dentro das pendentes, a mais urgente primeiro.
 * Sem prazo vai para o fim das pendentes — não é atrasada, só não tem data.
 */
export function ordenarMetasLivres(metas: MetaLivreAvaliada[]): MetaLivreAvaliada[] {
  const peso: Record<EstadoSemaforo, number> = {
    vermelho: 0,
    amarelo: 1,
    verde: 2,
    cinza: 3,
  };
  return [...metas].sort((a, b) => {
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    if (!a.concluida && !b.concluida) {
      if (peso[a.estado] !== peso[b.estado]) return peso[a.estado] - peso[b.estado];
      if (a.diasRestantes !== null && b.diasRestantes !== null) {
        return a.diasRestantes - b.diasRestantes;
      }
      if (a.diasRestantes === null) return 1;
      if (b.diasRestantes === null) return -1;
    }
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

export function resumoDaLista(metas: MetaLivreAvaliada[]): {
  total: number;
  concluidas: number;
  atrasadas: number;
} {
  return {
    total: metas.length,
    concluidas: metas.filter((m) => m.concluida).length,
    atrasadas: metas.filter((m) => m.estado === "vermelho").length,
  };
}
