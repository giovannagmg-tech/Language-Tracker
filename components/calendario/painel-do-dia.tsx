"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { FormularioTarefa } from "@/components/calendario/formulario-tarefa";
import {
  adiarTarefa,
  alternarDoDia,
  dispensarTarefa,
  excluirTarefaManual,
} from "@/lib/actions/tarefas-manuais";
import {
  paramsDoRascunho,
  rascunhoDaTarefa,
  type TarefaManualAvaliada,
} from "@/lib/domain/tarefas-manuais";
import { ROTULO_PILAR } from "@/lib/domain/tipos";
import type { IdiomaDoCalendario } from "@/lib/queries/calendario";
import type { EstadoDoDia } from "@/lib/queries/dia";
import { cn } from "@/lib/utils";

export function PainelDoDia({ estado }: { estado: EstadoDoDia }) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [ocultas, ocultar] = useOptimistic(
    [] as string[],
    (atual: string[], id: string) => [...atual, id],
  );

  const tarefas = estado.tarefas.filter((t) => !ocultas.includes(t.id));
  const atrasadas = estado.atrasadas.filter((t) => !ocultas.includes(t.id));

  return (
    <div className="space-y-6">
      {atrasadas.length > 0 ? (
        <section>
          <h2 className="mb-2 text-rotulo uppercase text-perigo">
            Atrasadas · {atrasadas.length}
          </h2>
          <ul className="space-y-2">
            {atrasadas.map((t) => (
              <Cartao
                key={t.id}
                tarefa={t}
                idiomas={estado.idiomas}
                mostrarData
                editando={editando === t.id}
                aoEditar={setEditando}
                aoOcultar={ocultar}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-rotulo uppercase text-texto-3">
            Planejado {tarefas.length > 0 ? `· ${estado.resumo.concluidas}/${tarefas.length}` : ""}
          </h2>
          {!criando ? (
            <button
              type="button"
              onClick={() => setCriando(true)}
              className="flex items-center gap-1 text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              <Plus className="size-3.5" />
              nova tarefa
            </button>
          ) : null}
        </div>

        {criando ? (
          <div className="mb-3 rounded-card border border-borda bg-superficie p-5 shadow-card">
            <FormularioTarefa
              data={estado.data}
              idiomas={estado.idiomas}
              aoFechar={() => setCriando(false)}
            />
          </div>
        ) : null}

        {tarefas.length === 0 && !criando ? (
          <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
            <p className="text-corpo text-texto">Nada planejado para este dia.</p>
            <p className="mt-1 text-pequeno text-texto-2">
              As tarefas da marcha aparecem aqui automaticamente. Você também
              pode escrever a sua.
            </p>
            <button
              type="button"
              onClick={() => setCriando(true)}
              className="mt-4 h-9 rounded-full bg-texto px-4 text-corpo font-medium text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
            >
              Criar tarefa
            </button>
          </div>
        ) : null}

        <ul className="space-y-2">
          {tarefas.map((t) => (
            <Cartao
              key={t.id}
              tarefa={t}
              idiomas={estado.idiomas}
              editando={editando === t.id}
              aoEditar={setEditando}
              aoOcultar={ocultar}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function Cartao({
  tarefa,
  idiomas,
  mostrarData = false,
  editando,
  aoEditar,
  aoOcultar,
}: {
  tarefa: TarefaManualAvaliada;
  idiomas: IdiomaDoCalendario[];
  mostrarData?: boolean;
  editando: boolean;
  aoEditar: (id: string | null) => void;
  aoOcultar: (id: string) => void;
}) {
  const [, iniciar] = useTransition();
  const idioma = idiomas.find((i) => i.id === tarefa.idiomaId);

  function agir(acao: () => Promise<{ ok: boolean; erro?: string }>, sucesso: string, some = false) {
    iniciar(async () => {
      if (some) aoOcultar(tarefa.id);
      const r = await acao();
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu certo.");
        return;
      }
      toast.success(sucesso);
    });
  }

  if (editando) {
    return (
      <li className="rounded-card border border-borda bg-superficie p-5 shadow-card">
        <FormularioTarefa
          data={tarefa.data}
          idiomas={idiomas}
          tarefa={tarefa}
          aoFechar={() => aoEditar(null)}
        />
      </li>
    );
  }

  return (
    <li
      className={cn(
        "rounded-card border bg-superficie p-4 shadow-card",
        tarefa.atrasada ? "border-perigo/40" : tarefa.doDia ? "border-lime-500" : "border-borda",
      )}
    >
      <div className="flex items-start gap-3">
        {/* RN-1207: concluir abre o registro já preenchido. Salvar lá grava a
            sessão e fecha a tarefa — o app mede execução, nunca intenção. */}
        {tarefa.concluida ? (
          <span
            aria-label="Concluída"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 border-sucesso bg-sucesso text-white"
          >
            <Check className="size-3" strokeWidth={3} />
          </span>
        ) : (
          <Link
            href={`/registro?${paramsDoRascunho(rascunhoDaTarefa(tarefa))}`}
            aria-label={`Concluir registrando a sessão: ${tarefa.titulo}`}
            title="Concluir registrando o que aconteceu"
            className="mt-0.5 size-5 shrink-0 rounded-md border-2 border-borda-forte outline-none transition-colors hover:border-sucesso focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        )}

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-corpo",
              tarefa.concluida ? "text-texto-3 line-through" : "text-texto",
            )}
          >
            {idioma ? <span className="mr-1.5">{idioma.bandeira}</span> : null}
            {tarefa.titulo}
            {tarefa.doDia ? (
              <Star
                aria-label="tarefa do dia"
                className="ml-1.5 inline size-3.5 fill-lime-500 text-lime-500"
              />
            ) : null}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-pequeno text-texto-3">
            {mostrarData ? (
              <span className="text-perigo">
                de {tarefa.data.split("-").reverse().slice(0, 2).join("/")}
                {tarefa.diasDeAtraso > 0
                  ? ` · ${tarefa.diasDeAtraso} ${tarefa.diasDeAtraso === 1 ? "dia" : "dias"}`
                  : ""}
              </span>
            ) : null}
            {tarefa.horaPrevista ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {tarefa.horaPrevista}
              </span>
            ) : null}
            {tarefa.duracaoPrevistaMin ? <span>{tarefa.duracaoPrevistaMin} min</span> : null}
            {tarefa.pilar ? <span>{ROTULO_PILAR[tarefa.pilar]}</span> : null}
            {tarefa.automatica ? <span className="italic">da marcha</span> : null}
          </p>

          {tarefa.descricao ? (
            <p className="mt-1 text-pequeno text-texto-2">{tarefa.descricao}</p>
          ) : null}
        </div>

        {!tarefa.concluida ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <IconeAcao
              rotulo={tarefa.doDia ? "Tirar de tarefa do dia" : "Marcar como a tarefa do dia"}
              onClick={() => agir(() => alternarDoDia(tarefa.id), tarefa.doDia ? "Desmarcada." : "É a do dia.")}
              className={tarefa.doDia ? "text-lime-600" : undefined}
            >
              <Star className={cn("size-4", tarefa.doDia && "fill-current")} />
            </IconeAcao>

            {tarefa.podeEditar ? (
              <IconeAcao rotulo="Editar" onClick={() => aoEditar(tarefa.id)}>
                <Pencil className="size-4" />
              </IconeAcao>
            ) : null}

            {tarefa.podeAdiar ? (
              <IconeAcao
                rotulo="Adiar um dia"
                onClick={() => agir(() => adiarTarefa(tarefa.id), "Adiada um dia.", true)}
              >
                <Clock className="size-4" />
              </IconeAcao>
            ) : null}

            {tarefa.podeEditar ? (
              <IconeAcao
                rotulo="Excluir"
                perigo
                onClick={() => agir(() => excluirTarefaManual(tarefa.id), "Excluída.", true)}
              >
                <Trash2 className="size-4" />
              </IconeAcao>
            ) : (
              <IconeAcao
                rotulo="Dispensar"
                perigo
                onClick={() => agir(() => dispensarTarefa(tarefa.id), "Dispensada.", true)}
              >
                <X className="size-4" />
              </IconeAcao>
            )}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function IconeAcao({
  rotulo,
  onClick,
  children,
  perigo = false,
  className,
}: {
  rotulo: string;
  onClick: () => void;
  children: React.ReactNode;
  perigo?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={rotulo}
      className={cn(
        "grid size-8 place-items-center rounded-full text-texto-3 outline-none transition-colors",
        perigo ? "hover:text-perigo" : "hover:text-texto",
        "focus-visible:ring-2 focus-visible:ring-lime-500",
        className,
      )}
    >
      {children}
    </button>
  );
}
