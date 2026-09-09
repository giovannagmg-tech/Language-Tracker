"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { desfazerLote } from "@/lib/actions/toggl";
import { fmtDataCurta } from "@/lib/formatadores";
import type { LoteNaTela } from "@/lib/queries/toggl";

export function HistoricoDeLotes({ lotes }: { lotes: LoteNaTela[] }) {
  const [, iniciar] = useTransition();

  function desfazer(lote: LoteNaTela) {
    iniciar(async () => {
      const r = await desfazerLote(lote.id);
      toast[r.ok ? "success" : "error"](
        r.ok ? "Lote desfeito e indicadores recalculados." : (r.erro ?? "Falhou."),
      );
    });
  }

  if (lotes.length === 0) {
    return (
      <p className="text-corpo text-texto-2">
        Nenhuma importação ainda.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-borda">
      {lotes.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
          <span className="min-w-0 flex-1 truncate text-corpo text-texto">{l.arquivo}</span>
          <span className="shrink-0 text-pequeno tabular text-texto-2">
            {l.intervalo.inicio ? fmtDataCurta(l.intervalo.inicio) : "—"}
            {l.intervalo.fim ? ` – ${fmtDataCurta(l.intervalo.fim)}` : ""}
          </span>
          <span className="shrink-0 text-pequeno tabular text-texto-2">
            {l.importadas} importadas · {l.ignoradas} ignoradas
          </span>
          {l.desfeito ? (
            <span className="shrink-0 text-pequeno text-texto-3">desfeito</span>
          ) : l.podeDesfazer ? (
            <button
              type="button"
              onClick={() => desfazer(l)}
              className="shrink-0 text-pequeno text-texto-3 underline underline-offset-2 hover:text-perigo"
            >
              desfazer
            </button>
          ) : (
            <span
              className="shrink-0 text-pequeno text-texto-3"
              title="Um lote posterior pode ter coberto o mesmo intervalo"
            >
              —
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
