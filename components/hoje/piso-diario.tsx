"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { alternarRevisao } from "@/lib/actions/flashcards";
import { excluirSessao, registrarUmMinuto } from "@/lib/actions/sessoes";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

type Props = {
  hoje: string;
  idiomas: IdiomaResumo[];
  idiomaFocoId: string;
  idiomasRevisados: string[];
  minutosFala: number;
};

/**
 * RN-302. O piso ocupa cartão próprio, separado do resto: ele não depende da
 * marcha, e é a única coisa que precisa acontecer inclusive no pior dia.
 * Escrita otimista — o botão responde antes do servidor (regra 7).
 */
export function PisoDiario({
  hoje,
  idiomas,
  idiomaFocoId,
  idiomasRevisados,
  minutosFala,
}: Props) {
  const [, iniciar] = useTransition();
  const [revisados, marcarOtimista] = useOptimistic(
    idiomasRevisados,
    (atual: string[], idiomaId: string) =>
      atual.includes(idiomaId) ? atual.filter((i) => i !== idiomaId) : [...atual, idiomaId],
  );
  const [fala, somarOtimista] = useOptimistic(minutosFala, (atual: number, mais: number) => atual + mais);

  const temFlashcards = revisados.length > 0;
  const temFala = fala >= 1;
  const cumprido = temFlashcards && temFala;

  function revisar(idiomaId: string) {
    iniciar(async () => {
      marcarOtimista(idiomaId);
      const r = await alternarRevisao(idiomaId, hoje);
      if (!r.ok) toast.error(r.erro ?? "Não deu para marcar.");
    });
  }

  function falarUmMinuto() {
    iniciar(async () => {
      somarOtimista(1);
      const r = await registrarUmMinuto(idiomaFocoId);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success("1 minuto de fala registrado.", {
        duration: 30_000,
        action: { label: "Desfazer", onClick: () => void excluirSessao(r.id) },
      });
    });
  }

  return (
    <section
      aria-labelledby="piso-titulo"
      className={cn(
        "rounded-card border-2 bg-superficie p-6 shadow-card",
        cumprido ? "border-sucesso" : "border-borda-forte",
      )}
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 id="piso-titulo" className="text-h2 text-texto">
          Piso diário
        </h2>
        <span
          className={cn(
            "text-rotulo uppercase",
            cumprido ? "text-sucesso" : "text-texto-3",
          )}
        >
          {cumprido ? "cumprido" : "pendente"}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Marcador ativo={temFlashcards} />
            <span className="text-h3 text-texto">Flashcards revisados</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {idiomas.map((idioma) => {
              const feito = revisados.includes(idioma.id);
              return (
                <button
                  key={idioma.id}
                  type="button"
                  aria-pressed={feito}
                  onClick={() => revisar(idioma.id)}
                  className={cn(
                    "h-9 rounded-full border px-3 text-corpo outline-none transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2",
                    feito
                      ? "border-sucesso bg-sucesso-bg font-medium text-sucesso"
                      : "border-borda-forte text-texto-2 hover:border-texto-3",
                  )}
                >
                  <span className="mr-1.5">{idioma.bandeira}</span>
                  {idioma.nome}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Marcador ativo={temFala} />
            <span className="text-h3 text-texto">1 minuto de fala</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={falarUmMinuto}
              className="h-9 rounded-full bg-texto px-4 text-corpo font-medium text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
            >
              Falei 1 min
            </button>
            <span className="text-pequeno text-texto-2 tabular">
              {fala} min hoje
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 border-t border-borda pt-4 text-pequeno text-texto-2">
        O piso não depende da marcha.
      </p>
    </section>
  );
}

function Marcador({ ativo }: { ativo: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-full border-2",
        ativo ? "border-sucesso bg-sucesso text-white" : "border-borda-forte",
      )}
    >
      {ativo ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}
