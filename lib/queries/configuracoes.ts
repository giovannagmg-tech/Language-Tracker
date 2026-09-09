import "server-only";
import { cache } from "react";
import type { Nivel } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

export type IdiomaConfig = {
  id: string;
  nome: string;
  bandeira: string;
  nivelInicial: Nivel;
  nivelAtual: Nivel;
  nivelMeta: Nivel;
  dataMetaNivel: string | null;
  palavrasBase: number;
  metaPalavrasDia: number;
  ativo: boolean;
};

export type EstadoConfiguracoes = {
  tema: "claro" | "escuro" | "sistema";
  idiomas: IdiomaConfig[];
  camadas: { numero: number; nome: string; limiar: number }[];
  alertas: {
    horaAperto: number;
    diasParaRetomada: number;
    metaPctAtivo: number;
    metaMinFalaSemana: number;
    metaDiasFlashSemana: number;
    lacunaAlerta: number;
    limiarDesvioPilar: number;
    limiarConcentracao: number;
    loteMinimoChecagem: number;
  };
};

export const carregarConfiguracoes = cache(async function carregarConfiguracoes(): Promise<EstadoConfiguracoes> {
  const supabase = await supabaseServidor();

  const [{ data: config }, { data: idiomasRaw }, { data: camadasRaw }] = await Promise.all([
    supabase.from("config").select("*").maybeSingle(),
    supabase
      .from("idiomas")
      .select("id, nome, bandeira, nivel_inicial, nivel_atual, nivel_meta, data_meta_nivel, palavras_base, meta_palavras_dia, ativo")
      .order("ordem"),
    supabase.from("camadas").select("numero, nome, limiar").order("numero"),
  ]);

  return {
    tema: config?.tema ?? "sistema",
    idiomas: (idiomasRaw ?? []).map((i) => ({
      id: i.id,
      nome: i.nome,
      bandeira: i.bandeira,
      nivelInicial: i.nivel_inicial,
      nivelAtual: i.nivel_atual,
      nivelMeta: i.nivel_meta,
      dataMetaNivel: i.data_meta_nivel,
      palavrasBase: i.palavras_base,
      metaPalavrasDia: i.meta_palavras_dia,
      ativo: i.ativo,
    })),
    camadas: camadasRaw ?? [],
    alertas: {
      horaAperto: config?.hora_aperto ?? 20,
      diasParaRetomada: config?.dias_para_retomada ?? 7,
      metaPctAtivo: Number(config?.meta_pct_ativo ?? 0.35),
      metaMinFalaSemana: config?.meta_min_fala_semana ?? 60,
      metaDiasFlashSemana: config?.meta_dias_flash_semana ?? 5,
      lacunaAlerta: config?.lacuna_alerta ?? 3,
      limiarDesvioPilar: Number(config?.limiar_desvio_pilar ?? 0.15),
      limiarConcentracao: Number(config?.limiar_concentracao ?? 0.4),
      loteMinimoChecagem: config?.lote_minimo_checagem ?? 10,
    },
  };
});
