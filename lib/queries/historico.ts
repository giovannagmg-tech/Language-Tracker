import "server-only";
import { cache } from "react";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import type {
  Atividade,
  Categoria,
  OrigemSessao,
  Pilar,
  TempoDoDia,
} from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

export const POR_PAGINA = 100;

export type FiltroHistorico = {
  idiomaId?: string;
  categoria?: Categoria;
  origem?: OrigemSessao;
  de?: string;
  ate?: string;
  pagina: number;
};

export type LinhaHistorico = {
  id: string;
  data: string;
  horaInicio: string | null;
  duracaoMin: number;
  idiomaId: string;
  categoria: Categoria;
  pilar: Pilar | null;
  atividade: Atividade;
  tempo: TempoDoDia;
  minutosFala: number;
  palavrasNovas: number;
  producao: boolean;
  origem: OrigemSessao;
  nota: string | null;
  loteImportacao: string | null;
};

export type IdiomaHistorico = {
  id: string;
  nome: string;
  bandeira: string;
  cor: string;
  ativo: boolean;
};

export type EstadoHistorico = {
  hoje: string;
  /** Todos os idiomas, inclusive os inativos — o histórico deles existe. */
  idiomas: IdiomaHistorico[];
  linhas: LinhaHistorico[];
  total: number;
  minutosNoFiltro: number;
  pagina: number;
  paginas: number;
  filtro: FiltroHistorico;
};

export const carregarHistorico = cache(async function carregarHistorico(
  filtro: FiltroHistorico,
): Promise<EstadoHistorico> {
  const supabase = await supabaseServidor();
  const pagina = Math.max(1, filtro.pagina);

  // Um idioma inativo não some do histórico: `ativo` governa o dia de hoje,
  // não o passado. Por isso aqui não há `.eq("ativo", true)`.
  const { data: idiomasRaw } = await supabase
    .from("idiomas")
    .select("id, nome, bandeira, cor, ativo")
    .order("ordem");

  function comFiltros<T extends { eq: unknown }>(consulta: T): T {
    let q = consulta as unknown as {
      eq: (c: string, v: string) => typeof q;
      gte: (c: string, v: string) => typeof q;
      lte: (c: string, v: string) => typeof q;
    };
    if (filtro.idiomaId) q = q.eq("idioma_id", filtro.idiomaId);
    if (filtro.categoria) q = q.eq("categoria", filtro.categoria);
    if (filtro.origem) q = q.eq("origem", filtro.origem);
    if (filtro.de) q = q.gte("data", filtro.de);
    if (filtro.ate) q = q.lte("data", filtro.ate);
    return q as unknown as T;
  }

  const inicio = (pagina - 1) * POR_PAGINA;

  const [{ data: linhasRaw, count }, { data: somaRaw }] = await Promise.all([
    comFiltros(
      supabase
        .from("sessoes")
        .select(
          "id, data, hora_inicio, duracao_min, idioma_id, categoria, pilar, atividade, tempo, minutos_fala, palavras_novas, producao, origem, nota, lote_importacao",
          { count: "exact" },
        ),
    )
      .order("data", { ascending: false })
      .order("hora_inicio", { ascending: false, nullsFirst: false })
      .range(inicio, inicio + POR_PAGINA - 1),
    // O total de minutos é do filtro inteiro, não só da página visível —
    // somar a página daria um número menor e mentiroso.
    comFiltros(supabase.from("sessoes").select("duracao_min")),
  ]);

  const total = count ?? 0;

  return {
    hoje: hojeLocal(),
    idiomas: (idiomasRaw ?? []).map((i) => ({
      id: i.id,
      nome: i.nome,
      bandeira: i.bandeira,
      cor: i.cor,
      ativo: i.ativo,
    })),
    linhas: (linhasRaw ?? []).map((s) => ({
      id: s.id,
      data: s.data,
      horaInicio: s.hora_inicio,
      duracaoMin: s.duracao_min,
      idiomaId: s.idioma_id,
      categoria: s.categoria as Categoria,
      pilar: s.pilar as Pilar | null,
      atividade: s.atividade as Atividade,
      tempo: s.tempo as TempoDoDia,
      minutosFala: s.minutos_fala,
      palavrasNovas: s.palavras_novas,
      producao: s.producao,
      origem: s.origem as OrigemSessao,
      nota: s.nota,
      loteImportacao: s.lote_importacao,
    })),
    total,
    minutosNoFiltro: (somaRaw ?? []).reduce((t, s) => t + s.duracao_min, 0),
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    filtro: { ...filtro, pagina },
  };
});
