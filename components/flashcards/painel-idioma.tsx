"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AnelProgresso } from "@/components/graficos/primitivos";
import {
  alternarRevisao,
  registrarAcerto,
  registrarPalavrasNovas,
} from "@/lib/actions/flashcards";
import { bordaDoIdioma } from "@/components/ui/idioma";
import type { FlashcardsDeIdioma } from "@/lib/queries/flashcards";
import { cn } from "@/lib/utils";

/**
 * Painel de leitura sobre um deck que mora no Flashcards Deluxe.
 * Sem CRUD de cartão, sem revisão embutida, sem fila de devidos (RN-003).
 */
export function PainelIdioma({ dados, hoje }: { dados: FlashcardsDeIdioma; hoje: string }) {
  const [, iniciar] = useTransition();
  const [revisou, marcar] = useOptimistic(dados.revisouHoje, (a: boolean) => !a);
  const [palavras, somar] = useOptimistic(dados.palavrasHoje, (a: number, n: number) => Math.max(0, a + n));
  const [acerto, setAcerto] = useState<string>("");

  function alternar() {
    iniciar(async () => {
      marcar(true);
      const r = await alternarRevisao(dados.idioma.id, hoje);
      if (!r.ok) toast.error(r.erro ?? "Não deu para marcar.");
    });
  }

  function ajustar(quantidade: number) {
    iniciar(async () => {
      somar(quantidade);
      const r = await registrarPalavrasNovas({
        idiomaId: dados.idioma.id,
        data: hoje,
        quantidade,
      });
      if (!r.ok) toast.error(r.erro ?? "Não deu para salvar.");
    });
  }

  function salvarAcerto() {
    const valor = Number(acerto);
    if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
      toast.error("Informe um valor entre 0 e 100.");
      return;
    }
    iniciar(async () => {
      const r = await registrarAcerto({ idiomaId: dados.idioma.id, data: hoje, pctDeck: valor });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      const anterior = dados.acertos.at(-1);
      setAcerto("");
      toast.success(
        anterior
          ? `${valor}% — ${valor - anterior.pct >= 0 ? "+" : ""}${valor - anterior.pct} pontos desde ${anterior.data.slice(8)}/${anterior.data.slice(5, 7)}.`
          : `Primeiro registro de acerto para ${dados.idioma.nome}.`,
      );
    });
  }

  return (
    <section
      className="rounded-card border border-borda bg-superficie p-6 shadow-card"
      style={bordaDoIdioma(dados.idioma)}
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-h2 text-texto">
          <span className="mr-2">{dados.idioma.bandeira}</span>
          {dados.idioma.nome}
        </h2>
        <span className="text-pequeno tabular text-texto-2">
          {dados.streak} {dados.streak === 1 ? "dia" : "dias"} seguidos
        </span>
      </div>

      <button
        type="button"
        aria-pressed={revisou}
        onClick={alternar}
        className={cn(
          "mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border text-corpo font-medium outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2",
          revisou
            ? "border-sucesso bg-sucesso-bg text-sucesso"
            : "border-borda-forte text-texto-2 hover:border-texto-3",
        )}
      >
        {revisou ? <Check className="size-4" strokeWidth={3} /> : null}
        {revisou ? "Revisei hoje" : "Revisei"}
      </button>

      <AnelProgresso
        progresso={dados.camada.progresso}
        cor="var(--meta-longo)"
        diametro={116}
        espessura={9}
        absoluto={`${dados.camada.acumulado} / ${dados.camada.proxima?.limiar ?? dados.camada.acumulado}`}
        contexto={
          dados.camada.proxima
            ? `${dados.camada.camada?.nome ?? "antes da camada 1"} · faltam ${dados.camada.faltam}`
            : `${dados.camada.camada?.nome ?? ""} — última camada`
        }
      />

      <div className="mt-5 border-t border-borda pt-4">
        <p className="mb-2 text-rotulo uppercase text-texto-3">Palavras novas hoje</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Menos uma palavra"
            onClick={() => ajustar(-1)}
            className="size-9 rounded-[10px] border border-borda-forte text-texto-2"
          >
            −
          </button>
          <span className="w-14 text-center text-numero-sm tabular text-texto">{palavras}</span>
          <button
            type="button"
            aria-label="Mais uma palavra"
            onClick={() => ajustar(1)}
            className="size-9 rounded-[10px] border border-borda-forte text-texto-2"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => ajustar(5)}
            className="h-9 rounded-full border border-borda-forte px-3 text-pequeno text-texto-2"
          >
            +5
          </button>
          <span className="ml-auto text-pequeno text-texto-3">meta {dados.metaDia}</span>
        </div>
      </div>

      {dados.pendentesAtivacao > 0 ? (
        <p className="mt-3 rounded-[10px] bg-atencao-bg px-3 py-2 text-pequeno text-texto">
          {dados.pendentesAtivacao}{" "}
          {dados.pendentesAtivacao === 1 ? "palavra ainda não saiu" : "palavras ainda não saíram"} da
          fila &ldquo;nova&rdquo;. Elas precisam de frase falada.
        </p>
      ) : null}

      <div className="mt-4 border-t border-borda pt-4">
        <label
          htmlFor={`acerto-${dados.idioma.id}`}
          className="mb-2 block text-rotulo uppercase text-texto-3"
        >
          % de acerto do deck
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`acerto-${dados.idioma.id}`}
            type="number"
            min={0}
            max={100}
            value={acerto}
            placeholder={dados.acertos.at(-1) ? String(dados.acertos.at(-1)?.pct) : "—"}
            onChange={(e) => setAcerto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarAcerto();
            }}
            className="h-9 w-20 rounded-[10px] border border-borda-forte bg-superficie px-2 text-right text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
          <button
            type="button"
            onClick={salvarAcerto}
            disabled={acerto === ""}
            className="text-pequeno text-texto-2 underline underline-offset-2 disabled:opacity-40"
          >
            registrar
          </button>
          {dados.acertos.length > 1 ? (
            <span className="ml-auto flex items-end gap-0.5" aria-hidden>
              {dados.acertos.map((p) => (
                <span
                  key={p.data}
                  title={`${p.data}: ${p.pct}%`}
                  className="w-1.5 rounded-t-[2px] bg-grafico-flashcards"
                  style={{ height: `${Math.max(3, (p.pct / 100) * 28)}px` }}
                />
              ))}
            </span>
          ) : null}
        </div>
      </div>

      {dados.ultimaVelocidade ? (
        <p className="mt-4 border-t border-borda pt-4 text-pequeno text-texto-2">
          Última criação: {dados.ultimaVelocidade.minPorPalavra.toFixed(1).replace(".", ",")}{" "}
          min/palavra
          {dados.medianaVelocidade
            ? ` · mediana ${dados.medianaVelocidade.toFixed(1).replace(".", ",")}`
            : ""}
        </p>
      ) : null}
    </section>
  );
}
