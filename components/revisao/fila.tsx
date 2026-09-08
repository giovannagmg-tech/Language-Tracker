"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { registrarAtivacao } from "@/lib/actions/flashcards";
import { marcarPontoErrado, registrarFrasesDoPonto } from "@/lib/actions/revisao";
import { avancarTarefa } from "@/lib/actions/tarefas";
import { ROTULO_TIPO, textoDeAtraso, type ItemRevisao } from "@/lib/domain/revisao";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

type Props = {
  itens: ItemRevisao[];
  idiomas: IdiomaResumo[];
  hoje: string;
  resolvidosNaSemana: number;
};

const ROTULO_ACAO: Record<ItemRevisao["acao"], string> = {
  frases: "Frases feitas",
  ativar: "Ativei",
  sessao: "Registrar",
  audio: "Mandei o áudio",
  autoavaliar: "Autoavaliar",
  marcar_gravado: "Marcar como gravada",
};

/** RN-1103. Ordenada por urgência. Cartões devidos não aparecem aqui. */
export function FilaDeRevisao({ itens, idiomas, hoje, resolvidosNaSemana }: Props) {
  const [, iniciar] = useTransition();
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  function resolver(item: ItemRevisao) {
    const quantidade = quantidades[item.id] ?? Math.max(1, item.quantidadeExigida - item.quantidadeFeita);

    iniciar(async () => {
      if (item.tipo === "ponto_gramatical") {
        const r = await registrarFrasesDoPonto(item.id, quantidade);
        toast[r.ok ? "success" : "error"](
          r.ok ? (r.concluido ? "Ponto resolvido." : "Progresso anotado.") : (r.erro ?? "Falhou."),
        );
        return;
      }

      if (item.id.startsWith("vocab-")) {
        const idiomaId = item.id.replace("vocab-", "");
        const r = await registrarAtivacao(idiomaId, quantidade);
        toast[r.ok ? "success" : "error"](r.ok ? "Palavras ativadas." : (r.erro ?? "Falhou."));
        return;
      }

      const r = await avancarTarefa(item.id, quantidade);
      toast[r.ok ? "success" : "error"](
        r.ok ? (r.concluida ? "Resolvido." : "Progresso anotado.") : (r.erro ?? "Falhou."),
      );
    });
  }

  if (itens.length === 0) {
    return (
      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <p className="text-corpo text-texto">Nada em dívida. Raro e bom.</p>
        <p className="mt-1 text-pequeno text-texto-2">
          {resolvidosNaSemana > 0
            ? `${resolvidosNaSemana} ${resolvidosNaSemana === 1 ? "item resolvido" : "itens resolvidos"} nos últimos sete dias.`
            : "Nada resolvido nos últimos sete dias também."}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <ul className="divide-y divide-borda">
        {itens.map((item) => {
          const idioma = idiomas.find((i) => i.id === item.idiomaId);
          const atrasado = item.data < hoje;
          const parcial = item.quantidadeExigida > 1;
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="w-40 shrink-0 text-rotulo uppercase text-texto-3">
                {ROTULO_TIPO[item.tipo]}
              </span>
              <span className="min-w-0 flex-1 text-corpo text-texto">{item.titulo}</span>
              {idioma ? <span className="shrink-0 text-pequeno">{idioma.bandeira}</span> : null}
              <span
                className={cn(
                  "w-32 shrink-0 text-right text-pequeno",
                  atrasado ? "font-semibold text-perigo" : "text-texto-3",
                )}
              >
                {textoDeAtraso(item, hoje)}
              </span>
              {parcial ? (
                <input
                  type="number"
                  min={1}
                  max={item.quantidadeExigida}
                  aria-label={`Quantidade para ${item.titulo}`}
                  value={quantidades[item.id] ?? item.quantidadeExigida - item.quantidadeFeita}
                  onChange={(e) =>
                    setQuantidades((q) => ({ ...q, [item.id]: Math.max(1, Number(e.target.value)) }))
                  }
                  className="h-9 w-16 shrink-0 rounded-[10px] border border-borda-forte bg-superficie px-2 text-right text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                />
              ) : null}
              <button
                type="button"
                onClick={() => resolver(item)}
                className="shrink-0 rounded-full bg-texto px-3 py-1.5 text-pequeno font-medium text-fundo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
              >
                {ROTULO_ACAO[item.acao]}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ListaDePontos({
  pontos,
  idiomas,
}: {
  pontos: { id: string; idiomaId: string; titulo: string; estado: string; estudadoEm: string }[];
  idiomas: IdiomaResumo[];
}) {
  const [, iniciar] = useTransition();

  function alternar(id: string, errado: boolean) {
    iniciar(async () => {
      const r = await marcarPontoErrado(id, errado);
      toast[r.ok ? "success" : "error"](
        r.ok
          ? errado
            ? "Anotado. Duas frases novas em voz alta até amanhã."
            : "Ponto liberado."
          : (r.erro ?? "Falhou."),
      );
    });
  }

  if (pontos.length === 0) {
    return (
      <p className="text-pequeno text-texto-2">
        Nenhum ponto gramatical cadastrado. O deck de gramática vive fora do app; aqui você só
        marca o que errou na revisão.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-borda">
      {pontos.map((p) => {
        const idioma = idiomas.find((i) => i.id === p.idiomaId);
        const errado = p.estado === "errei";
        return (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <span className="min-w-0 flex-1 text-corpo text-texto">{p.titulo}</span>
            {idioma ? <span className="shrink-0 text-pequeno">{idioma.bandeira}</span> : null}
            <button
              type="button"
              onClick={() => alternar(p.id, !errado)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                errado
                  ? "border-perigo bg-perigo-bg font-medium text-perigo"
                  : "border-borda-forte text-texto-2",
              )}
            >
              {errado ? "errei na revisão" : "marcar erro"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
