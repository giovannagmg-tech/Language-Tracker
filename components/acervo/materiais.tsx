"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { PastilhaIdioma } from "@/components/ui/idioma";
import { avancarMaterial, salvarMaterial } from "@/lib/actions/acervo";
import { TIPOS_MATERIAL, type TipoMaterial } from "@/lib/domain/tipos";
import type { EstadoMateriais, MaterialNaTela } from "@/lib/queries/acervo";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

export const ROTULO_TIPO_MATERIAL: Record<TipoMaterial, string> = {
  app: "App",
  livro: "Livro",
  canal_youtube: "Canal do YouTube",
  podcast: "Podcast",
  curso: "Curso",
  playlist: "Playlist",
  lista_palavras: "Lista de palavras",
  deck: "Deck",
  outro: "Outro",
};

export function PainelMateriais({ estado }: { estado: EstadoMateriais }) {
  const [formulario, setFormulario] = useState<{ idiomaId: string; principal: boolean } | null>(null);

  return (
    <>
      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {estado.principais.map((item) =>
          "vazio" in item ? (
            <section
              key={item.idioma.id}
              className="rounded-card border border-dashed border-borda-forte bg-superficie p-6 text-center"
            >
              <PastilhaIdioma idioma={item.idioma} />
              <p className="mt-2 text-pequeno text-texto-2">
                Nenhum material principal em {item.idioma.nome}.
              </p>
              <Button
                type="button"
                onClick={() => setFormulario({ idiomaId: item.idioma.id, principal: true })}
                className="mt-4 h-9"
              >
                Definir material principal
              </Button>
            </section>
          ) : (
            <CardMaterial key={item.id} material={item} destaque />
          ),
        )}
      </div>

      {formulario ? (
        <FormularioMaterial
          idiomas={estado.idiomas}
          inicial={formulario}
          aoFechar={() => setFormulario(null)}
        />
      ) : (
        <div className="mb-6">
          <Button
            type="button"
            onClick={() => setFormulario({ idiomaId: estado.idiomas[0]?.id ?? "", principal: false })}
            className="h-10"
          >
            Novo material
          </Button>
        </div>
      )}

      {estado.secundarios.length > 0 ? (
        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="mb-4 text-h2 text-texto">Outros materiais</h2>
          <ul className="divide-y divide-borda">
            {estado.secundarios.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <PastilhaIdioma idioma={m.idioma} compacta mostrarNome={false} />
                <span className="min-w-0 flex-1 text-corpo text-texto">{m.titulo}</span>
                <span className="shrink-0 text-pequeno text-texto-3">
                  {ROTULO_TIPO_MATERIAL[m.tipo]}
                </span>
                <span className="shrink-0 text-pequeno tabular text-texto-2">
                  {m.unidade} {m.posicaoAtual}
                  {m.total ? ` de ${m.total}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}

function CardMaterial({ material, destaque }: { material: MaterialNaTela; destaque?: boolean }) {
  const [, iniciar] = useTransition();
  const [posicao, setPosicao] = useState(material.posicaoAtual);
  const pct = material.total ? Math.min(1, posicao / material.total) : null;

  function avancar() {
    iniciar(async () => {
      const r = await avancarMaterial(material.id, 1);
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para avançar.");
        return;
      }
      setPosicao(r.posicao);
      toast.success(`${material.unidade} ${r.posicao}.`);
    });
  }

  return (
    <section
      className={cn(
        "rounded-card border bg-superficie p-6 shadow-card",
        destaque ? "border-borda-forte" : "border-borda",
      )}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <p className="text-h3 text-texto">
          <span className="mr-2">{material.idioma.bandeira}</span>
          {material.idioma.nome}
        </p>
        <span className="text-rotulo uppercase text-texto-3">
          {ROTULO_TIPO_MATERIAL[material.tipo]}
        </span>
      </div>

      <p className="mb-4 text-corpo text-texto">{material.titulo}</p>

      {pct !== null ? (
        <>
          <div className="h-2 w-full rounded-full bg-superficie-2">
            <div className="h-2 rounded-full bg-meta-longo" style={{ width: `${pct * 100}%` }} />
          </div>
          <p className="mt-2 text-numero-sm text-texto">
            {material.unidade} {posicao} de {material.total}
          </p>
          <p className="text-pequeno text-texto-2">{Math.round(pct * 100)}% concluído</p>
        </>
      ) : (
        <p className="text-numero-sm text-texto">
          {material.unidade} {posicao}
        </p>
      )}

      <p className="mt-2 text-pequeno text-texto-2">
        {material.diasParado === null
          ? "Sem sessão registrada ainda."
          : material.diasParado === 0
            ? "Sessão hoje."
            : `Última sessão há ${material.diasParado} ${material.diasParado === 1 ? "dia" : "dias"}.`}
      </p>

      {material.diasParado !== null && material.diasParado > 21 ? (
        <p className="mt-2 rounded-[10px] bg-atencao-bg px-3 py-2 text-pequeno text-texto">
          Parado há {material.diasParado} dias.
        </p>
      ) : null}

      <Button type="button" onClick={avancar} className="mt-4 h-9">
        +1 {material.unidade}
      </Button>
    </section>
  );
}

function FormularioMaterial({
  idiomas,
  inicial,
  aoFechar,
}: {
  idiomas: IdiomaResumo[];
  inicial: { idiomaId: string; principal: boolean };
  aoFechar: () => void;
}) {
  const [idiomaId, setIdiomaId] = useState(inicial.idiomaId);
  const [tipo, setTipo] = useState<TipoMaterial>("livro");
  const [titulo, setTitulo] = useState("");
  const [unidade, setUnidade] = useState("lição");
  const [posicao, setPosicao] = useState(0);
  const [total, setTotal] = useState("");
  const [url, setUrl] = useState("");
  const [principal, setPrincipal] = useState(inicial.principal);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await salvarMaterial({
        idiomaId,
        tipo,
        titulo,
        unidade,
        posicaoAtual: posicao,
        total: total ? Number(total) : null,
        url: url || null,
        principal,
      });
      if (!r.ok) {
        toast.error(r.erro ?? "Não deu para salvar.");
        return;
      }
      toast.success("Material salvo.");
      aoFechar();
    });
  }

  return (
    <section className="mb-6 rounded-card border border-borda bg-superficie p-6 shadow-card">
      <h2 className="mb-4 text-h2 text-texto">Novo material</h2>

      <div className="space-y-5">
        <GrupoDeChips
          legenda="Idioma"
          valor={idiomaId}
          onChange={setIdiomaId}
          opcoes={idiomas.map((i) => ({ valor: i.id, rotulo: i.nome, prefixo: i.bandeira }))}
        />
        <GrupoDeChips
          legenda="Tipo"
          valor={tipo}
          onChange={setTipo}
          opcoes={TIPOS_MATERIAL.map((t) => ({ valor: t, rotulo: ROTULO_TIPO_MATERIAL[t] }))}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="titulo" rotulo="Título" valor={titulo} onChange={setTitulo} />
          <Campo id="unidade" rotulo="Unidade" valor={unidade} onChange={setUnidade} />
          <Campo
            id="posicao"
            rotulo="Posição atual"
            valor={String(posicao)}
            onChange={(v) => setPosicao(Math.max(0, Number(v) || 0))}
            tipo="number"
          />
          <Campo id="total" rotulo="Total (opcional)" valor={total} onChange={setTotal} tipo="number" />
          <Campo id="url" rotulo="URL (opcional)" valor={url} onChange={setUrl} />
        </div>

        <label className="flex items-center gap-2 text-corpo text-texto">
          <input
            type="checkbox"
            checked={principal}
            onChange={(e) => setPrincipal(e.target.checked)}
            className="size-4 accent-[var(--cor-texto)]"
          />
          Material principal deste idioma
        </label>
        <p className="text-pequeno text-texto-3">
          Um material principal por idioma. Marcar este desmarca o anterior.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button type="button" onClick={salvar} disabled={salvando || !titulo.trim()} className="h-9">
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

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  tipo = "text",
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-rotulo uppercase text-texto-3">
        {rotulo}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
      />
    </div>
  );
}
