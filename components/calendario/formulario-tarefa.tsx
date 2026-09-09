"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  criarTarefaManual,
  editarTarefaManual,
  type EntradaTarefaManual,
} from "@/lib/actions/tarefas-manuais";
import { PILARES, ROTULO_PILAR, type Pilar } from "@/lib/domain/tipos";
import type { TarefaManualAvaliada } from "@/lib/domain/tarefas-manuais";
import type { IdiomaDoCalendario } from "@/lib/queries/calendario";
import { cn } from "@/lib/utils";

/** `z.input` de um `z.coerce` é `unknown`; o formulário precisa do tipo real. */
type Formulario = {
  titulo: string;
  descricao: string;
  idiomaId: string | null;
  data: string;
  pilar: Pilar | null;
  horaPrevista: string;
  duracaoPrevistaMin: number | "";
  doDia: boolean;
};

function inicial(data: string, tarefa?: TarefaManualAvaliada): Formulario {
  return {
    titulo: tarefa?.titulo ?? "",
    descricao: tarefa?.descricao ?? "",
    idiomaId: tarefa?.idiomaId ?? null,
    data: tarefa?.data ?? data,
    pilar: tarefa?.pilar ?? null,
    horaPrevista: tarefa?.horaPrevista ?? "",
    duracaoPrevistaMin: tarefa?.duracaoPrevistaMin ?? "",
    doDia: tarefa?.doDia ?? false,
  };
}

export function FormularioTarefa({
  data,
  idiomas,
  tarefa,
  aoFechar,
}: {
  data: string;
  idiomas: IdiomaDoCalendario[];
  tarefa?: TarefaManualAvaliada;
  aoFechar: () => void;
}) {
  const [form, setForm] = useState<Formulario>(inicial(data, tarefa));
  const [salvando, iniciar] = useTransition();

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const entrada: EntradaTarefaManual = {
        titulo: form.titulo,
        descricao: form.descricao || null,
        idiomaId: form.idiomaId,
        data: form.data,
        pilar: form.pilar,
        horaPrevista: form.horaPrevista || null,
        duracaoPrevistaMin: form.duracaoPrevistaMin === "" ? null : form.duracaoPrevistaMin,
        doDia: form.doDia,
      };

      const r = tarefa
        ? await editarTarefaManual(tarefa.id, entrada)
        : await criarTarefaManual(entrada);

      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      toast.success(tarefa ? "Tarefa atualizada." : "Tarefa criada.");
      aoFechar();
    });
  }

  const campo =
    "h-9 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500";

  return (
    <form onSubmit={salvar} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-rotulo uppercase text-texto-3">
          O que você vai fazer
        </span>
        <input
          type="text"
          required
          autoFocus
          maxLength={140}
          placeholder="Ler 10 páginas do livro"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className={campo}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">Idioma</span>
          <select
            value={form.idiomaId ?? ""}
            onChange={(e) => setForm({ ...form, idiomaId: e.target.value || null })}
            className={campo}
          >
            <option value="">qualquer um</option>
            {idiomas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.bandeira} {i.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">Data</span>
          <input
            type="date"
            required
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            className={campo}
          />
        </label>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-rotulo uppercase text-texto-3">Pilar</legend>
        <div className="flex flex-wrap gap-1.5">
          <Chip
            ativo={form.pilar === null}
            onClick={() => setForm({ ...form, pilar: null })}
          >
            nenhum
          </Chip>
          {PILARES.map((p) => (
            <Chip
              key={p}
              ativo={form.pilar === p}
              onClick={() => setForm({ ...form, pilar: p })}
            >
              {ROTULO_PILAR[p]}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-pequeno text-texto-3">
          Sem pilar, a tarefa é de imersão ou organização — não entra na conta de
          estudo ativo.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">
            Duração prevista
          </span>
          <input
            type="number"
            min={1}
            max={480}
            placeholder="minutos"
            value={form.duracaoPrevistaMin}
            onChange={(e) =>
              setForm({
                ...form,
                duracaoPrevistaMin: e.target.value === "" ? "" : Number(e.target.value),
              })
            }
            className={cn(campo, "tabular")}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">
            Horário (opcional)
          </span>
          <input
            type="time"
            value={form.horaPrevista}
            onChange={(e) => setForm({ ...form, horaPrevista: e.target.value })}
            className={campo}
          />
        </label>
      </div>

      <label className="flex items-start gap-2.5 rounded-[10px] bg-superficie-2 p-3">
        <input
          type="checkbox"
          checked={form.doDia}
          onChange={(e) => setForm({ ...form, doDia: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-lime-500"
        />
        <span>
          <span className="block text-corpo text-texto">Essa é a tarefa do dia</span>
          <span className="block text-pequeno text-texto-2">
            Uma por dia. Marcar aqui desmarca a que estiver marcada.
          </span>
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-rotulo uppercase text-texto-3">
          Observações (opcional)
        </span>
        <textarea
          rows={2}
          maxLength={500}
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full rounded-[10px] border border-borda-forte bg-superficie p-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        />
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={aoFechar}
          className="h-9 rounded-full px-4 text-corpo text-texto-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando || form.titulo.trim() === ""}
          className="h-9 rounded-full bg-texto px-5 text-corpo font-medium text-fundo outline-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        >
          {salvando ? "salvando…" : tarefa ? "Salvar" : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "h-8 rounded-full border px-3 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
        ativo ? "border-texto bg-texto text-fundo" : "border-borda-forte text-texto-2",
      )}
    >
      {children}
    </button>
  );
}
