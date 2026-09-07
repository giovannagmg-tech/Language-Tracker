import { chaveSemana, diaDaSemana, somaDias, type DataISO } from "./datas";
import type { Marcha, TipoTarefa } from "./tipos";

/**
 * RN-801 a RN-804. As tarefas que as regras cobram, geradas sozinhas.
 * Tudo aqui é puro: o motor lê o estado, chama esta função e grava o que
 * falta. Rodar duas vezes no mesmo dia não pode duplicar nada (RN-802).
 */

export type Janela = "dia" | "semana" | "mes" | "bloco";

export type NovaTarefa = {
  tipo: TipoTarefa;
  titulo: string;
  idiomaId: string | null;
  dataPrevista: DataISO;
  janela: Janela;
  chaveIdempotencia: string;
  quantidadeExigida: number;
  pontoGramaticalId?: string;
};

/** A chave que impede a segunda cópia: tipo, idioma, janela e a referência dela. */
export function chaveIdempotencia(
  tipo: TipoTarefa,
  idiomaId: string | null,
  janela: Janela,
  referencia: string,
): string {
  return [tipo, idiomaId ?? "global", janela, referencia].join(":");
}

function referenciaDaJanela(janela: Janela, hoje: DataISO, bloco?: string): string {
  if (janela === "dia") return hoje;
  if (janela === "semana") return chaveSemana(hoje);
  if (janela === "mes") return hoje.slice(0, 7);
  return bloco ?? hoje.slice(0, 4);
}

export type ContextoTarefas = {
  hoje: DataISO;
  marchaAtiva: Marcha;
  /** Palavras criadas e ainda não ativadas com frase falada, por idioma (RN-408). */
  pendentesAtivacao: { idiomaId: string; quantidade: number }[];
  /** Pontos marcados como "errei na revisão" e ainda sem tarefa (RN-410). */
  pontosComErro: { id: string; idiomaId: string; titulo: string; frasesExigidas: number }[];
  audioNaSemana: boolean;
  clubeAgendado: boolean;
  conversacaoNaSemana: boolean;
  videoNoMes: boolean;
  /** Bloco que fechou e ainda não tem autoavaliação — por idioma. */
  autoavaliacoesPendentes: { blocoId: string; idiomaId: string; nomeIdioma: string }[];
};

export function tarefasAGerar(ctx: ContextoTarefas): NovaTarefa[] {
  const novas: NovaTarefa[] = [];
  const semana = chaveSemana(ctx.hoje);
  const domingo = somaDias(semana, 6);

  // RN-410 — erro em ponto gramatical vira duas frases faladas, para amanhã.
  for (const ponto of ctx.pontosComErro) {
    novas.push({
      tipo: "frases_apos_erro",
      titulo: `2 frases em voz alta com ${ponto.titulo}`,
      idiomaId: ponto.idiomaId,
      dataPrevista: somaDias(ctx.hoje, 1),
      janela: "dia",
      chaveIdempotencia: chaveIdempotencia("frases_apos_erro", ponto.idiomaId, "dia", ponto.id),
      quantidadeExigida: ponto.frasesExigidas,
      pontoGramaticalId: ponto.id,
    });
  }

  // RN-408 — palavra criada só sai da fila "nova" depois de virar frase falada.
  for (const pendente of ctx.pendentesAtivacao) {
    if (pendente.quantidade <= 0) continue;
    novas.push({
      tipo: "ativar_palavras",
      titulo: `Ativar ${pendente.quantidade} ${pendente.quantidade === 1 ? "palavra" : "palavras"} com frases faladas`,
      idiomaId: pendente.idiomaId,
      dataPrevista: somaDias(ctx.hoje, 2),
      janela: "dia",
      chaveIdempotencia: chaveIdempotencia(
        "ativar_palavras",
        pendente.idiomaId,
        "dia",
        referenciaDaJanela("dia", ctx.hoje),
      ),
      quantidadeExigida: pendente.quantidade,
    });
  }

  // RN-304 — um áudio no grupo por semana, gerado na segunda.
  if (!ctx.audioNaSemana) {
    novas.push({
      tipo: "audio_grupo",
      titulo: "Mandar um áudio no grupo",
      idiomaId: null,
      dataPrevista: domingo,
      janela: "semana",
      chaveIdempotencia: chaveIdempotencia("audio_grupo", null, "semana", semana),
      quantidadeExigida: 1,
    });
  }

  // RN-303 — o clube é compromisso marcado, e só é cobrado da marcha 2 em diante.
  if (ctx.marchaAtiva >= 2 && !ctx.clubeAgendado && !ctx.conversacaoNaSemana) {
    novas.push({
      tipo: "clube_conversacao",
      titulo: "Marcar o clube de conversação",
      idiomaId: null,
      dataPrevista: proximaQuarta(ctx.hoje),
      janela: "semana",
      chaveIdempotencia: chaveIdempotencia("clube_conversacao", null, "semana", semana),
      quantidadeExigida: 1,
    });
  }

  // Marcha 3 pede um vídeo de produção por mês.
  if (ctx.marchaAtiva === 3 && !ctx.videoNoMes) {
    novas.push({
      tipo: "gravar_video",
      titulo: "Gravar um vídeo de produção",
      idiomaId: null,
      dataPrevista: fimDoMes(ctx.hoje),
      janela: "mes",
      chaveIdempotencia: chaveIdempotencia("gravar_video", null, "mes", ctx.hoje.slice(0, 7)),
      quantidadeExigida: 1,
    });
  }

  // RN-504 — bloco fechado sem autoavaliação.
  for (const pendente of ctx.autoavaliacoesPendentes) {
    novas.push({
      tipo: "autoavaliacao",
      titulo: `Autoavaliar o ${pendente.nomeIdioma}`,
      idiomaId: pendente.idiomaId,
      dataPrevista: ctx.hoje,
      janela: "bloco",
      chaveIdempotencia: chaveIdempotencia(
        "autoavaliacao",
        pendente.idiomaId,
        "bloco",
        pendente.blocoId,
      ),
      quantidadeExigida: 1,
    });
  }

  return novas;
}

/** A sugestão de data do clube: a próxima quarta que ainda não passou. */
export function proximaQuarta(hoje: DataISO): DataISO {
  const dia = diaDaSemana(hoje);
  const ate = dia < 3 ? 3 - dia : 10 - dia;
  return somaDias(hoje, ate);
}

export function fimDoMes(data: DataISO): DataISO {
  const [ano, mes] = data.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${String(mes).padStart(2, "0")}-${ultimo}`;
}

/**
 * RN-803. Automática pode ser concluída, adiada uma vez, ou dispensada.
 * Título e critério são somente leitura.
 */
export function podeAdiar(tarefa: { automatica: boolean; adiadaVezes: number }): boolean {
  return !tarefa.automatica || tarefa.adiadaVezes < 1;
}

export function novaDataAoAdiar(
  dataPrevista: DataISO,
  janela: Janela,
): DataISO {
  return somaDias(dataPrevista, janela === "dia" ? 1 : 7);
}

export type TarefaLista = {
  id: string;
  tipo: TipoTarefa;
  automatica: boolean;
  titulo: string;
  idiomaId: string | null;
  dataPrevista: DataISO;
  quantidadeExigida: number;
  quantidadeFeita: number;
  estado: "aberta" | "concluida" | "adiada" | "dispensada";
  adiadaVezes: number;
};

export function estaAtrasada(t: TarefaLista, hoje: DataISO): boolean {
  return t.estado === "aberta" && t.dataPrevista < hoje;
}

/** Abertas primeiro, atrasadas no topo, depois por prazo. */
export function ordenarTarefas(tarefas: TarefaLista[], hoje: DataISO): TarefaLista[] {
  return [...tarefas].sort((a, b) => {
    const abertaA = a.estado === "aberta" ? 0 : 1;
    const abertaB = b.estado === "aberta" ? 0 : 1;
    if (abertaA !== abertaB) return abertaA - abertaB;

    const atrasoA = estaAtrasada(a, hoje) ? 0 : 1;
    const atrasoB = estaAtrasada(b, hoje) ? 0 : 1;
    if (atrasoA !== atrasoB) return atrasoA - atrasoB;

    return a.dataPrevista.localeCompare(b.dataPrevista);
  });
}
