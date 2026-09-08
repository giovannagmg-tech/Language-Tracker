"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { encerrarRetomada } from "@/lib/actions/retomada";
import { FASES } from "@/lib/domain/retomada";
import type { RetomadaAtiva } from "@/lib/motores/retomada";
import { cn } from "@/lib/utils";

/**
 * RN-601 a RN-604. Enquanto a retomada está ativa, ela substitui as tarefas da
 * marcha. Nenhuma mensagem de culpa: retomar é a habilidade crítica.
 */
export function ModoRetomada({ retomada }: { retomada: RetomadaAtiva }) {
  const [saindo, iniciar] = useTransition();

  function sair() {
    iniciar(async () => {
      const r = await encerrarRetomada();
      toast[r.ok ? "success" : "error"](
        r.ok ? "Modo retomada encerrado. Metas normais de volta." : (r.erro ?? "Falhou."),
      );
    });
  }

  return (
    <section
      aria-labelledby="retomada-titulo"
      className="rounded-card border-2 border-atencao bg-superficie p-6 shadow-card"
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="retomada-titulo" className="text-h2 text-texto">
          Modo retomada — fase {retomada.fase} de 5
        </h2>
        <span className="text-rotulo uppercase text-texto-3">
          {retomada.diasDeLacuna} dias fora
        </span>
      </div>

      <p className="mb-5 text-corpo text-texto-2">
        {retomada.nomeFase}: {retomada.resumoFase.toLowerCase()}.
      </p>

      <ol className="mb-5 flex items-center gap-2">
        {FASES.map((fase) => (
          <li key={fase.numero} className="flex-1">
            <div
              className={cn(
                "h-2 rounded-full",
                fase.numero < retomada.fase
                  ? "bg-sucesso"
                  : fase.numero === retomada.fase
                    ? "bg-atencao"
                    : "bg-superficie-2",
              )}
            />
            <span
              className={cn(
                "mt-1.5 block text-center text-rotulo",
                fase.numero === retomada.fase ? "font-bold text-texto" : "text-texto-3",
              )}
            >
              {fase.numero}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-corpo text-texto">
        <span className="text-numero-sm">{retomada.diasCumpridos}</span>
        <span className="text-texto-2"> de {retomada.diasExigidos} dias cumpridos nesta fase.</span>
      </p>

      <p className="mt-4 border-t border-borda pt-4 text-pequeno text-texto-2">
        As metas normais estão pausadas. O piso diário continua valendo — ele nunca depende de
        nada.
      </p>

      <button
        type="button"
        onClick={sair}
        disabled={saindo}
        className="mt-3 text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
      >
        {saindo ? "encerrando…" : "sair do modo retomada"}
      </button>
    </section>
  );
}
