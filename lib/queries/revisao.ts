import "server-only";
import { cache } from "react";
import { hoje as hojeLocal, somaDias } from "@/lib/domain/datas";
import { ordenarPorUrgencia, type ItemRevisao, type TipoItemRevisao } from "@/lib/domain/revisao";
import { pendentesDeAtivacao } from "@/lib/domain/vocabulario";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type PontoGramaticalResumo = {
  id: string;
  idiomaId: string;
  titulo: string;
  estado: "ok" | "errei" | "em_correcao";
  estudadoEm: string;
};

export type EstadoRevisao = {
  hoje: string;
  idiomas: IdiomaResumo[];
  itens: ItemRevisao[];
  pontos: PontoGramaticalResumo[];
  resolvidosNaSemana: number;
};

const TIPO_DA_TAREFA: Record<string, TipoItemRevisao | undefined> = {
  frases_apos_erro: "frases_apos_erro",
  ativar_palavras: "ativar_palavras",
  audio_grupo: "audio_grupo",
  autoavaliacao: "autoavaliacao",
  gravar_video: "gravar_video",
};

const ACAO_DO_TIPO: Record<TipoItemRevisao, ItemRevisao["acao"]> = {
  frases_apos_erro: "frases",
  ativar_palavras: "ativar",
  audio_grupo: "audio",
  autoavaliacao: "autoavaliar",
  gravar_video: "marcar_gravado",
  ponto_gramatical: "frases",
};

/**
 * RN-1103. Tudo que está em dívida, ordenado por urgência.
 * A fila de cartões devidos NÃO entra aqui — ela mora no Flashcards Deluxe.
 */
export const carregarRevisao = cache(async function carregarRevisao(): Promise<EstadoRevisao> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();

  const [{ data: idiomasRaw }, { data: tarefasRaw }, { data: pontosRaw }, { data: vocabRaw }, { data: concluidasRaw }] =
    await Promise.all([
      supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
      supabase
        .from("tarefas")
        .select("id, tipo, titulo, idioma_id, data_prevista, quantidade_exigida, quantidade_feita")
        .eq("estado", "aberta"),
      supabase
        .from("pontos_gramaticais")
        .select("id, idioma_id, titulo, estado, estudado_em, marcado_errei_em")
        .order("estudado_em", { ascending: false }),
      supabase
        .from("registros_vocabulario")
        .select("idioma_id, palavras_novas, palavras_ativadas, data")
        .gte("data", somaDias(hoje, -30)),
      supabase
        .from("tarefas")
        .select("id")
        .eq("estado", "concluida")
        .gte("concluida_em", somaDias(hoje, -7)),
    ]);

  const itens: ItemRevisao[] = [];

  for (const t of tarefasRaw ?? []) {
    const tipo = TIPO_DA_TAREFA[t.tipo];
    if (!tipo) continue;
    itens.push({
      id: t.id,
      tipo,
      titulo: t.titulo,
      idiomaId: t.idioma_id,
      data: t.data_prevista,
      quantidadeExigida: t.quantidade_exigida,
      quantidadeFeita: t.quantidade_feita,
      acao: ACAO_DO_TIPO[tipo],
    });
  }

  // Pontos marcados como errados que ainda não geraram tarefa aparecem sozinhos.
  const comTarefa = new Set(
    (tarefasRaw ?? []).filter((t) => t.tipo === "frases_apos_erro").map((t) => t.titulo),
  );
  for (const p of pontosRaw ?? []) {
    if (p.estado !== "errei") continue;
    if ([...comTarefa].some((titulo) => titulo.includes(p.titulo))) continue;
    itens.push({
      id: p.id,
      tipo: "ponto_gramatical",
      titulo: p.titulo,
      idiomaId: p.idioma_id,
      data: p.marcado_errei_em ?? p.estudado_em,
      quantidadeExigida: 2,
      quantidadeFeita: 0,
      acao: "frases",
    });
  }

  // Palavras pendentes de ativação que ainda não viraram tarefa.
  const jaTemTarefaDeAtivacao = new Set(
    (tarefasRaw ?? []).filter((t) => t.tipo === "ativar_palavras").map((t) => t.idioma_id),
  );
  for (const idioma of idiomasRaw ?? []) {
    if (jaTemTarefaDeAtivacao.has(idioma.id)) continue;
    const pendentes = pendentesDeAtivacao(
      (vocabRaw ?? [])
        .filter((v) => v.idioma_id === idioma.id)
        .map((v) => ({ palavrasNovas: v.palavras_novas, palavrasAtivadas: v.palavras_ativadas })),
    );
    if (pendentes <= 0) continue;
    const primeira = (vocabRaw ?? [])
      .filter((v) => v.idioma_id === idioma.id && v.palavras_novas > v.palavras_ativadas)
      .sort((a, b) => a.data.localeCompare(b.data))[0];
    itens.push({
      id: `vocab-${idioma.id}`,
      tipo: "ativar_palavras",
      titulo: `Ativar ${pendentes} ${pendentes === 1 ? "palavra" : "palavras"} de ${idioma.nome}`,
      idiomaId: idioma.id,
      data: primeira?.data ?? hoje,
      quantidadeExigida: pendentes,
      quantidadeFeita: 0,
      acao: "ativar",
    });
  }

  return {
    hoje,
    idiomas: idiomasRaw ?? [],
    itens: ordenarPorUrgencia(itens, hoje),
    pontos: (pontosRaw ?? []).map((p) => ({
      id: p.id,
      idiomaId: p.idioma_id,
      titulo: p.titulo,
      estado: p.estado,
      estudadoEm: p.estudado_em,
    })),
    resolvidosNaSemana: (concluidasRaw ?? []).length,
  };
});
