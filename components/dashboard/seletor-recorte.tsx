"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Recorte } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";

const RECORTES: { valor: Recorte; rotulo: string; tecla: string }[] = [
  { valor: "semana", rotulo: "Semana", tecla: "s" },
  { valor: "mes", rotulo: "Mês", tecla: "m" },
  { valor: "ano", rotulo: "Ano", tecla: "a" },
];

type Props = {
  recorte: Recorte;
  rotuloPeriodo: string;
  anterior: string;
  proximo: string | null;
};

/** Uma linha de filtro acima de tudo que ela controla. O estado mora na URL. */
export function SeletorRecorte({ recorte, rotuloPeriodo, anterior, proximo }: Props) {
  const router = useRouter();
  const href = (r: Recorte, ref?: string) =>
    `/dashboard?recorte=${r}${ref ? `&ref=${ref}` : ""}`;

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const alvo = e.target;
      if (alvo instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)) {
        return;
      }
      const atalho = RECORTES.find((r) => r.tecla === e.key.toLowerCase());
      if (atalho) {
        e.preventDefault();
        router.push(href(atalho.valor));
        return;
      }
      if (e.key === "ArrowLeft") router.push(href(recorte, anterior));
      if (e.key === "ArrowRight" && proximo) router.push(href(recorte, proximo));
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [router, recorte, anterior, proximo]);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-full bg-superficie-2 p-1">
        {RECORTES.map((r) => (
          <Link
            key={r.valor}
            href={href(r.valor)}
            aria-current={r.valor === recorte ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-pequeno outline-none transition-colors focus-visible:ring-2 focus-visible:ring-lime-500",
              r.valor === recorte
                ? "bg-texto font-medium text-fundo"
                : "text-texto-2 hover:text-texto",
            )}
          >
            {r.rotulo}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Link
          href={href(recorte, anterior)}
          aria-label="Período anterior"
          className="grid size-8 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:text-texto focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <span className="min-w-[9rem] text-center text-corpo font-medium text-texto">
          {rotuloPeriodo}
        </span>
        {proximo ? (
          <Link
            href={href(recorte, proximo)}
            aria-label="Próximo período"
            className="grid size-8 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:text-texto focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <span className="grid size-8 place-items-center rounded-full border border-borda text-texto-3">
            <ChevronRight className="size-4" />
          </span>
        )}
      </div>

      <span className="text-pequeno text-texto-3">S · M · A trocam o recorte</span>
    </div>
  );
}
