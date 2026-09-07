"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { criarTarefa } from "@/lib/actions/tarefas";
import type { IdiomaResumo } from "@/lib/queries/hoje";

const RECORRENCIAS = [
  { valor: "nenhuma", rotulo: "Uma vez" },
  { valor: "diaria", rotulo: "Diária" },
  { valor: "semanal", rotulo: "Semanal" },
  { valor: "mensal", rotulo: "Mensal" },
] as const;

type Recorrencia = (typeof RECORRENCIAS)[number]["valor"];

export function NovaTarefa({ idiomas, hoje }: { idiomas: IdiomaResumo[]; hoje: string }) {
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [idiomaId, setIdiomaId] = useState<string | null>(null);
  const [data, setData] = useState(hoje);
  const [recorrencia, setRecorrencia] = useState<Recorrencia>("nenhuma");
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await criarTarefa({ titulo, idiomaId, dataPrevista: data, recorrencia });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para criar.");
        return;
      }
      setTitulo("");
      setIdiomaId(null);
      setRecorrencia("nenhuma");
      setAberto(false);
      toast.success("Tarefa criada.");
    });
  }

  if (!aberto) {
    return (
      <Button type="button" onClick={() => setAberto(true)} className="h-10">
        Nova tarefa
      </Button>
    );
  }

  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <h2 className="mb-4 text-h2 text-texto">Nova tarefa</h2>

      <div className="space-y-5">
        <div>
          <label htmlFor="titulo" className="mb-2 block text-rotulo uppercase text-texto-3">
            Título
          </label>
          <input
            id="titulo"
            value={titulo}
            autoFocus
            maxLength={140}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && titulo.trim()) salvar();
              if (e.key === "Escape") setAberto(false);
            }}
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>

        <GrupoDeChips
          legenda="Idioma"
          valor={idiomaId}
          onChange={(v) => setIdiomaId(v === idiomaId ? null : v)}
          opcoes={idiomas.map((i) => ({ valor: i.id, rotulo: i.nome, prefixo: i.bandeira }))}
        />

        <GrupoDeChips
          legenda="Recorrência"
          valor={recorrencia}
          onChange={(v) => setRecorrencia(v)}
          opcoes={RECORRENCIAS.map((r) => ({ valor: r.valor, rotulo: r.rotulo }))}
        />

        <div>
          <label htmlFor="data-prevista" className="mb-2 block text-rotulo uppercase text-texto-3">
            Prazo
          </label>
          <input
            id="data-prevista"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-10 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={salvando || !titulo.trim()} className="h-9">
          {salvando ? "Criando…" : "Criar"}
        </Button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-pequeno text-texto-2 underline underline-offset-2"
        >
          cancelar
        </button>
      </div>
    </section>
  );
}
