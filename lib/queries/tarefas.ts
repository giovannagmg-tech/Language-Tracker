import "server-only";
import { cache } from "react";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { ordenarTarefas, type TarefaLista } from "@/lib/domain/tarefas";
import type { TipoTarefa } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type EstadoTarefas = {
  hoje: string;
  idiomas: IdiomaResumo[];
  automaticas: TarefaLista[];
  manuais: TarefaLista[];
  abertasHoje: number;
};

export const carregarTarefas = cache(async function carregarTarefas(): Promise<EstadoTarefas> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();

  const [{ data: idiomasRaw }, { data: tarefasRaw }] = await Promise.all([
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    supabase
      .from("tarefas")
      .select("id, tipo, automatica, titulo, idioma_id, data_prevista, quantidade_exigida, quantidade_feita, estado, adiada_vezes")
      .order("data_prevista"),
  ]);

  const todas: TarefaLista[] = (tarefasRaw ?? []).map((t) => ({
    id: t.id,
    tipo: t.tipo as TipoTarefa,
    automatica: t.automatica,
    titulo: t.titulo,
    idiomaId: t.idioma_id,
    dataPrevista: t.data_prevista,
    quantidadeExigida: t.quantidade_exigida,
    quantidadeFeita: t.quantidade_feita,
    estado: t.estado,
    adiadaVezes: t.adiada_vezes,
  }));

  return {
    hoje,
    idiomas: idiomasRaw ?? [],
    automaticas: ordenarTarefas(todas.filter((t) => t.automatica), hoje),
    manuais: ordenarTarefas(todas.filter((t) => !t.automatica), hoje),
    abertasHoje: todas.filter((t) => t.estado === "aberta" && t.dataPrevista <= hoje).length,
  };
});
