"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { alternarRevisao } from "@/lib/actions/flashcards";
import {
  excluirSessao,
  registrarAudioGrupo,
  registrarUmMinuto,
} from "@/lib/actions/sessoes";
import type { TarefaAvaliada } from "@/lib/domain/modelos";
import { cn } from "@/lib/utils";

type Props = {
  tarefas: TarefaAvaliada[];
  marcha: number;
  nomeMarcha: string;
  hoje: string;
  idiomaFocoId: string;
};

/** Tarefas que um clique resolve. O resto abre o registro já preenchido. */
const RESOLVE_DIRETO = new Set(["flashcards", "fala_1min", "audio_grupo"]);

function unidade(t: TarefaAvaliada): string {
  if (t.unidade === "min") return `${t.atual}/${t.alvo} min`;
  if (t.unidade === "sessao") return `${t.atual}/${t.alvo}`;
  return "";
}

export function ListaTarefas({ tarefas, marcha, nomeMarcha, hoje, idiomaFocoId }: Props) {
  const [, iniciar] = useTransition();

  function resolver(t: TarefaAvaliada) {
    iniciar(async () => {
      if (t.chave === "flashcards") {
        const r = await alternarRevisao(idiomaFocoId, hoje);
        toast[r.ok ? "success" : "error"](r.ok ? "Revisão marcada." : (r.erro ?? "Falhou."));
        return;
      }
      const r =
        t.chave === "fala_1min"
          ? await registrarUmMinuto(idiomaFocoId)
          : await registrarAudioGrupo(idiomaFocoId);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success("Registrado.", {
        duration: 30_000,
        action: { label: "Desfazer", onClick: () => void excluirSessao(r.id) },
      });
    });
  }

  const doDia = tarefas.filter((t) => t.escopo === "dia");
  const daSemana = tarefas.filter((t) => t.escopo === "semana");

  return (
    <section aria-labelledby="marcha-titulo" className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="marcha-titulo" className="text-h2 text-texto">
          Marcha {marcha} — {nomeMarcha}
        </h2>
        <span className="text-pequeno text-texto-3">use 1, 2 ou 3 para trocar</span>
      </div>

      <Bloco titulo="Hoje" tarefas={doDia} resolver={resolver} />
      {daSemana.length > 0 ? (
        <Bloco titulo="Esta semana" tarefas={daSemana} resolver={resolver} />
      ) : null}
    </section>
  );
}

function Bloco({
  titulo,
  tarefas,
  resolver,
}: {
  titulo: string;
  tarefas: TarefaAvaliada[];
  resolver: (t: TarefaAvaliada) => void;
}) {
  if (tarefas.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 text-rotulo uppercase text-texto-3">{titulo}</p>
      <ul className="space-y-1">
        {tarefas.map((t) => (
          <li key={t.chave} className="flex items-center gap-3 py-1.5">
            {RESOLVE_DIRETO.has(t.chave) && !t.cumprida ? (
              <button
                type="button"
                aria-label={`Concluir: ${t.titulo}`}
                onClick={() => resolver(t)}
                className="size-5 shrink-0 rounded-md border-2 border-borda-forte outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
              />
            ) : (
              <Link
                href="/registro"
                aria-label={`Registrar: ${t.titulo}`}
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                  t.cumprida
                    ? "border-sucesso bg-sucesso text-white"
                    : "border-borda-forte hover:border-texto-3",
                )}
              >
                {t.cumprida ? <Check className="size-3" strokeWidth={3} /> : null}
              </Link>
            )}
            <span
              className={cn(
                "flex-1 text-corpo",
                t.cumprida ? "text-texto-3 line-through" : "text-texto",
              )}
            >
              {t.titulo}
              {t.opcional ? <span className="ml-2 text-pequeno text-texto-3">opcional</span> : null}
            </span>
            <span className="shrink-0 text-pequeno text-texto-2 tabular">{unidade(t)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
