"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { alternarRevisao } from "@/lib/actions/flashcards";
import {
  excluirSessao,
  registrarAudioGrupo,
  registrarUmMinuto,
} from "@/lib/actions/sessoes";
import type { AcaoRegra, RegraAvaliada } from "@/lib/domain/regras";
import type { EstadoSemaforo } from "@/lib/domain/tipos";
import { cn } from "@/lib/utils";

const CORES: Record<EstadoSemaforo, { ponto: string; texto: string }> = {
  vermelho: { ponto: "bg-perigo", texto: "text-perigo" },
  amarelo: { ponto: "bg-atencao", texto: "text-atencao" },
  verde: { ponto: "bg-sucesso", texto: "text-sucesso" },
  cinza: { ponto: "bg-neutro", texto: "text-texto-3" },
};

type Props = {
  regras: RegraAvaliada[];
  hoje: string;
  idiomaFocoId: string;
};

/** RN-307. Vermelhas primeiro; toda pastilha em risco carrega a ação que resolve hoje. */
export function SemaforoRegras({ regras, hoje, idiomaFocoId }: Props) {
  const [aberta, setAberta] = useState<number | null>(null);
  const [, iniciar] = useTransition();

  function executar(acao: AcaoRegra) {
    iniciar(async () => {
      if (acao === "marcar_revisao") {
        const r = await alternarRevisao(idiomaFocoId, hoje);
        toast[r.ok ? "success" : "error"](r.ok ? "Revisão marcada." : (r.erro ?? "Falhou."));
        return;
      }
      if (acao === "agendar_clube") {
        toast.info("Agendamento de clube entra com a tela de Tarefas.");
        return;
      }

      const r =
        acao === "registrar_um_minuto"
          ? await registrarUmMinuto(idiomaFocoId)
          : await registrarAudioGrupo(idiomaFocoId);

      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success(
        acao === "registrar_um_minuto" ? "1 minuto de fala registrado." : "Áudio do grupo registrado.",
        {
          duration: 30_000,
          action: { label: "Desfazer", onClick: () => void excluirSessao(r.id) },
        },
      );
    });
  }

  return (
    <section aria-labelledby="regras-titulo">
      <h2 id="regras-titulo" className="mb-3 text-h2 text-texto">
        As seis regras
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {regras.map((regra) => {
          const cor = CORES[regra.estado];
          const expandida = aberta === regra.numero;
          return (
            <div
              key={regra.numero}
              className="rounded-[10px] bg-superficie-2 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span aria-hidden className={cn("size-2 shrink-0 rounded-full", cor.ponto)} />
                <button
                  type="button"
                  onClick={() => setAberta(expandida ? null : regra.numero)}
                  aria-expanded={expandida}
                  className="flex-1 truncate text-left text-pequeno text-texto outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                >
                  <span className="tabular">{regra.numero}</span> · {regra.curto}
                </button>
                {regra.acao && regra.rotuloAcao ? (
                  <button
                    type="button"
                    onClick={() => executar(regra.acao as AcaoRegra)}
                    className={cn(
                      "shrink-0 text-pequeno font-semibold underline underline-offset-2",
                      cor.texto,
                    )}
                  >
                    {regra.rotuloAcao}
                  </button>
                ) : null}
              </div>
              {expandida ? (
                <p className="mt-2 border-t border-borda pt-2 text-pequeno text-texto-2">
                  <span className="block font-medium text-texto">{regra.titulo}</span>
                  {regra.mensagem}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
