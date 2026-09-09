"use client";

import { useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analisarImportacao, confirmarImportacao, type Analise } from "@/lib/actions/toggl";
import {
  MAXIMO_DE_LINHAS,
  colunasObrigatoriasFaltando,
  detectarSeparador,
  lerLinhas,
  type Classificacao,
  type LinhaClassificada,
} from "@/lib/domain/toggl";
import { ROTULO_ATIVIDADE, type Atividade } from "@/lib/domain/tipos";
import { fmtDataCurta, fmtHoras } from "@/lib/formatadores";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

type Passo = "arquivo" | "previa" | "pronto";

const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  nova: "nova",
  duplicada: "duplicada",
  conflito: "conflito",
  revisar: "revisar",
  invalida: "inválida",
};

const COR_CLASSIFICACAO: Record<Classificacao, string> = {
  nova: "text-sucesso",
  duplicada: "text-texto-3",
  conflito: "text-atencao",
  revisar: "text-atencao",
  invalida: "text-perigo",
};

type Ajuste = { idiomaId?: string; atividade?: Atividade; substituir?: boolean };

/**
 * RN-1005. Três passos: arquivo → pré-visualização → confirmar.
 * O CSV é lido no navegador; nada sai da máquina antes da confirmação.
 */
export function AssistenteDeImportacao({ idiomas }: { idiomas: IdiomaResumo[] }) {
  const [passo, setPasso] = useState<Passo>("arquivo");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [ajustes, setAjustes] = useState<Record<number, Ajuste>>({});
  const [filtro, setFiltro] = useState<Classificacao | "todas">("todas");
  const [processando, iniciar] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  function receberArquivo(arquivo: File) {
    setNomeArquivo(arquivo.name);

    const leitor = new FileReader();
    leitor.onerror = () => toast.error("Não deu para ler o arquivo.");
    leitor.onload = () => {
      const texto = String(leitor.result ?? "");

      const resultado = Papa.parse<Record<string, string>>(texto, {
        header: true,
        skipEmptyLines: "greedy",
        delimiter: detectarSeparador(texto),
        transformHeader: (h: string) => h.trim(),
      });

      const colunas = resultado.meta.fields ?? [];
      const faltando = colunasObrigatoriasFaltando(colunas);
      if (faltando.length > 0) {
        toast.error(`Faltam colunas obrigatórias: ${faltando.join(", ")}.`);
        return;
      }

      const linhas = lerLinhas(resultado.data);
      if (linhas.length === 0) {
        toast.error("O arquivo não tem nenhuma linha de dados.");
        return;
      }
      if (linhas.length > MAXIMO_DE_LINHAS) {
        toast.error(`O arquivo tem ${linhas.length} linhas; o máximo é ${MAXIMO_DE_LINHAS}.`);
        return;
      }

      iniciar(async () => {
        const r = await analisarImportacao(linhas);
        if (!r.ok) {
          toast.error(r.erro ?? "Não deu para analisar.");
          return;
        }
        setAnalise(r);
        setAjustes({});
        setPasso("previa");
      });
    };
    leitor.readAsText(arquivo, "utf-8");
  }

  function ajustar(numero: number, mudanca: Ajuste) {
    setAjustes((a) => ({ ...a, [numero]: { ...a[numero], ...mudanca } }));
  }

  function linhaFinal(l: LinhaClassificada) {
    const ajuste = ajustes[l.linha.numero] ?? {};
    return {
      ...l,
      idiomaId: ajuste.idiomaId ?? l.idiomaId,
      atividade: ajuste.atividade ?? l.atividade,
      substituir: ajuste.substituir ?? false,
    };
  }

  function confirmar() {
    if (!analise) return;

    const importaveis = analise.linhas
      .filter((l) => l.classificacao !== "duplicada" && l.classificacao !== "invalida")
      .map(linhaFinal)
      .filter((l) => l.classificacao !== "conflito" || l.substituir);

    const semIdioma = importaveis.filter((l) => l.idiomaId === null);
    if (semIdioma.length > 0) {
      toast.error(`${semIdioma.length} linhas ainda estão sem idioma. Escolha antes de confirmar.`);
      setFiltro("revisar");
      return;
    }

    iniciar(async () => {
      const r = await confirmarImportacao(
        nomeArquivo,
        importaveis.map((l) => ({
          data: l.linha.data,
          horaInicio: l.linha.horaInicio,
          duracaoMin: Math.min(480, Math.max(1, l.linha.duracaoMin)),
          idiomaId: l.idiomaId,
          atividade: l.atividade,
          pilar: l.pilar,
          tempo: l.tempo,
          categoria: l.categoria,
          producao: l.producao,
          chave: l.chave,
          nota: l.linha.description || null,
          substituirSessaoId: l.substituir ? (l.conflitoCom ?? null) : null,
        })),
        {
          duplicadas: analise.resumo.duplicadas,
          conflitos: analise.resumo.conflitos,
          revisadas: Object.keys(ajustes).length,
        },
      );

      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para importar.");
        return;
      }

      toast.success(
        `${r.importadas} sessões importadas${r.substituidas > 0 ? `, ${r.substituidas} substituídas` : ""}.`,
      );
      setPasso("pronto");
    });
  }

  // -------------------------------------------------------------------------

  if (passo === "arquivo") {
    return (
      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <h2 className="text-h2 text-texto">1. Arquivo</h2>
        <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
          Relatório detalhado do Toggl, em CSV. O arquivo é lido aqui no navegador.
        </p>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const arquivo = e.dataTransfer.files[0];
            if (arquivo) receberArquivo(arquivo);
          }}
          className="grid place-items-center rounded-[10px] border-2 border-dashed border-borda-forte px-6 py-10 text-center"
        >
          <p className="text-corpo text-texto-2">Arraste o CSV aqui</p>
          <p className="my-2 text-pequeno text-texto-3">ou</p>
          <Button type="button" onClick={() => input.current?.click()} disabled={processando} className="h-9">
            {processando ? "Lendo…" : "Escolher arquivo"}
          </Button>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) receberArquivo(arquivo);
            }}
          />
        </div>

        <details className="mt-5">
          <summary className="cursor-pointer text-pequeno text-texto-2">
            Como exportar do Toggl
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-pequeno text-texto-2">
            <li>No Toggl Track, abra Reports → Detailed.</li>
            <li>Escolha o período e clique em Export → Download CSV.</li>
            <li>Traga o arquivo para cá sem abrir no Excel — ele costuma estragar as datas.</li>
          </ol>
        </details>
      </section>
    );
  }

  if (passo === "pronto" || !analise) {
    return (
      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <h2 className="text-h2 text-texto">Importação concluída</h2>
        <p className="mt-2 text-corpo text-texto-2">
          O dashboard e as conquistas já foram recalculados sobre o histórico novo.
        </p>
        <Button
          type="button"
          onClick={() => {
            setPasso("arquivo");
            setAnalise(null);
          }}
          className="mt-4 h-9"
        >
          Importar outro arquivo
        </Button>
      </section>
    );
  }

  const visiveis =
    filtro === "todas" ? analise.linhas : analise.linhas.filter((l) => l.classificacao === filtro);

  const contadores: { chave: Classificacao | "todas"; rotulo: string; n: number }[] = [
    { chave: "todas", rotulo: "Todas", n: analise.resumo.total },
    { chave: "nova", rotulo: "Novas", n: analise.resumo.novas },
    { chave: "revisar", rotulo: "Precisam revisão", n: analise.resumo.revisar },
    { chave: "conflito", rotulo: "Conflitos", n: analise.resumo.conflitos },
    { chave: "duplicada", rotulo: "Duplicadas", n: analise.resumo.duplicadas },
    { chave: "invalida", rotulo: "Inválidas", n: analise.resumo.invalidas },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-h2 text-texto">2. Pré-visualização</h2>
            <p className="mt-0.5 text-pequeno text-texto-2">
              {nomeArquivo}
              {analise.resumo.intervalo
                ? ` · ${fmtDataCurta(analise.resumo.intervalo.inicio)} a ${fmtDataCurta(analise.resumo.intervalo.fim)}`
                : ""}
            </p>
          </div>
          <p className="text-pequeno text-texto-2">
            {fmtHoras(analise.resumo.minutos)} a importar
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {contadores.map((c) => (
            <button
              key={c.chave}
              type="button"
              onClick={() => setFiltro(c.chave)}
              aria-pressed={filtro === c.chave}
              className={cn(
                "rounded-full border px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                filtro === c.chave ? "border-texto bg-texto text-fundo" : "border-borda-forte text-texto-2",
              )}
            >
              {c.rotulo} <span className="tabular">{c.n}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-pequeno">
            <thead>
              <tr className="border-b border-borda">
                {["Linha", "Data", "Duração", "Projeto · descrição", "Idioma", "Atividade", "Estado"].map(
                  (h) => (
                    <th key={h} scope="col" className="py-2 text-left text-rotulo uppercase text-texto-3">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visiveis.slice(0, 300).map((l) => {
                const final = linhaFinal(l);
                const editavel = l.classificacao !== "duplicada" && l.classificacao !== "invalida";
                return (
                  <tr key={l.linha.numero} className="border-b border-borda last:border-0">
                    <td className="py-2 tabular text-texto-3">{l.linha.numero}</td>
                    <td className="py-2 tabular text-texto">
                      {l.linha.data ? fmtDataCurta(l.linha.data) : "—"}
                    </td>
                    <td className="py-2 tabular text-texto">{l.linha.duracaoMin} min</td>
                    <td className="max-w-64 truncate py-2 text-texto-2">
                      {l.linha.project}
                      {l.linha.description ? ` · ${l.linha.description}` : ""}
                    </td>
                    <td className="py-2">
                      {editavel ? (
                        <select
                          value={final.idiomaId ?? ""}
                          aria-label={`Idioma da linha ${l.linha.numero}`}
                          onChange={(e) => ajustar(l.linha.numero, { idiomaId: e.target.value })}
                          className={cn(
                            "h-8 rounded-[8px] border bg-superficie px-2 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                            final.idiomaId ? "border-borda-forte" : "border-atencao",
                          )}
                        >
                          <option value="">escolher…</option>
                          {idiomas.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nome}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-texto-3">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      {editavel ? (
                        <select
                          value={final.atividade}
                          aria-label={`Atividade da linha ${l.linha.numero}`}
                          onChange={(e) =>
                            ajustar(l.linha.numero, { atividade: e.target.value as Atividade })
                          }
                          className="h-8 rounded-[8px] border border-borda-forte bg-superficie px-2 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                        >
                          {Object.entries(ROTULO_ATIVIDADE).map(([valor, rotulo]) => (
                            <option key={valor} value={valor}>
                              {rotulo}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-texto-3">—</span>
                      )}
                    </td>
                    <td className={cn("py-2", COR_CLASSIFICACAO[l.classificacao])}>
                      {ROTULO_CLASSIFICACAO[l.classificacao]}
                      {l.classificacao === "conflito" ? (
                        <label className="ml-2 inline-flex items-center gap-1 text-texto-2">
                          <input
                            type="checkbox"
                            checked={final.substituir}
                            onChange={(e) =>
                              ajustar(l.linha.numero, { substituir: e.target.checked })
                            }
                            className="size-3.5 accent-[var(--cor-texto)]"
                          />
                          substituir
                        </label>
                      ) : null}
                      {l.classificacao === "invalida" ? (
                        <span className="ml-1 text-texto-3">{l.linha.erro}</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visiveis.length > 300 ? (
          <p className="mt-3 text-pequeno text-texto-3">
            Mostrando as 300 primeiras de {visiveis.length}. Todas serão importadas.
          </p>
        ) : null}

        <p className="mt-4 border-t border-borda pt-4 text-pequeno text-texto-2">
          Duplicadas e inválidas são ignoradas. Conflitos só entram se você marcar
          &ldquo;substituir&rdquo; — o padrão é manter o registro manual.
        </p>
      </section>

      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <h2 className="text-h2 text-texto">3. Confirmar</h2>
        <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
          O lote é gravado inteiro ou nada. Conquistas e dashboard são recalculados.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={confirmar} disabled={processando} className="h-10">
            {processando ? "Importando…" : `Importar ${analise.resumo.novas + analise.resumo.revisar} sessões`}
          </Button>
          <button
            type="button"
            onClick={() => {
              setPasso("arquivo");
              setAnalise(null);
            }}
            className="text-pequeno text-texto-2 underline underline-offset-2"
          >
            escolher outro arquivo
          </button>
        </div>
      </section>
    </div>
  );
}
