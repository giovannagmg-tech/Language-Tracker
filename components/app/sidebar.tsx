"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVEGACAO } from "@/lib/navegacao";
import { ROTULO_MARCHA, type Marcha } from "@/lib/domain/tipos";
import { cn } from "@/lib/utils";

type Props = {
  marchaAtiva: Marcha;
  streakRegistro: number | null;
  streakPiso: number | null;
  badges?: Partial<Record<"hoje" | "tarefas" | "revisao", number>>;
};

export function Sidebar({ marchaAtiva, streakRegistro, streakPiso, badges }: Props) {
  const rota = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[210px] flex-col bg-sidebar-bg p-4 md:flex">
      <Link href="/hoje" className="mb-6 flex items-center gap-3 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
        <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-lime-500 text-h3 font-bold text-[#171A15]">
          P
        </div>
        <div className="min-w-0">
          <p className="text-h3 leading-tight text-white">Poliglota</p>
          <p className="truncate text-rotulo uppercase text-sidebar-texto">
            estudos de idiomas
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAVEGACAO.map((item) => {
          const ativo = rota === item.href || rota.startsWith(`${item.href}/`);
          const Icone = item.icone;
          const contador = item.badge ? badges?.[item.badge] : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-full px-3 text-corpo outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-lime-500",
                ativo
                  ? "bg-sidebar-ativo font-semibold text-sidebar-texto-ativo"
                  : "text-sidebar-texto hover:bg-sidebar-hover",
              )}
            >
              <Icone className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>
              {contador ? (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-perigo text-[11px] font-bold text-white">
                  {contador}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-sidebar-hover pt-4">
        <p className="mb-2 text-rotulo uppercase text-sidebar-texto">Marcha</p>
        <div className="mb-3 flex gap-1">
          {([1, 2, 3] as const).map((n) => (
            <span
              key={n}
              title={ROTULO_MARCHA[n]}
              className={cn(
                "flex-1 rounded-full py-1 text-center text-pequeno font-semibold",
                n === marchaAtiva
                  ? "bg-sidebar-ativo text-sidebar-texto-ativo"
                  : "bg-sidebar-hover text-sidebar-texto",
              )}
            >
              M{n}
            </span>
          ))}
        </div>
        <p className="text-corpo font-semibold text-white tabular">
          {streakRegistro === null ? "—" : `${streakRegistro} ${streakRegistro === 1 ? "dia" : "dias"}`}
        </p>
        <p className="text-pequeno text-sidebar-texto tabular">
          {streakPiso === null ? "sequência na fase 1" : `piso ${streakPiso}`}
        </p>
      </div>
    </aside>
  );
}
