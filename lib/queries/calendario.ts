import "server-only";
import { cache } from "react";
import {
  escalaVolume,
  resumirMes,
  semanasDoMes,
  totaisDoMes,
  type ResumoDia,
  type TotaisDoMes,
} from "@/lib/domain/calendario";
import { hoje as hojeLocal, mesDe, type DataISO } from "@/lib/domain/datas";
import { supabaseServidor } from "@/lib/supabase/server";

export type IdiomaDoCalendario = {
  id: string;
  nome: string;
  bandeira: string;
  cor: string;
};

export type EstadoCalendario = {
  hoje: DataISO;
  mes: DataISO;
  semanas: ResumoDia[][];
  escala: number;
  totais: TotaisDoMes;
  /** Só idiomas ativos, e só os que têm algo no mês (RN-1213). */
  idiomas: IdiomaDoCalendario[];
  idiomaFiltrado: string | null;
};

export const carregarCalendario = cache(async function carregarCalendario(
  mesPedido: DataISO,
  idiomaFiltrado: string | null,
): Promise<EstadoCalendario> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const mes = mesDe(mesPedido).inicio;

  // A grade extrapola o mês nas pontas; buscar só o mês deixaria os dias
  // vizinhos sempre vazios, mentindo sobre eles.
  const semanas = semanasDoMes(mes);
  const primeiro = semanas[0][0];
  const ultimo = semanas[semanas.length - 1][6];

  let consultaSessoes = supabase
    .from("sessoes")
    .select("data, idioma_id, duracao_min")
    .gte("data", primeiro)
    .lte("data", ultimo);

  let consultaTarefas = supabase
    .from("tarefas")
    .select("data_prevista, idioma_id, estado")
    .gte("data_prevista", primeiro)
    .lte("data_prevista", ultimo)
    .neq("estado", "dispensada");

  if (idiomaFiltrado) {
    consultaSessoes = consultaSessoes.eq("idioma_id", idiomaFiltrado);
    consultaTarefas = consultaTarefas.eq("idioma_id", idiomaFiltrado);
  }

  const [{ data: sessoesRaw }, { data: tarefasRaw }, { data: idiomasRaw }] =
    await Promise.all([
      consultaSessoes,
      consultaTarefas,
      supabase
        .from("idiomas")
        .select("id, nome, bandeira, cor")
        .eq("ativo", true)
        .order("ordem"),
    ]);

  const sessoes = (sessoesRaw ?? []).map((s) => ({
    data: s.data,
    idiomaId: s.idioma_id,
    duracaoMin: s.duracao_min,
  }));

  const tarefas = (tarefasRaw ?? []).map((t) => ({
    data: t.data_prevista,
    idiomaId: t.idioma_id,
    concluida: t.estado === "concluida",
  }));

  const resumo = resumirMes({ mes, hoje, sessoes, tarefas });

  // RN-1213: idioma ativo sem nada no mês não ganha pastilha. Com o filtro
  // ligado, a lista precisa continuar completa — senão a pastilha selecionada
  // sumiria e não haveria como voltar.
  const comAlgoNoMes = new Set<string>();
  for (const s of sessoes) comAlgoNoMes.add(s.idiomaId);
  for (const t of tarefas) if (t.idiomaId) comAlgoNoMes.add(t.idiomaId);

  const idiomas = (idiomasRaw ?? []).filter(
    (i) => idiomaFiltrado !== null || comAlgoNoMes.has(i.id),
  );

  return {
    hoje,
    mes,
    semanas: resumo,
    escala: escalaVolume(resumo),
    totais: totaisDoMes(resumo),
    idiomas,
    idiomaFiltrado,
  };
});
