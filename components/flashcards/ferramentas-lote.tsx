"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { checarLoteDoDia, registrarCriacaoDeLote } from "@/lib/actions/flashcards";
import { separarItens, type Aviso } from "@/lib/domain/interferencia";
import type { IdiomaSlug } from "@/lib/domain/tipos";
import type { IdiomaResumo } from "@/lib/queries/hoje";

type Props = {
  idiomas: (IdiomaResumo & { slug: string })[];
  hoje: string;
  minimoItens: number;
};

function ehSlug(v: string): v is IdiomaSlug {
  return v === "ingles" || v === "espanhol" || v === "frances";
}

/**
 * RN-405 e RN-406. O cronômetro do lote e a checagem de interferência.
 * A lista colada NÃO é salva: sai da memória ao trocar de tela (RN-409).
 */
export function FerramentasDoLote({ idiomas, hoje, minimoItens }: Props) {
  const [idiomaId, setIdiomaId] = useState(idiomas[0]?.id ?? "");
  const idioma = idiomas.find((i) => i.id === idiomaId);
  const slug = idioma && ehSlug(idioma.slug) ? idioma.slug : "ingles";

  // --- cronômetro ---------------------------------------------------------
  const inicio = useRef<number | null>(null);
  const [decorrido, setDecorrido] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [palavras, setPalavras] = useState(10);
  const [resultado, setResultado] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  useEffect(() => {
    if (!rodando) return;
    const id = window.setInterval(() => {
      if (inicio.current !== null) setDecorrido(Math.floor((Date.now() - inicio.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [rodando]);

  function comecar() {
    inicio.current = Date.now();
    setDecorrido(0);
    setResultado(null);
    setRodando(true);
  }

  function parar() {
    setRodando(false);
    const minutos = Math.max(1, Math.round(decorrido / 60));
    iniciar(async () => {
      const r = await registrarCriacaoDeLote({ idiomaId, data: hoje, minutos, palavras });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      const texto = `${palavras} palavras em ${minutos} min — ${r.minPorPalavra?.toFixed(1).replace(".", ",")} min/palavra · ${r.faixa}`;
      setResultado(texto);
      toast.success(texto);
    });
  }

  const mm = String(Math.floor(decorrido / 60)).padStart(2, "0");
  const ss = String(decorrido % 60).padStart(2, "0");

  // --- checagem -----------------------------------------------------------
  const [texto, setTexto] = useState("");
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [checando, iniciarChecagem] = useTransition();
  const itens = separarItens(texto);

  function checar() {
    iniciarChecagem(async () => {
      const r = await checarLoteDoDia({ idiomaId, data: hoje, slug, texto });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para checar.");
        return;
      }
      setAvisos(r.avisos);
    });
  }

  return (
    <div className="space-y-6">
      <GrupoDeChips
        legenda="Idioma do lote"
        valor={idiomaId}
        onChange={setIdiomaId}
        opcoes={idiomas.map((i) => ({ valor: i.id, rotulo: i.nome, prefixo: i.bandeira }))}
      />

      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <h2 className="text-h2 text-texto">Cronômetro do lote</h2>
        <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
          Velocidade A é 2 min por palavra; B é 1 min
        </p>

        <p className="text-display tabular text-texto">
          {mm}:{ss}
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="palavras-lote" className="mb-2 block text-rotulo uppercase text-texto-3">
              Palavras do lote
            </label>
            <input
              id="palavras-lote"
              type="number"
              min={1}
              max={500}
              value={palavras}
              onChange={(e) => setPalavras(Math.max(1, Number(e.target.value)))}
              className="h-10 w-24 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            />
          </div>
          {rodando ? (
            <Button type="button" onClick={parar} disabled={salvando} className="h-10">
              {salvando ? "Salvando…" : "Parar e registrar"}
            </Button>
          ) : (
            <Button type="button" onClick={comecar} className="h-10">
              Iniciar
            </Button>
          )}
        </div>

        {resultado ? (
          <p className="mt-4 rounded-[10px] bg-sucesso-bg px-3 py-2 text-pequeno text-sucesso">
            {resultado}
          </p>
        ) : null}
      </section>

      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <h2 className="text-h2 text-texto">Checagem de interferência</h2>
        <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
          Cole a lista do dia antes de criar os cartões
        </p>

        <textarea
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAvisos(null);
          }}
          rows={6}
          placeholder={"uma palavra por linha\nou separadas por vírgula"}
          className="w-full rounded-[10px] border border-borda-forte bg-superficie px-3 py-2 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={checar}
            disabled={itens.length < 3 || checando}
            className="h-9"
          >
            {checando ? "Checando…" : "Checar lote"}
          </Button>
          <span className="text-pequeno text-texto-2 tabular">
            {itens.length} {itens.length === 1 ? "item" : "itens"}
          </span>
          {itens.length < 3 ? (
            <span className="text-pequeno text-texto-3">Cole pelo menos 3 palavras.</span>
          ) : null}
          {itens.length >= minimoItens ? null : null}
        </div>

        {avisos !== null ? (
          avisos.length === 0 ? (
            <p className="mt-4 rounded-[10px] bg-sucesso-bg px-3 py-2 text-corpo text-sucesso">
              Lote limpo. Pode criar.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {avisos.map((aviso) => (
                <li
                  key={aviso.tipo}
                  className="rounded-[10px] border-l-[3px] border-atencao bg-atencao-bg px-3 py-2"
                >
                  <p className="text-pequeno font-medium text-texto">{aviso.mensagem}</p>
                  {aviso.itens.length > 0 ? (
                    <p className="mt-1 text-pequeno text-texto-2">{aviso.itens.join(" · ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        ) : null}

        <p className="mt-4 border-t border-borda pt-3 text-pequeno text-texto-3">
          Esta lista não é salva. Ela não vira cartão.
        </p>
      </section>
    </div>
  );
}
