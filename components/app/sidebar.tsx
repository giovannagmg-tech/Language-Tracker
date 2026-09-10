"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NAVEGACAO } from "@/lib/navegacao";
import { ROTULO_MARCHA, type Marcha } from "@/lib/domain/tipos";
import { cn } from "@/lib/utils";

type Props = {
  marchaAtiva: Marcha;
  streakRegistro: number | null;
  streakPiso: number | null;
  badges?: Partial<Record<"hoje" | "tarefas" | "revisao", number>>;
};

const CHAVE = "poliglota-sidebar";

/**
 * O estado da barra vive no <html>, escrito pelo script inline antes do
 * primeiro frame. `useSyncExternalStore` lê de lá em vez de duplicar em
 * estado do React — duplicar era o que fazia a barra piscar larga.
 */
function assinar(avisar: () => void) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-sidebar"],
  });
  return () => observador.disconnect();
}

const lerDoDom = () => document.documentElement.getAttribute("data-sidebar") === "fechada";
/** No servidor a barra é sempre a larga; o script corrige antes de pintar. */
const lerNoServidor = () => false;

export function Sidebar({ marchaAtiva, streakRegistro, streakPiso, badges }: Props) {
  const rota = usePathname();
  const fechada = useSyncExternalStore(assinar, lerDoDom, lerNoServidor);

  function alternar() {
    const nova = !fechada;
    if (nova) document.documentElement.setAttribute("data-sidebar", "fechada");
    else document.documentElement.removeAttribute("data-sidebar");

    try {
      localStorage.setItem(CHAVE, nova ? "fechada" : "aberta");
    } catch {
      // Armazenamento bloqueado: alterna nesta sessão e volta ao padrão na
      // próxima. Melhor que não alternar.
    }
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-20 hidden w-[var(--largura-sidebar)] flex-col bg-sidebar-bg p-3 transition-[width] duration-200 md:flex"
      data-fechada={fechada || undefined}
    >
      <div className={cn("mb-5 flex items-center", fechada ? "justify-center" : "gap-2 pl-1")}>
        <Link
          href="/hoje"
          title="Poliglota"
          className="flex min-w-0 items-center gap-3 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-lime-500 text-h3 font-bold text-[#171A15]">
            P
          </span>
          {!fechada ? (
            <span className="min-w-0">
              <span className="block text-h3 leading-tight text-white">Poliglota</span>
              <span className="block truncate text-rotulo uppercase text-sidebar-texto">
                estudos de idiomas
              </span>
            </span>
          ) : null}
        </Link>

        {!fechada ? (
          <button
            type="button"
            onClick={alternar}
            aria-label="Minimizar barra lateral"
            title="Minimizar barra lateral"
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-sidebar-texto outline-none transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      {fechada ? (
        <button
          type="button"
          onClick={alternar}
          aria-label="Expandir barra lateral"
          title="Expandir barra lateral"
          className="mb-3 grid h-9 w-full place-items-center rounded-full text-sidebar-texto outline-none transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      ) : null}

      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAVEGACAO.map((item) => {
          const ativo = rota === item.href || rota.startsWith(`${item.href}/`);
          const Icone = item.icone;
          const contador = item.badge ? badges?.[item.badge] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              title={fechada ? item.rotulo : undefined}
              className={cn(
                "relative flex h-9 items-center rounded-full text-corpo outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-lime-500",
                fechada ? "justify-center px-0" : "gap-3 px-3",
                ativo
                  ? "bg-sidebar-ativo font-semibold text-sidebar-texto-ativo"
                  : "text-sidebar-texto hover:bg-sidebar-hover",
              )}
            >
              <Icone className="size-[18px] shrink-0" strokeWidth={1.75} />
              {!fechada ? (
                <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
              ) : null}
              {contador ? (
                <span
                  className={cn(
                    "grid place-items-center rounded-full bg-perigo font-bold text-white",
                    // Minimizada, o número vira um selo no canto do ícone.
                    fechada
                      ? "absolute right-2 top-1 size-4 text-[10px]"
                      : "size-5 shrink-0 text-[11px]",
                  )}
                >
                  {contador}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-sidebar-hover pt-4">
        {!fechada ? (
          <p className="mb-2 text-rotulo uppercase text-sidebar-texto">Marcha</p>
        ) : null}
        <div className={cn("mb-3 flex gap-1", fechada && "flex-col")}>
          {([1, 2, 3] as const).map((n) => (
            <span
              key={n}
              title={ROTULO_MARCHA[n]}
              className={cn(
                "rounded-full py-1 text-center text-pequeno font-semibold",
                fechada ? "w-full" : "flex-1",
                n === marchaAtiva
                  ? "bg-sidebar-ativo text-sidebar-texto-ativo"
                  : "bg-sidebar-hover text-sidebar-texto",
              )}
            >
              {fechada && n !== marchaAtiva ? "·" : `M${n}`}
            </span>
          ))}
        </div>
        <p
          title={`${streakRegistro ?? 0} dias seguidos com registro`}
          className={cn(
            "font-semibold text-white tabular",
            fechada ? "text-center text-pequeno" : "text-corpo",
          )}
        >
          {streakRegistro === null
            ? "—"
            : fechada
              ? streakRegistro
              : `${streakRegistro} ${streakRegistro === 1 ? "dia" : "dias"}`}
        </p>
        {!fechada ? (
          <p className="text-pequeno text-sidebar-texto tabular">
            {streakPiso === null ? "sequência na fase 1" : `piso ${streakPiso}`}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
