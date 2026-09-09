"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { IdiomaHistorico } from "@/lib/queries/historico";
import { cn } from "@/lib/utils";

/**
 * Filtros na URL, não em estado local: recarregar a página mantém o recorte, e
 * o link pode ser guardado. Toda mudança volta para a página 1 — filtrar e
 * continuar na página 7 devolveria uma tela vazia sem explicação.
 */
export function FiltrosHistorico({
  idiomas,
  total,
}: {
  idiomas: IdiomaHistorico[];
  total: number;
}) {
  const router = useRouter();
  const rota = usePathname();
  const params = useSearchParams();
  const [pendente, iniciar] = useTransition();

  function aplicar(chave: string, valor: string) {
    const novos = new URLSearchParams(params.toString());
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    novos.delete("pagina");
    iniciar(() => router.push(`${rota}?${novos.toString()}`));
  }

  const temFiltro = ["idioma", "categoria", "origem", "de", "ate"].some((c) =>
    params.get(c),
  );

  const campo =
    "h-9 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500";

  return (
    <div className={cn("mb-5", pendente && "opacity-60")}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Idioma</span>
          <select
            value={params.get("idioma") ?? ""}
            onChange={(e) => aplicar("idioma", e.target.value)}
            className={campo}
          >
            <option value="">todos</option>
            {idiomas.map((i) => (
              <option key={i.id} value={i.id}>
                {i.bandeira} {i.nome}
                {i.ativo ? "" : " (inativo)"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Categoria</span>
          <select
            value={params.get("categoria") ?? ""}
            onChange={(e) => aplicar("categoria", e.target.value)}
            className={campo}
          >
            <option value="">todas</option>
            <option value="ativo">Estudo ativo</option>
            <option value="imersao">Imersão</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Origem</span>
          <select
            value={params.get("origem") ?? ""}
            onChange={(e) => aplicar("origem", e.target.value)}
            className={campo}
          >
            <option value="">todas</option>
            <option value="manual">Registro manual</option>
            <option value="toggl">Importado do Toggl</option>
            <option value="automatica">Automática</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">De</span>
          <input
            type="date"
            value={params.get("de") ?? ""}
            onChange={(e) => aplicar("de", e.target.value)}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-rotulo uppercase text-texto-3">Até</span>
          <input
            type="date"
            value={params.get("ate") ?? ""}
            onChange={(e) => aplicar("ate", e.target.value)}
            className={campo}
          />
        </label>

        {temFiltro ? (
          <button
            type="button"
            onClick={() => iniciar(() => router.push(rota))}
            className="h-9 text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            limpar filtros
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-pequeno text-texto-2 tabular">
        {total === 0
          ? "nenhum registro neste recorte"
          : `${total} ${total === 1 ? "registro" : "registros"}`}
      </p>
    </div>
  );
}
