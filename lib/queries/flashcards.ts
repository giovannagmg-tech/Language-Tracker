import "server-only";
import { cache } from "react";
import {
  acumuladoDe,
  progressoCamada,
  type Camada,
  type FaixaFrequencia,
  type ProgressoCamada,
} from "@/lib/domain/camadas";
import { hoje as hojeLocal, intervalo, mesDe, somaDias, type DataISO } from "@/lib/domain/datas";
import { sequencia } from "@/lib/domain/sequencias";
import { medianaVelocidade, pendentesDeAtivacao } from "@/lib/domain/vocabulario";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type PontoAcerto = { data: DataISO; pct: number };

export type FlashcardsDeIdioma = {
  idioma: IdiomaResumo & { slug: string };
  revisouHoje: boolean;
  streak: number;
  palavrasHoje: number;
  metaDia: number;
  camada: ProgressoCamada;
  pendentesAtivacao: number;
  ultimaVelocidade: { minPorPalavra: number; faixa: string } | null;
  medianaVelocidade: number | null;
  acertos: PontoAcerto[];
};

export type EstadoFlashcards = {
  hoje: DataISO;
  mes: { inicio: DataISO; fim: DataISO; rotulo: string };
  diasDoMes: DataISO[];
  diasComFlashcards: Set<DataISO>;
  idiomas: FlashcardsDeIdioma[];
  streakGeral: number;
  recordeFlashcards: number;
  loteMinimoChecagem: number;
};

export const carregarFlashcards = cache(async function carregarFlashcards(): Promise<EstadoFlashcards> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const mes = mesDe(hoje);
  const desde = somaDias(hoje, -400);

  const [
    { data: config },
    { data: idiomasRaw },
    { data: camadasRaw },
    { data: revisoesRaw },
    { data: vocabRaw },
    { data: sessoesRaw },
  ] = await Promise.all([
    supabase.from("config").select("faixas_frequencia, lote_minimo_checagem").maybeSingle(),
    supabase
      .from("idiomas")
      .select("id, slug, nome, bandeira, cor, palavras_base, meta_palavras_dia")
      .eq("ativo", true)
      .order("ordem"),
    supabase.from("camadas").select("numero, nome, limiar").order("limiar"),
    supabase
      .from("revisoes_flashcards")
      .select("data, idioma_id, revisou, pct_acerto_deck")
      .gte("data", desde),
    supabase
      .from("registros_vocabulario")
      .select("data, idioma_id, palavras_novas, palavras_ativadas, min_por_palavra, faixa_velocidade"),
    supabase.from("sessoes").select("data, atividade").eq("atividade", "flashcards").gte("data", desde),
  ]);

  const camadas: Camada[] = (camadasRaw ?? []).map((c) => ({
    numero: c.numero,
    nome: c.nome,
    limiar: c.limiar,
  }));
  const faixas = (config?.faixas_frequencia ?? []) as FaixaFrequencia[];

  const diasComFlashcards = new Set<DataISO>();
  for (const r of revisoesRaw ?? []) if (r.revisou) diasComFlashcards.add(r.data);
  for (const s of sessoesRaw ?? []) diasComFlashcards.add(s.data);

  const idiomas: FlashcardsDeIdioma[] = (idiomasRaw ?? []).map((i) => {
    const revisoes = (revisoesRaw ?? []).filter((r) => r.idioma_id === i.id);
    const registros = (vocabRaw ?? []).filter((v) => v.idioma_id === i.id);

    const datasDoIdioma = new Set(revisoes.filter((r) => r.revisou).map((r) => r.data));
    const velocidades = registros
      .filter((v) => v.min_por_palavra !== null)
      .sort((a, b) => b.data.localeCompare(a.data));

    const recentes = registros.filter((v) => v.data >= somaDias(hoje, -30));

    return {
      idioma: { id: i.id, slug: i.slug, nome: i.nome, bandeira: i.bandeira, cor: i.cor },
      revisouHoje: revisoes.some((r) => r.data === hoje && r.revisou),
      streak: sequencia(datasDoIdioma, hoje),
      palavrasHoje: registros
        .filter((v) => v.data === hoje)
        .reduce((t, v) => t + v.palavras_novas, 0),
      metaDia: i.meta_palavras_dia,
      camada: progressoCamada(
        acumuladoDe(
          i.palavras_base,
          registros.map((v) => ({ data: v.data, idiomaId: i.id, palavrasNovas: v.palavras_novas })),
        ),
        camadas,
        faixas,
      ),
      pendentesAtivacao: pendentesDeAtivacao(
        recentes.map((v) => ({
          palavrasNovas: v.palavras_novas,
          palavrasAtivadas: v.palavras_ativadas,
        })),
      ),
      ultimaVelocidade:
        velocidades.length > 0 && velocidades[0].min_por_palavra !== null
          ? {
              minPorPalavra: Number(velocidades[0].min_por_palavra),
              faixa: velocidades[0].faixa_velocidade ?? "",
            }
          : null,
      medianaVelocidade: medianaVelocidade(
        velocidades.slice(0, 10).map((v) => Number(v.min_por_palavra)),
      ),
      acertos: revisoes
        .filter((r) => r.pct_acerto_deck !== null)
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(-12)
        .map((r) => ({ data: r.data, pct: r.pct_acerto_deck as number })),
    };
  });

  const recorde = (() => {
    const ordenadas = [...diasComFlashcards].sort();
    let melhor = 0;
    let corrente = 0;
    let anterior: DataISO | null = null;
    for (const d of ordenadas) {
      corrente = anterior !== null && somaDias(anterior, 1) === d ? corrente + 1 : 1;
      melhor = Math.max(melhor, corrente);
      anterior = d;
    }
    return melhor;
  })();

  return {
    hoje,
    mes: {
      ...mes,
      rotulo: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })
        .format(new Date(`${mes.inicio}T12:00:00Z`)),
    },
    diasDoMes: intervalo(mes.inicio, mes.fim),
    diasComFlashcards,
    idiomas,
    streakGeral: sequencia(diasComFlashcards, hoje),
    recordeFlashcards: recorde,
    loteMinimoChecagem: config?.lote_minimo_checagem ?? 10,
  };
});
