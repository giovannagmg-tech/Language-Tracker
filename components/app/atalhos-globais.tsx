"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { alternarRevisao } from "@/lib/actions/flashcards";
import { trocarMarcha } from "@/lib/actions/marcha";
import { excluirSessao, registrarUmMinuto } from "@/lib/actions/sessoes";
import type { Marcha } from "@/lib/domain/tipos";

const ROTAS: Record<string, string> = {
  d: "/dashboard",
  h: "/hoje",
  r: "/registro",
  t: "/tarefas",
  f: "/flashcards",
  m: "/metas",
  v: "/revisao",
  a: "/materiais",
  c: "/conquistas",
};

type Props = { hoje: string; idiomaFocoId: string };

/**
 * Atalhos globais (docs/04, 0.3). Nada dispara enquanto o foco está num campo
 * de texto — a usuária escreve nota sem registrar sessão sem querer.
 */
export function AtalhosGlobais({ hoje, idiomaFocoId }: Props) {
  const router = useRouter();
  const [painel, setPainel] = useState(false);

  useEffect(() => {
    let esperandoRota = false;

    function editando(alvo: EventTarget | null): boolean {
      if (!(alvo instanceof HTMLElement)) return false;
      return (
        alvo.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName)
      );
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (editando(evento.target)) return;

      const tecla = evento.key.toLowerCase();

      if (esperandoRota) {
        esperandoRota = false;
        const rota = ROTAS[tecla];
        if (rota) {
          evento.preventDefault();
          router.push(rota);
        }
        return;
      }

      switch (tecla) {
        case "g":
          esperandoRota = true;
          window.setTimeout(() => {
            esperandoRota = false;
          }, 1200);
          return;
        case "?":
          evento.preventDefault();
          setPainel((v) => !v);
          return;
        case "escape":
          setPainel(false);
          return;
        case "n":
          evento.preventDefault();
          router.push("/registro");
          return;
        case "f":
          evento.preventDefault();
          void alternarRevisao(idiomaFocoId, hoje).then((r) =>
            toast[r.ok ? "success" : "error"](
              r.ok ? (r.revisou ? "Revisão marcada." : "Revisão desmarcada.") : (r.erro ?? "Falhou."),
            ),
          );
          return;
        case "v":
          evento.preventDefault();
          void registrarUmMinuto(idiomaFocoId).then((r) => {
            if (!r.ok) {
              toast.error(r.erro);
              return;
            }
            toast.success("1 minuto de fala registrado.", {
              duration: 30_000,
              action: { label: "Desfazer", onClick: () => void excluirSessao(r.id) },
            });
          });
          return;
        case "1":
        case "2":
        case "3":
          evento.preventDefault();
          void trocarMarcha(Number(tecla) as Marcha).then((r) =>
            toast[r.ok ? "success" : "error"](r.mensagem),
          );
          return;
        default:
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [router, hoje, idiomaFocoId]);

  if (!painel) return null;

  return (
    <div
      role="dialog"
      aria-label="Atalhos de teclado"
      className="fixed bottom-6 right-6 z-50 w-72 rounded-card border border-borda bg-superficie p-5 shadow-popover"
    >
      <p className="mb-3 text-h3 text-texto">Atalhos</p>
      <dl className="space-y-1.5 text-pequeno">
        {[
          ["N", "novo registro"],
          ["F", "marcar flashcards de hoje"],
          ["V", "registrar 1 minuto de fala"],
          ["1 2 3", "trocar de marcha"],
          ["G depois D/H/R/T/F/M/V/A/C", "navegar"],
          ["Ctrl+Enter", "salvar no formulário"],
          ["?", "abre e fecha esta lista"],
        ].map(([tecla, oque]) => (
          <div key={tecla} className="flex justify-between gap-4">
            <dt className="font-mono text-texto">{tecla}</dt>
            <dd className="text-right text-texto-2">{oque}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
