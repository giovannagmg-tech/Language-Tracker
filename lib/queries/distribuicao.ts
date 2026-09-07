import "server-only";
import { cache } from "react";
import { hoje as hojeLocal, mesDe, somaDias } from "@/lib/domain/datas";
import {
  compararAlvoRealizado,
  sugerirFocoDoMes,
  type Bloco,
  type Desvio,
  type ItemDistribuicao,
} from "@/lib/domain/distribuicao";
import { distribuicaoPilares, minutosPorIdioma, noPeriodo } from "@/lib/domain/metrics";
import type { SessaoDominio } from "@/lib/domain/modelos";
import { PILARES, type Atividade, type Categoria, type Pilar, type TempoDoDia } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type EstadoDistribuicao = {
  hoje: string;
  idiomas: IdiomaResumo[];
  blocos: Bloco[];
  blocoVigente: Bloco | null;
  alvoPilar: ItemDistribuicao[];
  alvoIdioma: ItemDistribuicao[];
  desviosPilar: Desvio[];
  desviosIdioma: Desvio[];
  foco: { idiomaId: string | null; pilar: Pilar | null; nota: string | null };
  sugestaoFoco: { idiomaId: string | null; pilar: Pilar | null };
  periodoRealizado: { inicio: string; fim: string; rotulo: string };
};

export const carregarDistribuicao = cache(async function carregarDistribuicao(): Promise<EstadoDistribuicao> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const mes = mesDe(hoje);
  const mesAnterior = mesDe(somaDias(mes.inicio, -1));

  const [{ data: idiomasRaw }, { data: blocosRaw }, { data: alvoRaw }, { data: sessoesRaw }] =
    await Promise.all([
      supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
      supabase.from("blocos_plano").select("id, nome, data_inicio, data_fim, idioma_foco, foco_mes_idioma, foco_mes_pilar, foco_mes_nota").order("data_inicio"),
      supabase.from("distribuicao_alvo").select("bloco_id, dimensao, chave, percentual"),
      supabase
        .from("sessoes")
        .select("id, data, idioma_id, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, producao, violou_regra_5")
        .gte("data", mesAnterior.inicio)
        .lte("data", mes.fim),
    ]);

  const idiomas: IdiomaResumo[] = idiomasRaw ?? [];

  const blocos: Bloco[] = (blocosRaw ?? []).map((b) => ({
    id: b.id,
    nome: b.nome,
    dataInicio: b.data_inicio,
    dataFim: b.data_fim,
    idiomaFoco: b.idioma_foco,
  }));
  const vigenteRaw = (blocosRaw ?? []).find((b) => b.data_inicio <= hoje && hoje <= b.data_fim) ?? null;
  const vigente = blocos.find((b) => b.id === vigenteRaw?.id) ?? null;

  const sessoes: SessaoDominio[] = (sessoesRaw ?? []).map((s) => ({
    id: s.id,
    data: s.data,
    idiomaId: s.idioma_id,
    duracaoMin: s.duracao_min,
    categoria: s.categoria as Categoria,
    pilar: s.pilar as Pilar | null,
    atividade: s.atividade as Atividade,
    tempo: s.tempo as TempoDoDia,
    minutosFala: s.minutos_fala,
    producao: s.producao,
    violouRegra5: s.violou_regra_5,
  }));

  const doMes = noPeriodo(sessoes, mes);

  const alvoPilar: ItemDistribuicao[] = PILARES.map((p) => ({
    chave: p,
    percentual:
      (alvoRaw ?? []).find((a) => a.dimensao === "pilar" && a.bloco_id === null && a.chave === p)
        ?.percentual ?? 25,
  }));

  const alvoIdioma: ItemDistribuicao[] = idiomas.map((i) => ({
    chave: i.id,
    percentual:
      (alvoRaw ?? []).find(
        (a) => a.dimensao === "idioma" && a.bloco_id === vigente?.id && a.chave === i.id,
      )?.percentual ?? Math.floor(100 / Math.max(1, idiomas.length)),
  }));

  const alvoObj = Object.fromEntries(alvoPilar.map((a) => [a.chave, a.percentual / 100])) as Record<Pilar, number>;
  const pilaresReais = distribuicaoPilares(doMes, alvoObj);
  const realPilar = Object.fromEntries(pilaresReais.map((p) => [p.pilar, p.real]));
  const realIdioma = Object.fromEntries(minutosPorIdioma(doMes).map((i) => [i.idiomaId, i.pct]));

  const pilaresMesAnterior = distribuicaoPilares(noPeriodo(sessoes, mesAnterior), alvoObj);

  return {
    hoje,
    idiomas,
    blocos,
    blocoVigente: vigente,
    alvoPilar,
    alvoIdioma,
    desviosPilar: compararAlvoRealizado(alvoPilar, realPilar),
    desviosIdioma: compararAlvoRealizado(alvoIdioma, realIdioma),
    foco: {
      idiomaId: vigenteRaw?.foco_mes_idioma ?? null,
      pilar: (vigenteRaw?.foco_mes_pilar as Pilar | null) ?? null,
      nota: vigenteRaw?.foco_mes_nota ?? null,
    },
    sugestaoFoco: sugerirFocoDoMes(vigente?.idiomaFoco ?? null, pilaresMesAnterior),
    periodoRealizado: {
      inicio: mes.inicio,
      fim: mes.fim,
      rotulo: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${mes.inicio}T12:00:00Z`)),
    },
  };
});
