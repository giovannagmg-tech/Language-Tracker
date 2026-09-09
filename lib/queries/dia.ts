import "server-only";
import { cache } from "react";
import type { DataISO } from "@/lib/domain/datas";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import {
  avaliarTarefa,
  ordenarTarefas,
  resumirDia,
  type ResumoDoDia,
  type TarefaManualAvaliada,
} from "@/lib/domain/tarefas-manuais";
import type { EstadoTarefa, Pilar } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaDoCalendario } from "./calendario";

export type EstadoDoDia = {
  data: DataISO;
  hoje: DataISO;
  tarefas: TarefaManualAvaliada[];
  /** Abertas de dias anteriores (RN-1211). Só preenchido quando `data` é hoje. */
  atrasadas: TarefaManualAvaliada[];
  resumo: ResumoDoDia;
  minutosDoDia: number;
  idiomas: IdiomaDoCalendario[];
};

const COLUNAS =
  "id, titulo, descricao, idioma_id, data_prevista, pilar, hora_prevista, duracao_prevista_min, estado, automatica, do_dia, adiada_vezes";

type LinhaTarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  idioma_id: string | null;
  data_prevista: string;
  pilar: string | null;
  hora_prevista: string | null;
  duracao_prevista_min: number | null;
  estado: string;
  automatica: boolean;
  do_dia: boolean;
  adiada_vezes: number;
};

function paraDominio(t: LinhaTarefa) {
  return {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    idiomaId: t.idioma_id,
    data: t.data_prevista,
    pilar: t.pilar as Pilar | null,
    // O banco devolve `HH:MM:SS`; a tela e o formulário falam `HH:MM`.
    horaPrevista: t.hora_prevista ? t.hora_prevista.slice(0, 5) : null,
    duracaoPrevistaMin: t.duracao_prevista_min,
    estado: t.estado as EstadoTarefa,
    automatica: t.automatica,
    doDia: t.do_dia,
    adiadaVezes: t.adiada_vezes,
  };
}

export const carregarDia = cache(async function carregarDia(
  data: DataISO,
): Promise<EstadoDoDia> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const ehHoje = data === hoje;

  const [{ data: tarefasRaw }, { data: atrasadasRaw }, { data: sessoesRaw }, { data: idiomasRaw }] =
    await Promise.all([
      supabase.from("tarefas").select(COLUNAS).eq("data_prevista", data),
      // As atrasadas só fazem sentido no painel de hoje: num dia passado elas
      // já estão listadas como as tarefas daquele dia.
      ehHoje
        ? supabase
            .from("tarefas")
            .select(COLUNAS)
            .lt("data_prevista", hoje)
            .eq("estado", "aberta")
            .order("data_prevista", { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as LinhaTarefa[] }),
      supabase.from("sessoes").select("duracao_min").eq("data", data),
      supabase.from("idiomas").select("id, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    ]);

  const tarefas = ordenarTarefas(
    ((tarefasRaw ?? []) as LinhaTarefa[]).map((t) => avaliarTarefa(paraDominio(t), hoje)),
  );

  return {
    data,
    hoje,
    tarefas,
    atrasadas: ((atrasadasRaw ?? []) as LinhaTarefa[]).map((t) =>
      avaliarTarefa(paraDominio(t), hoje),
    ),
    resumo: resumirDia(tarefas),
    minutosDoDia: (sessoesRaw ?? []).reduce((t, s) => t + s.duracao_min, 0),
    idiomas: idiomasRaw ?? [],
  };
});
