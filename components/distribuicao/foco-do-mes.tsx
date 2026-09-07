"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { salvarFocoDoMes } from "@/lib/actions/distribuicao";
import { ROTULO_PILAR, type Pilar } from "@/lib/domain/tipos";
import type { IdiomaResumo } from "@/lib/queries/hoje";

type Props = {
  blocoId: string | null;
  idiomas: IdiomaResumo[];
  focoIdioma: string | null;
  focoPilar: Pilar | null;
  nota: string | null;
  sugestao: { idiomaId: string | null; pilar: Pilar | null };
};

/** RN-903. É este cartão que a tela Metas exibe como "Foco em Distribuição". */
export function FocoDoMes({ blocoId, idiomas, focoIdioma, focoPilar, nota, sugestao }: Props) {
  const [idiomaId, setIdiomaId] = useState(focoIdioma);
  const [pilar, setPilar] = useState(focoPilar);
  const [texto, setTexto] = useState(nota ?? "");
  const [salvando, iniciar] = useTransition();

  const temSugestao = sugestao.pilar !== null || sugestao.idiomaId !== null;

  function salvar() {
    if (!blocoId) {
      toast.error("Crie um bloco do plano antes de definir o foco.");
      return;
    }
    iniciar(async () => {
      const r = await salvarFocoDoMes({ blocoId, idiomaId, pilar, nota: texto || null });
      toast[r.ok ? "success" : "error"](r.ok ? "Foco do mês salvo." : (r.erro ?? "Falhou."));
    });
  }

  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <h2 className="text-h2 text-texto">Foco do mês</h2>
      <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
        O que a tela Metas mostra como foco em Distribuição
      </p>

      <div className="space-y-5">
        <GrupoDeChips
          legenda="Idioma"
          valor={idiomaId}
          onChange={(v) => setIdiomaId(v)}
          opcoes={idiomas.map((i) => ({ valor: i.id, rotulo: i.nome, prefixo: i.bandeira }))}
        />
        <GrupoDeChips
          legenda="Pilar"
          valor={pilar}
          onChange={(v) => setPilar(v)}
          opcoes={(["vocabulario", "gramatica", "pronuncia", "fala"] as const).map((p) => ({
            valor: p,
            rotulo: ROTULO_PILAR[p],
          }))}
        />
        <div>
          <label htmlFor="foco-nota" className="mb-2 block text-rotulo uppercase text-texto-3">
            Nota
          </label>
          <input
            id="foco-nota"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={200}
            placeholder="uma frase sobre o mês"
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-borda pt-4">
        <Button type="button" onClick={salvar} disabled={salvando} className="h-9">
          {salvando ? "Salvando…" : "Salvar foco"}
        </Button>
        {temSugestao ? (
          <button
            type="button"
            onClick={() => {
              setIdiomaId(sugestao.idiomaId);
              setPilar(sugestao.pilar);
            }}
            className="text-pequeno text-texto-2 underline underline-offset-2"
          >
            Usar sugestão
            {sugestao.pilar ? ` (${ROTULO_PILAR[sugestao.pilar]})` : ""}
          </button>
        ) : null}
      </div>
    </section>
  );
}
