"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LayoutDashboard, PlusCircle, RotateCcw, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/hoje", rotulo: "Hoje", icone: CalendarCheck },
  { href: "/registro", rotulo: "Registrar", icone: PlusCircle },
  { href: "/flashcards", rotulo: "Flashcards", icone: Rows3 },
  { href: "/revisao", rotulo: "Revisão", icone: RotateCcw },
  { href: "/dashboard", rotulo: "Painel", icone: LayoutDashboard },
];

/**
 * Abaixo de 768px a sidebar vira esta barra. Cinco destinos, os que ela
 * realmente abre no celular — registrar no trânsito e checar o piso.
 */
export function BarraInferior({ badgeHoje }: { badgeHoje: number }) {
  const rota = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-sidebar-hover bg-sidebar-bg pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITENS.map((item) => {
        const ativo = rota === item.href || rota.startsWith(`${item.href}/`);
        const Icone = item.icone;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 outline-none",
              "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-500",
              ativo ? "text-sidebar-ativo" : "text-sidebar-texto",
            )}
          >
            <Icone className="size-5" strokeWidth={1.75} />
            <span className="text-[10px] leading-none">{item.rotulo}</span>
            {item.href === "/hoje" && badgeHoje > 0 ? (
              <span className="absolute right-1/2 top-1.5 translate-x-4 rounded-full bg-perigo px-1.5 text-[10px] font-bold leading-4 text-white">
                {badgeHoje}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
