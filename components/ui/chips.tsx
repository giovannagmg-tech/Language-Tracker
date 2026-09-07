"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type OpcaoChip<T extends string> = {
  valor: T;
  rotulo: string;
  prefixo?: string;
  desabilitado?: boolean;
  motivo?: string;
};

type Props<T extends string> = {
  legenda: string;
  opcoes: OpcaoChip<T>[];
  valor: T | null;
  onChange: (valor: T) => void;
  colunas?: string;
};

/**
 * Grupo de escolha única navegável só pelo teclado: setas andam, 1–9 saltam
 * direto para a enésima opção, Espaço e Enter escolhem. O ativo inverte fundo
 * e texto — contraste máximo, zero ambiguidade (docs/07, 2.7).
 */
export function GrupoDeChips<T extends string>({
  legenda,
  opcoes,
  valor,
  onChange,
  colunas,
}: Props<T>) {
  const container = useRef<HTMLDivElement>(null);

  function focar(indice: number) {
    const alvos = container.current?.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    );
    if (!alvos || alvos.length === 0) return;
    const i = (indice + alvos.length) % alvos.length;
    alvos[i].focus();
  }

  function aoTeclar(evento: React.KeyboardEvent, indice: number) {
    if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
      evento.preventDefault();
      focar(indice + 1);
      return;
    }
    if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
      evento.preventDefault();
      focar(indice - 1);
      return;
    }
    if (/^[1-9]$/.test(evento.key)) {
      const alvo = opcoes.filter((o) => !o.desabilitado)[Number(evento.key) - 1];
      if (alvo) {
        evento.preventDefault();
        onChange(alvo.valor);
      }
    }
  }

  return (
    <fieldset>
      <legend className="mb-2 block text-rotulo uppercase text-texto-3">{legenda}</legend>
      <div
        ref={container}
        role="radiogroup"
        aria-label={legenda}
        className={cn("flex flex-wrap gap-2", colunas)}
      >
        {opcoes.map((opcao, indice) => {
          const ativo = opcao.valor === valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={ativo}
              disabled={opcao.desabilitado}
              title={opcao.motivo}
              onClick={() => onChange(opcao.valor)}
              onKeyDown={(e) => aoTeclar(e, indice)}
              className={cn(
                "h-[34px] rounded-full border px-4 text-corpo transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2",
                ativo
                  ? "border-texto bg-texto font-medium text-fundo"
                  : "border-borda-forte bg-superficie text-texto-2 hover:border-texto-3",
                opcao.desabilitado &&
                  "cursor-not-allowed border-borda bg-superficie-2 text-texto-3 hover:border-borda",
              )}
            >
              {opcao.prefixo ? <span className="mr-1.5">{opcao.prefixo}</span> : null}
              {opcao.rotulo}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
