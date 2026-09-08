"use client";

import { useMemo, useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import {
  alternarFavorito,
  registrarAcessoRecurso,
  removerRecurso,
  salvarRecurso,
} from "@/lib/actions/acervo";
import { PILARES, ROTULO_PILAR, type Pilar } from "@/lib/domain/tipos";
import type { EstadoRecursos } from "@/lib/queries/acervo";
import { cn } from "@/lib/utils";

const TIPOS = [
  "dicionario", "colocacoes", "lista_frequencia", "canal", "podcast",
  "app", "ipa", "comunidade", "clube", "outro",
] as const;

type TipoRecurso = (typeof TIPOS)[number];

const ROTULO_TIPO: Record<TipoRecurso, string> = {
  dicionario: "Dicionário",
  colocacoes: "Colocações",
  lista_frequencia: "Lista de frequência",
  canal: "Canal",
  podcast: "Podcast",
  app: "App",
  ipa: "IPA",
  comunidade: "Comunidade",
  clube: "Clube",
  outro: "Outro",
};

export function PainelRecursos({ estado }: { estado: EstadoRecursos }) {
  const [busca, setBusca] = useState("");
  const [idiomaFiltro, setIdiomaFiltro] = useState<string | null>(null);
  const [pilarFiltro, setPilarFiltro] = useState<Pilar | null>(null);
  const [novo, setNovo] = useState(false);
  const [, iniciar] = useTransition();

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return estado.recursos
      .filter((r) => (idiomaFiltro ? r.idiomas.includes(idiomaFiltro) : true))
      .filter((r) => (pilarFiltro ? r.pilares.includes(pilarFiltro) : true))
      .filter((r) =>
        termo
          ? `${r.titulo} ${r.nota ?? ""} ${r.url}`.toLowerCase().includes(termo)
          : true,
      );
  }, [estado.recursos, busca, idiomaFiltro, pilarFiltro]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título, nota ou endereço"
          aria-label="Buscar recursos"
          className="h-10 min-w-64 flex-1 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        />
        <Button type="button" onClick={() => setNovo(true)} className="h-10">
          Novo recurso
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Filtro ativo={idiomaFiltro === null} onClick={() => setIdiomaFiltro(null)}>
          Todos os idiomas
        </Filtro>
        {estado.idiomas.map((i) => (
          <Filtro
            key={i.id}
            ativo={idiomaFiltro === i.id}
            onClick={() => setIdiomaFiltro(idiomaFiltro === i.id ? null : i.id)}
          >
            {i.bandeira} {i.nome}
          </Filtro>
        ))}
        {PILARES.map((p) => (
          <Filtro
            key={p}
            ativo={pilarFiltro === p}
            onClick={() => setPilarFiltro(pilarFiltro === p ? null : p)}
          >
            {ROTULO_PILAR[p]}
          </Filtro>
        ))}
      </div>

      {novo ? (
        <FormularioRecurso estado={estado} aoFechar={() => setNovo(false)} />
      ) : null}

      {visiveis.length === 0 ? (
        <p className="rounded-card border border-borda bg-superficie p-6 text-corpo text-texto-2">
          {estado.recursos.length === 0
            ? "Nenhum recurso salvo ainda."
            : `Nada para “${busca}”.`}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((r) => (
            <article
              key={r.id}
              className="flex flex-col rounded-card border border-borda bg-superficie p-5 shadow-card"
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="text-rotulo uppercase text-texto-3">
                  {ROTULO_TIPO[r.tipo as TipoRecurso] ?? r.tipo}
                </span>
                <button
                  type="button"
                  aria-label={r.favorito ? "Desfavoritar" : "Favoritar"}
                  onClick={() => iniciar(async () => void (await alternarFavorito(r.id, !r.favorito)))}
                  className={cn("shrink-0", r.favorito ? "text-meta-longo" : "text-texto-3")}
                >
                  <Star className="size-4" fill={r.favorito ? "currentColor" : "none"} />
                </button>
              </div>

              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => void registrarAcessoRecurso(r.id)}
                className="text-h3 text-texto underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-lime-500"
              >
                {r.titulo}
              </a>
              <p className="mt-0.5 text-pequeno text-texto-3">{r.dominio}</p>

              {r.nota ? (
                <p className="mt-2 line-clamp-2 text-pequeno text-texto-2">{r.nota}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {r.idiomas.map((id) => {
                  const idioma = estado.idiomas.find((i) => i.id === id);
                  return idioma ? (
                    <span key={id} className="text-pequeno">
                      {idioma.bandeira}
                    </span>
                  ) : null;
                })}
                {r.pilares.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-superficie-2 px-2 py-0.5 text-rotulo uppercase text-texto-3"
                  >
                    {ROTULO_PILAR[p]}
                  </span>
                ))}
                <button
                  type="button"
                  aria-label={`Remover ${r.titulo}`}
                  onClick={() =>
                    iniciar(async () => {
                      const res = await removerRecurso(r.id);
                      toast[res.ok ? "success" : "error"](
                        res.ok ? "Recurso removido." : (res.erro ?? "Falhou."),
                      );
                    })
                  }
                  className="ml-auto text-texto-3 hover:text-perigo"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Filtro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "rounded-full border px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
        ativo ? "border-texto bg-texto text-fundo" : "border-borda-forte text-texto-2",
      )}
    >
      {children}
    </button>
  );
}

function FormularioRecurso({
  estado,
  aoFechar,
}: {
  estado: EstadoRecursos;
  aoFechar: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [tipo, setTipo] = useState<TipoRecurso>("dicionario");
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [pilares, setPilares] = useState<Pilar[]>([]);
  const [nota, setNota] = useState("");
  const [salvando, iniciar] = useTransition();

  function alternar<T>(lista: T[], valor: T): T[] {
    return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
  }

  function salvar() {
    iniciar(async () => {
      const r = await salvarRecurso({ titulo, url, tipo, idiomas, pilares, nota: nota || null });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      toast.success("Recurso salvo.");
      aoFechar();
    });
  }

  return (
    <section className="mb-6 rounded-card border border-borda bg-superficie p-6 shadow-card">
      <h2 className="mb-4 text-h2 text-texto">Novo recurso</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rec-titulo" className="mb-2 block text-rotulo uppercase text-texto-3">
            Título
          </label>
          <input
            id="rec-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
        <div>
          <label htmlFor="rec-url" className="mb-2 block text-rotulo uppercase text-texto-3">
            Endereço
          </label>
          <input
            id="rec-url"
            type="url"
            value={url}
            placeholder="https://"
            onChange={(e) => setUrl(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <GrupoDeChips
          legenda="Tipo"
          valor={tipo}
          onChange={setTipo}
          opcoes={TIPOS.map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] }))}
        />

        <fieldset>
          <legend className="mb-2 block text-rotulo uppercase text-texto-3">Idiomas</legend>
          <div className="flex flex-wrap gap-2">
            {estado.idiomas.map((i) => (
              <Filtro
                key={i.id}
                ativo={idiomas.includes(i.id)}
                onClick={() => setIdiomas((l) => alternar(l, i.id))}
              >
                {i.bandeira} {i.nome}
              </Filtro>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 block text-rotulo uppercase text-texto-3">Pilares</legend>
          <div className="flex flex-wrap gap-2">
            {PILARES.map((p) => (
              <Filtro
                key={p}
                ativo={pilares.includes(p)}
                onClick={() => setPilares((l) => alternar(l, p))}
              >
                {ROTULO_PILAR[p]}
              </Filtro>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="rec-nota" className="mb-2 block text-rotulo uppercase text-texto-3">
            Nota
          </label>
          <input
            id="rec-nota"
            value={nota}
            maxLength={300}
            onChange={(e) => setNota(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          type="button"
          onClick={salvar}
          disabled={salvando || !titulo.trim() || !url.trim()}
          className="h-9"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
        <button
          type="button"
          onClick={aoFechar}
          className="text-pequeno text-texto-2 underline underline-offset-2"
        >
          cancelar
        </button>
      </div>
    </section>
  );
}
