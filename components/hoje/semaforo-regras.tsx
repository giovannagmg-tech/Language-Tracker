"use client";

import { useState, useTransition } from "react";
import { somaDias } from "@/lib/domain/datas";
import { toast } from "sonner";
import { alternarRevisao } from "@/lib/actions/flashcards";
import { agendarClube } from "@/lib/actions/tarefas-manuais";
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
  // A data do clube vem dela: "compromisso marcado" perde o sentido se o app
  // chutar o dia. O padrão é daqui a uma semana, só para não começar vazio.
  const [dataClube, setDataClube] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function marcarClube(data: string) {
    iniciar(async () => {
      const r = await agendarClube(data, idiomaFocoId || null);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para agendar.");
        return;
      }
      setDataClube(null);
      toast.success(`Clube marcado para ${data.split("-").reverse().join("/")}.`);
    });
  }

  function executar(acao: AcaoRegra) {
    iniciar(async () => {
      if (acao === "marcar_revisao") {
        const r = await alternarRevisao(idiomaFocoId, hoje);
        toast[r.ok ? "success" : "error"](r.ok ? "Revisão marcada." : (r.erro ?? "Falhou."));
        return;
      }
      if (acao === "agendar_clube") {
        setDataClube(somaDias(hoje, 7));
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
      <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {regras.map((regra) => {
          const cor = CORES[regra.estado];
          const expandida = aberta === regra.numero;
          return (
            <div
              key={regra.numero}
              className="flex flex-col rounded-[10px] bg-superficie-2 p-3"
            >
              <button
                type="button"
                onClick={() => setAberta(expandida ? null : regra.numero)}
                aria-expanded={expandida}
                className="flex items-start gap-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
              >
                <span
                  aria-hidden
                  className={cn("mt-1.5 size-2 shrink-0 rounded-full", cor.ponto)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-rotulo uppercase text-texto-3">
                    Regra <span className="tabular">{regra.numero}</span>
                  </span>
                  <span className="mt-0.5 block text-pequeno text-texto">{regra.titulo}</span>
                </span>
              </button>

              {expandida ? (
                <p className="mt-2 border-t border-borda pt-2 text-pequeno text-texto-2">
                  {regra.mensagem}
                </p>
              ) : null}

              {/* Marcar clube pede uma data — é o que separa compromisso de
                  intenção. Some das outras regras, que resolvem num clique. */}
              {regra.acao === "agendar_clube" && dataClube !== null ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="date"
                    value={dataClube}
                    min={hoje}
                    autoFocus
                    aria-label="Data do clube de conversação"
                    onChange={(e) => setDataClube(e.target.value)}
                    className="h-8 w-full rounded-full border border-borda-forte bg-superficie px-3 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => marcarClube(dataClube)}
                      className="h-8 flex-1 rounded-full bg-texto px-3 text-pequeno font-semibold text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2"
                    >
                      Marcar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDataClube(null)}
                      className="h-8 px-2 text-pequeno text-texto-2 outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                    >
                      cancelar
                    </button>
                  </div>
                </div>
              ) : regra.acao && regra.rotuloAcao ? (
                <button
                  type="button"
                  onClick={() => executar(regra.acao as AcaoRegra)}
                  className={cn(
                    "mt-3 h-8 w-full rounded-full border border-current px-3 text-pequeno font-semibold outline-none",
                    "focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2",
                    cor.texto,
                  )}
                >
                  {regra.rotuloAcao}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
