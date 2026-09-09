"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { excluirSessao } from "@/lib/actions/sessoes";
import { ROTULO_ATIVIDADE, ROTULO_PILAR, ROTULO_TEMPO } from "@/lib/domain/tipos";
import { fmtHoras } from "@/lib/formatadores";
import type { IdiomaHistorico, LinhaHistorico } from "@/lib/queries/historico";
import { cn } from "@/lib/utils";

const ROTULO_ORIGEM: Record<string, string> = {
  manual: "manual",
  toggl: "Toggl",
  automatica: "automática",
};

function porExtenso(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${data}T12:00:00Z`));
}

export function TabelaHistorico({
  linhas,
  idiomas,
}: {
  linhas: LinhaHistorico[];
  idiomas: IdiomaHistorico[];
}) {
  const [, iniciar] = useTransition();
  // Apagar precisa sumir da tela na hora (regra 7). O servidor revalida depois.
  const [apagados, marcarApagado] = useOptimistic(
    [] as string[],
    (atual: string[], id: string) => [...atual, id],
  );
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const porId = new Map(idiomas.map((i) => [i.id, i]));
  const visiveis = linhas.filter((l) => !apagados.includes(l.id));

  function excluir(linha: LinhaHistorico) {
    setConfirmando(null);
    iniciar(async () => {
      marcarApagado(linha.id);
      const r = await excluirSessao(linha.id);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para excluir.");
        return;
      }
      toast.success("Registro excluído.");
    });
  }

  if (visiveis.length === 0) {
    return (
      <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <p className="text-corpo text-texto">Nenhum registro neste recorte.</p>
        <p className="mt-1 text-pequeno text-texto-2">
          Mude os filtros, ou importe o histórico do Toggl em Importação.
        </p>
      </div>
    );
  }

  // Agrupa por dia: uma lista corrida de 100 linhas sem quebra é ilegível.
  const porDia = new Map<string, LinhaHistorico[]>();
  for (const linha of visiveis) {
    const lista = porDia.get(linha.data) ?? [];
    lista.push(linha);
    porDia.set(linha.data, lista);
  }

  return (
    <div className="space-y-6">
      {[...porDia].map(([data, doDia]) => {
        const minutos = doDia.reduce((t, l) => t + l.duracaoMin, 0);
        return (
          <section key={data}>
            <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-borda pb-1.5">
              <h2 className="text-rotulo uppercase text-texto-3">{porExtenso(data)}</h2>
              <span className="text-pequeno text-texto-2 tabular">{fmtHoras(minutos)}</span>
            </div>

            <ul className="divide-y divide-borda">
              {doDia.map((linha) => {
                const idioma = porId.get(linha.idiomaId);
                const perguntando = confirmando === linha.id;
                return (
                  <li key={linha.id} className="flex items-start gap-3 py-2.5">
                    <span className="w-11 shrink-0 pt-0.5 text-pequeno text-texto-3 tabular">
                      {linha.horaInicio ? linha.horaInicio.slice(0, 5) : "—"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-corpo text-texto">
                          {idioma ? <span className="mr-1">{idioma.bandeira}</span> : null}
                          {ROTULO_ATIVIDADE[linha.atividade]}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-rotulo uppercase",
                            linha.categoria === "ativo"
                              ? "bg-sucesso-bg text-sucesso"
                              : "bg-superficie-2 text-texto-3",
                          )}
                        >
                          {linha.categoria === "ativo" ? "ativo" : "imersão"}
                        </span>
                        {linha.pilar ? (
                          <span className="text-pequeno text-texto-2">
                            {ROTULO_PILAR[linha.pilar]}
                          </span>
                        ) : null}
                      </span>

                      <span className="mt-0.5 block text-pequeno text-texto-3">
                        {ROTULO_TEMPO[linha.tempo]}
                        {linha.minutosFala > 0 ? ` · ${linha.minutosFala} min de fala` : ""}
                        {linha.palavrasNovas > 0 ? ` · ${linha.palavrasNovas} palavras` : ""}
                        {linha.origem !== "manual"
                          ? ` · ${ROTULO_ORIGEM[linha.origem] ?? linha.origem}`
                          : ""}
                        {idioma && !idioma.ativo ? " · idioma inativo" : ""}
                      </span>

                      {linha.nota ? (
                        <span className="mt-0.5 block text-pequeno italic text-texto-2">
                          {linha.nota}
                        </span>
                      ) : null}
                    </span>

                    <span className="shrink-0 pt-0.5 text-corpo text-texto tabular">
                      {fmtHoras(linha.duracaoMin)}
                    </span>

                    {perguntando ? (
                      <span className="flex shrink-0 items-center gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => excluir(linha)}
                          className="h-7 rounded-full bg-perigo px-3 text-pequeno font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                        >
                          Excluir
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmando(null)}
                          className="h-7 px-2 text-pequeno text-texto-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                        >
                          cancelar
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmando(linha.id)}
                        aria-label={`Excluir ${ROTULO_ATIVIDADE[linha.atividade]} de ${porExtenso(linha.data)}`}
                        className="grid size-7 shrink-0 place-items-center rounded-full text-texto-3 outline-none transition-colors hover:text-perigo focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
