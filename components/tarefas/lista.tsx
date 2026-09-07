"use client";

import { useState, useTransition } from "react";
import { Check, Cog } from "lucide-react";
import { toast } from "sonner";
import {
  adiarTarefa,
  avancarTarefa,
  dispensarTarefa,
  reabrirTarefa,
} from "@/lib/actions/tarefas";
import { estaAtrasada, podeAdiar, type TarefaLista } from "@/lib/domain/tarefas";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { fmtDataCurta } from "@/lib/formatadores";
import { cn } from "@/lib/utils";

type Props = {
  titulo: string;
  descricao: string;
  tarefas: TarefaLista[];
  idiomas: IdiomaResumo[];
  hoje: string;
  vazio: string;
};

/**
 * RN-804. Automáticas e manuais em seções fixas: uma automática nunca migra
 * para a outra lista. Título e critério são somente leitura (RN-803).
 */
export function ListaTarefasCompleta({ titulo, descricao, tarefas, idiomas, hoje, vazio }: Props) {
  const [filtro, setFiltro] = useState<"abertas" | "todas">("abertas");
  const [, iniciar] = useTransition();

  const visiveis = tarefas.filter((t) => (filtro === "abertas" ? t.estado === "aberta" : true));

  function agir(acao: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string) {
    iniciar(async () => {
      const r = await acao();
      toast[r.ok ? "success" : "error"](r.ok ? sucesso : (r.erro ?? "Não deu certo."));
    });
  }

  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-h2 text-texto">{titulo}</h2>
          <p className="mt-0.5 text-pequeno text-texto-2">{descricao}</p>
        </div>
        <div className="flex gap-1 rounded-full bg-superficie-2 p-1">
          {(["abertas", "todas"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={filtro === f}
              className={cn(
                "rounded-full px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                filtro === f ? "bg-texto font-medium text-fundo" : "text-texto-2",
              )}
            >
              {f === "abertas" ? "Abertas" : "Todas"}
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="py-4 text-corpo text-texto-2">{vazio}</p>
      ) : (
        <ul className="divide-y divide-borda">
          {visiveis.map((t) => {
            const idioma = idiomas.find((i) => i.id === t.idiomaId);
            const atrasada = estaAtrasada(t, hoje);
            const concluida = t.estado === "concluida";
            const parcial = t.quantidadeExigida > 1;

            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
                {concluida ? (
                  <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-sucesso bg-sucesso text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Concluir: ${t.titulo}`}
                    onClick={() =>
                      agir(
                        () => avancarTarefa(t.id, 1),
                        parcial ? "Progresso anotado." : "Concluída.",
                      )
                    }
                    disabled={t.estado === "dispensada"}
                    className="size-5 shrink-0 rounded-md border-2 border-borda-forte outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-40"
                  />
                )}

                {t.automatica ? (
                  <Cog className="size-4 shrink-0 text-texto-3" strokeWidth={1.75} aria-label="gerada por regra" />
                ) : null}

                <span
                  className={cn(
                    "min-w-0 flex-1 text-corpo",
                    concluida || t.estado === "dispensada"
                      ? "text-texto-3 line-through"
                      : "text-texto",
                  )}
                >
                  {t.titulo}
                </span>

                {idioma ? (
                  <span className="shrink-0 text-pequeno text-texto-2">{idioma.bandeira}</span>
                ) : null}

                {parcial ? (
                  <span className="shrink-0 text-pequeno tabular text-texto-2">
                    {t.quantidadeFeita}/{t.quantidadeExigida}
                  </span>
                ) : null}

                <span
                  className={cn(
                    "w-14 shrink-0 text-right text-pequeno tabular",
                    atrasada ? "font-semibold text-perigo" : "text-texto-3",
                  )}
                >
                  {fmtDataCurta(t.dataPrevista)}
                </span>

                <span className="flex shrink-0 gap-3">
                  {t.estado === "aberta" ? (
                    <>
                      {podeAdiar(t) ? (
                        <button
                          type="button"
                          onClick={() => agir(() => adiarTarefa(t.id), "Adiada.")}
                          className="text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
                        >
                          adiar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => agir(() => dispensarTarefa(t.id), "Dispensada nesta janela.")}
                        className="text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
                      >
                        dispensar
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => agir(() => reabrirTarefa(t.id), "Reaberta.")}
                      className="text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
                    >
                      reabrir
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
