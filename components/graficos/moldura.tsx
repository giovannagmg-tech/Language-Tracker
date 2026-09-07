"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export type Tabela = {
  colunas: string[];
  linhas: (string | number)[][];
};

export type ItemLegenda = { rotulo: string; cor: string };

type Props = {
  titulo: string;
  subtitulo?: string;
  ancora?: string;
  legenda?: ItemLegenda[];
  tabela: Tabela;
  /** Altura da área de plotagem + faixa do eixo. Nunca corta o eixo. */
  altura?: number;
  children: React.ReactNode;
  className?: string;
};

/**
 * Toda visualização vem com o gêmeo em tabela: o valor nunca depende só de cor
 * nem só do tooltip. A legenda é obrigatória a partir de duas séries.
 */
export function MolduraGrafico({
  titulo,
  subtitulo,
  ancora,
  legenda,
  tabela,
  altura = 240,
  children,
  className,
}: Props) {
  const [verTabela, setVerTabela] = useState(false);
  const id = useId();

  return (
    <section
      id={ancora}
      aria-labelledby={`${id}-titulo`}
      className={cn(
        "rounded-card border border-borda bg-superficie p-6 shadow-card",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 id={`${id}-titulo`} className="text-h2 text-texto">
            {titulo}
          </h3>
          {subtitulo ? <p className="mt-0.5 text-pequeno text-texto-2">{subtitulo}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setVerTabela((v) => !v)}
          aria-pressed={verTabela}
          className="shrink-0 text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          {verTabela ? "ver gráfico" : "ver tabela"}
        </button>
      </div>

      {legenda && legenda.length > 1 ? (
        <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {legenda.map((item) => (
            <li key={item.rotulo} className="flex items-center gap-1.5 text-pequeno text-texto-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: item.cor }}
              />
              {item.rotulo}
            </li>
          ))}
        </ul>
      ) : null}

      {verTabela ? (
        <div className="overflow-x-auto">
          <table className="w-full text-pequeno">
            <thead>
              <tr className="border-b border-borda">
                {tabela.colunas.map((coluna, i) => (
                  <th
                    key={coluna}
                    scope="col"
                    className={cn(
                      "py-2 text-rotulo uppercase text-texto-3",
                      i === 0 ? "text-left" : "text-right",
                    )}
                  >
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha) => (
                <tr key={String(linha[0])} className="border-b border-borda last:border-0">
                  {linha.map((celula, i) => (
                    <td
                      key={i}
                      className={cn(
                        "py-2 text-texto",
                        i === 0 ? "text-left" : "text-right tabular",
                      )}
                    >
                      {celula}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: altura }}>{children}</div>
      )}
    </section>
  );
}
