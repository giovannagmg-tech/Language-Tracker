"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { criarIdioma } from "@/lib/actions/configuracoes";
import {
  BANDEIRAS_SUGERIDAS,
  CORES_SUGERIDAS,
  proximaCor,
} from "@/lib/domain/idiomas";
import { NIVEIS, type Nivel } from "@/lib/domain/tipos";
import { cn } from "@/lib/utils";

export function NovoIdioma({ coresEmUso }: { coresEmUso: string[] }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-card border border-dashed border-borda-forte text-corpo text-texto-2 outline-none transition-colors hover:border-texto-3 hover:text-texto focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
      >
        <Plus className="size-4" />
        Adicionar idioma
      </button>
    );
  }

  return <Formulario coresEmUso={coresEmUso} aoFechar={() => setAberto(false)} />;
}

function Formulario({
  coresEmUso,
  aoFechar,
}: {
  coresEmUso: string[];
  aoFechar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [cor, setCor] = useState(proximaCor(coresEmUso));
  const [nivelAtual, setNivelAtual] = useState<Nivel>("A0");
  const [nivelMeta, setNivelMeta] = useState<Nivel>("B2.1");
  const [metaPalavrasDia, setMetaPalavrasDia] = useState(5);
  const [ativo, setAtivo] = useState(true);
  const [salvando, iniciar] = useTransition();

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await criarIdioma({
        nome,
        bandeira,
        cor,
        nivelAtual,
        nivelMeta,
        metaPalavrasDia,
        ativo,
      });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para criar.");
        return;
      }
      toast.success(`${bandeira} ${nome} adicionado.`);
      aoFechar();
    });
  }

  const campo =
    "h-9 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500";

  return (
    <form
      onSubmit={salvar}
      className="rounded-card border border-borda bg-superficie p-6 shadow-card"
      style={{ borderLeft: `4px solid ${cor}` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full text-h3"
          style={{ background: `${cor}22` }}
        >
          {bandeira || "🏳"}
        </span>
        <div className="min-w-0">
          <p className="text-h3 text-texto">{nome || "Novo idioma"}</p>
          <p className="text-pequeno text-texto-2">
            Nasce vazio, com metas próprias e as conquistas por idioma.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">Nome</span>
          <input
            type="text"
            required
            autoFocus
            maxLength={40}
            placeholder="Italiano"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={campo}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">
            Meta de palavras por dia
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={metaPalavrasDia}
            onChange={(e) => setMetaPalavrasDia(Math.max(0, Number(e.target.value)))}
            className={cn(campo, "tabular")}
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1.5 text-rotulo uppercase text-texto-3">Bandeira</legend>
        <div className="flex flex-wrap items-center gap-1.5">
          {BANDEIRAS_SUGERIDAS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBandeira(b)}
              aria-pressed={bandeira === b}
              aria-label={`Usar ${b}`}
              className={cn(
                "grid size-9 place-items-center rounded-full border text-h3 outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                bandeira === b ? "border-texto bg-superficie-2" : "border-transparent",
              )}
            >
              {b}
            </button>
          ))}
          <input
            type="text"
            maxLength={8}
            placeholder="outra"
            value={bandeira}
            onChange={(e) => setBandeira(e.target.value)}
            aria-label="Bandeira personalizada"
            className="h-9 w-20 rounded-[10px] border border-borda-forte bg-superficie px-2 text-center text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-1.5 text-rotulo uppercase text-texto-3">Cor</legend>
        <div className="flex flex-wrap items-center gap-1.5">
          {CORES_SUGERIDAS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCor(c)}
              aria-pressed={cor === c}
              aria-label={`Usar a cor ${c}`}
              className={cn(
                "size-8 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-lime-500",
                cor === c && "ring-2 ring-texto",
              )}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            aria-label="Cor personalizada"
            className="h-8 w-12 cursor-pointer rounded-[10px] border border-borda-forte bg-superficie"
          />
        </div>
        <p className="mt-1.5 text-pequeno text-texto-3">
          É a cor dele nos gráficos. Escolha uma que não se confunda com as outras.
        </p>
      </fieldset>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">Nível atual</span>
          <select
            value={nivelAtual}
            onChange={(e) => setNivelAtual(e.target.value as Nivel)}
            className={campo}
          >
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-rotulo uppercase text-texto-3">Nível-meta</span>
          <select
            value={nivelMeta}
            onChange={(e) => setNivelMeta(e.target.value as Nivel)}
            className={campo}
          >
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2.5 rounded-[10px] bg-superficie-2 p-3">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-lime-500"
        />
        <span>
          <span className="block text-corpo text-texto">Estudando agora</span>
          <span className="block text-pequeno text-texto-2">
            Desmarcado, ele guarda histórico mas fica fora das metas, do piso e
            do calendário.
          </span>
        </span>
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={aoFechar}
          className="h-9 rounded-full px-4 text-corpo text-texto-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={salvando || nome.trim() === ""}
          className="h-9 rounded-full bg-texto px-5 text-corpo font-medium text-fundo outline-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
        >
          {salvando ? "criando…" : "Adicionar idioma"}
        </button>
      </div>
    </form>
  );
}
