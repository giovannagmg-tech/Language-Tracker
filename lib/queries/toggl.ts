import "server-only";
import { cache } from "react";
import type { RegraMapeamento } from "@/lib/domain/toggl";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

export type LoteNaTela = {
  id: string;
  arquivo: string;
  importadoEm: string;
  intervalo: { inicio: string | null; fim: string | null };
  importadas: number;
  ignoradas: number;
  conflitos: number;
  desfeito: boolean;
  podeDesfazer: boolean;
};

export type EstadoImportacao = {
  idiomas: IdiomaResumo[];
  regras: RegraMapeamento[];
  lotes: LoteNaTela[];
};

export const carregarImportacao = cache(async function carregarImportacao(): Promise<EstadoImportacao> {
  const supabase = await supabaseServidor();

  const [{ data: idiomasRaw }, { data: regrasRaw }, { data: lotesRaw }] = await Promise.all([
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    supabase
      .from("regras_mapeamento_toggl")
      .select("id, ordem, campo, operador, valor, saida_idioma, saida_atividade, saida_pilar, saida_tempo, ativa")
      .order("ordem"),
    supabase
      .from("lotes_importacao")
      .select("id, arquivo_nome, importado_em, intervalo_inicio, intervalo_fim, importadas, ignoradas, conflitos, desfeito_em")
      .order("importado_em", { ascending: false })
      .limit(20),
  ]);

  const lotes = lotesRaw ?? [];

  return {
    idiomas: idiomasRaw ?? [],
    regras: (regrasRaw ?? []).map((r) => ({
      id: r.id,
      ordem: r.ordem,
      campo: r.campo,
      operador: r.operador,
      valor: r.valor,
      saidaIdioma: r.saida_idioma,
      saidaAtividade: r.saida_atividade,
      saidaPilar: r.saida_pilar,
      saidaTempo: r.saida_tempo,
      ativa: r.ativa,
    })),
    lotes: lotes.map((l, indice) => ({
      id: l.id,
      arquivo: l.arquivo_nome,
      importadoEm: l.importado_em,
      intervalo: { inicio: l.intervalo_inicio, fim: l.intervalo_fim },
      importadas: l.importadas,
      ignoradas: l.ignoradas,
      conflitos: l.conflitos,
      desfeito: l.desfeito_em !== null,
      // Só o lote mais recente ainda pode ser desfeito com segurança: um lote
      // posterior pode ter coberto o mesmo intervalo.
      podeDesfazer: indice === 0 && l.desfeito_em === null,
    })),
  };
});
