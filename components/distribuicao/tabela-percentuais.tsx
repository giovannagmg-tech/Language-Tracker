"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { salvarDistribuicao } from "@/lib/actions/distribuicao";
import {
  corDaFaixa,
  faixaDoDesvio,
  normalizarPara100,
  soma,
  somaValida,
  type ItemDistribuicao,
} from "@/lib/domain/distribuicao";
import { cn } from "@/lib/utils";

export type LinhaPercentual = {
  chave: string;
  rotulo: string;
  cor: string;
  realizado: number;
};

type Props = {
  titulo: string;
  subtitulo: string;
  dimensao: "pilar" | "idioma";
  blocoId: string | null;
  linhas: LinhaPercentual[];
  valores: ItemDistribuicao[];
};

/**
 * RN-902 e RN-904. Editar aqui é o que muda o dashboard e a meta mensal.
 * As setas alteram de 5 em 5 — mexer em percentual com o teclado precisa ser
 * mais rápido que digitar.
 */
export function TabelaPercentuais({
  titulo,
  subtitulo,
  dimensao,
  blocoId,
  linhas,
  valores,
}: Props) {
  const [itens, setItens] = useState<ItemDistribuicao[]>(valores);
  const [sujo, setSujo] = useState(false);
  const [salvando, iniciar] = useTransition();

  const total = soma(itens);
  const valido = somaValida(itens);

  function alterar(chave: string, valor: number) {
    setItens((atual) =>
      atual.map((i) => (i.chave === chave ? { ...i, percentual: Math.min(100, Math.max(0, valor)) } : i)),
    );
    setSujo(true);
  }

  function normalizar(fixa?: string) {
    setItens((atual) => normalizarPara100(atual, fixa));
    setSujo(true);
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarDistribuicao({ dimensao, blocoId, itens });
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      setItens(r.itens);
      setSujo(false);
      toast.success("Distribuição salva. Dashboard e metas atualizados.");
    });
  }

  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <div className="mb-4">
        <h2 className="text-h2 text-texto">{titulo}</h2>
        <p className="mt-0.5 text-pequeno text-texto-2">{subtitulo}</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-borda">
            <th scope="col" className="py-2 text-left text-rotulo uppercase text-texto-3">
              {dimensao === "pilar" ? "Pilar" : "Idioma"}
            </th>
            <th scope="col" className="py-2 text-right text-rotulo uppercase text-texto-3">
              Alvo
            </th>
            <th scope="col" className="py-2 text-right text-rotulo uppercase text-texto-3">
              Realizado
            </th>
            <th scope="col" className="py-2 text-right text-rotulo uppercase text-texto-3">
              Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => {
            const item = itens.find((i) => i.chave === linha.chave);
            const alvo = item?.percentual ?? 0;
            const real = Math.round(linha.realizado * 100);
            const delta = real - alvo;
            return (
              <tr key={linha.chave} className="border-b border-borda last:border-0">
                <th scope="row" className="py-2.5 text-left text-corpo font-normal text-texto">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: linha.cor }} />
                    {linha.rotulo}
                  </span>
                </th>
                <td className="py-2.5 text-right">
                  <span className="inline-flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={alvo}
                      aria-label={`Alvo de ${linha.rotulo} em porcentagem`}
                      onChange={(e) => alterar(linha.chave, Number(e.target.value))}
                      onBlur={() => normalizar(linha.chave)}
                      className="h-9 w-16 rounded-[10px] border border-borda-forte bg-superficie px-2 text-right text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                    />
                    <span className="text-pequeno text-texto-3">%</span>
                  </span>
                </td>
                <td className="py-2.5 text-right text-corpo tabular text-texto-2">{real}%</td>
                <td
                  className="py-2.5 text-right text-corpo font-medium tabular"
                  style={{ color: corDaFaixa(faixaDoDesvio(delta)) }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta} pp
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-3 text-rotulo uppercase text-texto-3">Soma</td>
            <td
              className={cn(
                "pt-3 text-right text-corpo font-semibold tabular",
                valido ? "text-texto" : "text-perigo",
              )}
            >
              {total}%
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-borda pt-4">
        <Button type="button" onClick={salvar} disabled={salvando || !sujo} className="h-9">
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
        <button
          type="button"
          onClick={() => normalizar()}
          className="text-pequeno text-texto-2 underline underline-offset-2"
        >
          Normalizar para 100%
        </button>
        {!valido ? (
          <span className="text-pequeno text-perigo">
            Falta {100 - total > 0 ? `${100 - total}` : `${total - 100}`} ponto
            {Math.abs(100 - total) === 1 ? "" : "s"} para fechar 100%.
          </span>
        ) : null}
      </div>
    </section>
  );
}
