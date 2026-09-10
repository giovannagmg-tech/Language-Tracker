"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  avancarMetaLivre,
  criarMetaLivre,
  excluirMetaLivre,
} from "@/lib/actions/metas-livres";
import { plural, type MetaLivreAvaliada } from "@/lib/domain/metas-livres";
import type { EstadoSemaforo } from "@/lib/domain/tipos";
import { PastilhaIdioma } from "@/components/ui/idioma";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

const CORES: Record<EstadoSemaforo, string> = {
  vermelho: "text-perigo",
  amarelo: "text-atencao",
  verde: "text-sucesso",
  cinza: "text-texto-3",
};

const UNIDADES = ["livro", "episódio", "capítulo", "aula", "áudio", "vídeo", "página", "texto"];

type Props = {
  metas: MetaLivreAvaliada[];
  idiomas: IdiomaResumo[];
  resumo: { total: number; concluidas: number; atrasadas: number };
};

/**
 * Metas escritas à mão: "ler 1 livro em inglês", "assistir 8 episódios".
 * Ficam ao lado do painel mensal, mas não se misturam com ele — aquelas têm
 * fórmula do método, estas são suas.
 */
export function MetasLivres({ metas, idiomas, resumo }: Props) {
  const [criando, setCriando] = useState(false);

  return (
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-h2 text-texto">Minhas metas</h2>
        <div className="flex items-center gap-4">
          {resumo.total > 0 ? (
            <p className="text-pequeno text-texto-2 tabular">
              {resumo.concluidas} de {resumo.total} {resumo.total === 1 ? "concluída" : "concluídas"}
              {resumo.atrasadas > 0 ? (
                <span className="ml-2 text-perigo">
                  · {resumo.atrasadas} {resumo.atrasadas === 1 ? "atrasada" : "atrasadas"}
                </span>
              ) : null}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setCriando((v) => !v)}
            className="text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            {criando ? "cancelar" : "nova meta"}
          </button>
        </div>
      </div>

      {criando ? (
        <FormularioMeta
          idiomas={idiomas}
          onPronto={() => setCriando(false)}
        />
      ) : null}

      {metas.length === 0 && !criando ? (
        <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <p className="text-corpo text-texto">Nenhuma meta escrita por você ainda.</p>
          <p className="mt-1 text-pequeno text-texto-2">
            Aqui entra o que o método não mede sozinho: ler um livro, terminar
            uma série, gravar dez áudios. Você escreve, conta e risca.
          </p>
          <button
            type="button"
            onClick={() => setCriando(true)}
            className="mt-4 h-9 rounded-full bg-texto px-4 text-corpo font-medium text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
          >
            Criar a primeira
          </button>
        </div>
      ) : null}

      {metas.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metas.map((meta) => (
            <CartaoMeta key={meta.id} meta={meta} idiomas={idiomas} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function CartaoMeta({ meta, idiomas }: { meta: MetaLivreAvaliada; idiomas: IdiomaResumo[] }) {
  const [, iniciar] = useTransition();
  const [feito, avancarOtimista] = useOptimistic(
    meta.feito,
    (atual: number, passo: number) => Math.max(0, atual + passo),
  );
  const idioma = idiomas.find((i) => i.id === meta.idiomaId);
  const concluida = feito >= meta.alvo;
  const pct = Math.min(1, meta.alvo > 0 ? feito / meta.alvo : 0);

  function avancar(passo: number) {
    iniciar(async () => {
      avancarOtimista(passo);
      const r = await avancarMetaLivre(meta.id, passo);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para atualizar.");
        return;
      }
      if (r.concluida && !meta.concluida) toast.success(`"${meta.titulo}" concluída.`);
    });
  }

  function excluir() {
    iniciar(async () => {
      const r = await excluirMetaLivre(meta.id);
      if (!r.ok) toast.error(r.erro ?? "Não deu para excluir.");
    });
  }

  return (
    <li
      className={cn(
        "flex flex-col rounded-card border bg-superficie p-5 shadow-card",
        concluida ? "border-sucesso" : "border-borda",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {idioma ? <PastilhaIdioma idioma={idioma} compacta className="mb-1" /> : null}
          <p className={cn("text-h3", concluida ? "text-texto-2 line-through" : "text-texto")}>
            {meta.titulo}
          </p>
        </div>
        {concluida ? (
          <Check className="mt-0.5 size-4 shrink-0 text-sucesso" strokeWidth={3} />
        ) : null}
      </div>

      <p className={cn("mt-1 text-pequeno", CORES[meta.estado])}>{meta.resumo}</p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-superficie-2">
          <div
            className={cn("h-1.5 rounded-full", concluida ? "bg-sucesso" : "bg-texto-3")}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-pequeno text-texto-2 tabular">
          {feito}/{meta.alvo} {plural(meta.unidade, meta.alvo)}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => avancar(-1)}
          disabled={feito === 0}
          aria-label={`Tirar 1 ${meta.unidade} de ${meta.titulo}`}
          className="grid size-9 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none transition-colors hover:border-texto-3 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => avancar(1)}
          aria-label={`Somar 1 ${meta.unidade} em ${meta.titulo}`}
          className="h-9 flex-1 rounded-full bg-texto px-4 text-corpo font-medium text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        >
          +1 {meta.unidade}
        </button>
        <button
          type="button"
          onClick={excluir}
          aria-label={`Excluir a meta ${meta.titulo}`}
          className="grid size-9 place-items-center rounded-full text-texto-3 outline-none transition-colors hover:text-perigo focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

/** `z.input` de um `z.coerce.number()` é `unknown`; o formulário precisa do tipo real. */
type Formulario = {
  titulo: string;
  idiomaId: string | null;
  unidade: string;
  alvo: number;
  prazo: string | null;
};

function FormularioMeta({
  idiomas,
  onPronto,
}: {
  idiomas: IdiomaResumo[];
  onPronto: () => void;
}) {
  const [salvando, iniciar] = useTransition();
  const [form, setForm] = useState<Formulario>({
    titulo: "",
    idiomaId: null,
    unidade: "livro",
    alvo: 1,
    prazo: null,
  });

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await criarMetaLivre(form);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para criar.");
        return;
      }
      toast.success("Meta criada.");
      onPronto();
    });
  }

  const campo =
    "h-9 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500";

  return (
    <form
      onSubmit={salvar}
      className="mb-4 rounded-card border border-borda bg-superficie p-5 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-rotulo uppercase text-texto-3">O que você quer fazer</span>
          <input
            type="text"
            required
            autoFocus
            maxLength={120}
            placeholder="Ler 1 livro em inglês"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Idioma</span>
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

        <div className="flex gap-2">
          <label className="flex w-20 flex-col gap-1.5">
            <span className="text-rotulo uppercase text-texto-3">Quantos</span>
            <input
              type="number"
              min={1}
              max={100000}
              required
              value={form.alvo}
              onChange={(e) => setForm({ ...form, alvo: Math.max(1, Number(e.target.value)) })}
              className={cn(campo, "text-right tabular")}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-rotulo uppercase text-texto-3">De quê</span>
            <input
              type="text"
              required
              list="unidades-meta"
              maxLength={24}
              value={form.unidade}
              onChange={(e) => setForm({ ...form, unidade: e.target.value })}
              className={campo}
            />
            <datalist id="unidades-meta">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Prazo (opcional)</span>
          <input
            type="date"
            value={form.prazo ?? ""}
            onChange={(e) => setForm({ ...form, prazo: e.target.value || null })}
            className={campo}
          />
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            disabled={salvando || form.titulo.trim() === ""}
            className="h-9 flex-1 rounded-full bg-texto px-4 text-corpo font-medium text-fundo outline-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
          >
            <Plus className="mr-1 inline size-4" />
            {salvando ? "criando…" : "Criar"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-pequeno text-texto-2">
        Sem prazo a meta não fica atrasada — só espera. Com prazo, ela avisa
        quando você sai do ritmo.
      </p>
    </form>
  );
}
