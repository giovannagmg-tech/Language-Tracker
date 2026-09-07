"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { registrarAutoavaliacao } from "@/lib/actions/metas";
import { degrausAte } from "@/lib/domain/niveis";
import { NIVEIS, type Nivel } from "@/lib/domain/tipos";

type Props = {
  idiomaId: string;
  nomeIdioma: string;
  blocoId: string | null;
  nomeBloco: string | null;
  nivelAtual: Nivel;
  nivelInicial: Nivel;
  nivelMeta: Nivel;
  pendente: boolean;
};

/**
 * RN-504. Fecha o bloco: o nível declarado vira o nível atual do idioma e a
 * tarefa automática correspondente é concluída.
 */
export function Autoavaliacao({
  idiomaId,
  nomeIdioma,
  blocoId,
  nomeBloco,
  nivelAtual,
  nivelInicial,
  nivelMeta,
  pendente,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [nivel, setNivel] = useState<Nivel>(nivelAtual);
  const [observacao, setObservacao] = useState("");
  const [salvando, iniciar] = useTransition();

  // Oferece a faixa entre o inicial e a meta, mais um degrau de folga de cada lado.
  const faixa = degrausAte(nivelInicial, nivelMeta);
  const iMin = Math.max(0, NIVEIS.indexOf(faixa[0]) - 1);
  const iMax = Math.min(NIVEIS.length - 1, NIVEIS.indexOf(faixa[faixa.length - 1]) + 1);
  const opcoes = NIVEIS.slice(iMin, iMax + 1);

  function salvar() {
    if (!blocoId) {
      toast.error("Sem bloco do plano vigente para amarrar a autoavaliação.");
      return;
    }
    iniciar(async () => {
      const r = await registrarAutoavaliacao({
        idiomaId,
        blocoId,
        nivel,
        observacao: observacao || null,
      });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      setAberto(false);
      toast.success(
        nivel === nivelAtual
          ? `${nomeIdioma} segue em ${nivel}.`
          : `${nomeIdioma}: ${nivelAtual} → ${nivel}.`,
      );
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`text-pequeno underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
          pendente ? "font-semibold text-atencao" : "text-texto-3 hover:text-texto-2"
        }`}
      >
        {pendente ? "Autoavaliar — pendente" : "Autoavaliar"}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[10px] border border-borda bg-superficie-2 p-4">
      <p className="mb-3 text-pequeno text-texto-2">
        Onde está o seu {nomeIdioma} hoje?
        {nomeBloco ? ` Fechando o bloco ${nomeBloco}.` : ""}
      </p>

      <GrupoDeChips
        legenda="Nível"
        valor={nivel}
        onChange={(v) => setNivel(v)}
        opcoes={opcoes.map((n) => ({ valor: n, rotulo: n }))}
      />

      <div className="mt-4">
        <label
          htmlFor={`obs-${idiomaId}`}
          className="mb-2 block text-rotulo uppercase text-texto-3"
        >
          Observação
        </label>
        <textarea
          id={`obs-${idiomaId}`}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-[10px] border border-borda-forte bg-superficie px-3 py-2 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={salvando} className="h-9">
          {salvando ? "Salvando…" : "Registrar"}
        </Button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-pequeno text-texto-2 underline underline-offset-2"
        >
          cancelar
        </button>
      </div>
    </div>
  );
}
