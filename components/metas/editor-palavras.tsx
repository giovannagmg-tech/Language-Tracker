"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { editarMetaPalavras } from "@/lib/actions/metas";

/** RN-505. A meta diária de palavras é o degrau; a camada é o destino. */
export function EditorPalavras({
  idiomaId,
  valorInicial,
}: {
  idiomaId: string;
  valorInicial: number;
}) {
  const [valor, setValor] = useState(valorInicial);
  const [editando, setEditando] = useState(false);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await editarMetaPalavras(idiomaId, valor);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      setEditando(false);
      toast.success(`Meta de ${valor} ${valor === 1 ? "palavra" : "palavras"} por dia.`);
    });
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
      >
        editar
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={valor}
        autoFocus
        aria-label="Meta de palavras por dia"
        onChange={(e) => setValor(Math.max(0, Number(e.target.value)))}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
          if (e.key === "Escape") setEditando(false);
        }}
        className="h-8 w-16 rounded-[10px] border border-borda-forte bg-superficie px-2 text-right text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
      />
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        className="text-pequeno font-semibold text-texto underline underline-offset-2"
      >
        {salvando ? "…" : "ok"}
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        className="text-pequeno text-texto-3 underline underline-offset-2"
      >
        cancelar
      </button>
    </span>
  );
}
