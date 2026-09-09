"use client";

import { useMemo, useState, useTransition } from "react";
import { Lock, Share2 } from "lucide-react";
import { toast } from "sonner";
import { IconeConquista } from "@/components/conquistas/icones";
import { recalcularConquistas } from "@/lib/actions/acervo";
import type { CategoriaConquista } from "@/lib/domain/tipos";
import type { ConquistaNaTela, EstadoConquistas } from "@/lib/queries/acervo";
import { cn } from "@/lib/utils";

type Filtro = "todas" | "conquistadas" | "bloqueadas" | "perto";

/**
 * Documento 06. Produção e recuperação vêm primeiro: são as que o gargalo
 * real exige. Conquista bloqueada mostra o critério — sempre.
 */
export function GradeDeConquistas({ estado }: { estado: EstadoConquistas }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [categoria, setCategoria] = useState<CategoriaConquista | "todas">("todas");
  const [recalculando, iniciar] = useTransition();

  const visiveis = useMemo(() => {
    const ordem: CategoriaConquista[] = [
      "producao",
      "recuperacao",
      "metodo",
      "camada",
      "consistencia",
    ];
    return estado.itens
      .filter((i) => (categoria === "todas" ? true : i.definicao.categoria === categoria))
      .filter((i) => {
        if (filtro === "conquistadas") return i.conquistada;
        if (filtro === "bloqueadas") return !i.conquistada;
        if (filtro === "perto") {
          return !i.conquistada && i.progressoAlvo > 0 && i.progressoAtual / i.progressoAlvo >= 0.7;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.conquistada !== b.conquistada) return a.conquistada ? 1 : -1;
        const oa = ordem.indexOf(a.definicao.categoria);
        const ob = ordem.indexOf(b.definicao.categoria);
        if (oa !== ob) return oa - ob;
        return a.definicao.ordem - b.definicao.ordem;
      });
  }, [estado.itens, filtro, categoria]);

  function recalcular() {
    iniciar(async () => {
      const r = await recalcularConquistas();
      toast.success(
        r.novas > 0
          ? `${r.avaliadas} avaliadas · ${r.novas} ${r.novas === 1 ? "nova" : "novas"}.`
          : `${r.avaliadas} avaliadas, nenhuma nova.`,
      );
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-superficie-2 p-1">
          {(
            [
              ["todas", "Todas"],
              ["conquistadas", "Conquistadas"],
              ["bloqueadas", "Bloqueadas"],
              ["perto", "Perto"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setFiltro(valor)}
              aria-pressed={filtro === valor}
              className={cn(
                "rounded-full px-3 py-1.5 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                filtro === valor ? "bg-texto font-medium text-fundo" : "text-texto-2",
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <CategoriaChip valor="todas" ativa={categoria === "todas"} onClick={setCategoria}>
            Todas as categorias
          </CategoriaChip>
          {estado.porCategoria.map((c) => (
            <CategoriaChip
              key={c.categoria}
              valor={c.categoria}
              ativa={categoria === c.categoria}
              onClick={setCategoria}
            >
              {c.rotulo} {c.ganhas}/{c.total}
            </CategoriaChip>
          ))}
        </div>

        <button
          type="button"
          onClick={recalcular}
          disabled={recalculando}
          className="ml-auto text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
        >
          {recalculando ? "recalculando…" : "recalcular"}
        </button>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-card border border-borda bg-superficie p-6 text-corpo text-texto-2">
          Nenhuma conquista neste filtro.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((item) => (
            <CardDeConquista key={item.chave} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

function CategoriaChip({
  valor,
  ativa,
  onClick,
  children,
}: {
  valor: CategoriaConquista | "todas";
  ativa: boolean;
  onClick: (v: CategoriaConquista | "todas") => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(valor)}
      aria-pressed={ativa}
      className={cn(
        "rounded-full border px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
        ativa ? "border-texto bg-texto text-fundo" : "border-borda-forte text-texto-2",
      )}
    >
      {children}
    </button>
  );
}

function CardDeConquista({ item }: { item: ConquistaNaTela }) {
  const pct = item.progressoAlvo > 0 ? Math.min(1, item.progressoAtual / item.progressoAlvo) : 0;
  const nome = item.idioma ? `${item.definicao.nome} · ${item.idioma.nome}` : item.definicao.nome;

  function compartilhar() {
    gerarImagem(nome, item.definicao.criterioTexto, item.cores.forte, item.conquistadaEm);
  }

  return (
    <article
      className={cn(
        "rounded-card p-6 text-center",
        item.conquistada ? "" : "border border-borda bg-superficie-2",
      )}
      style={item.conquistada ? { background: item.cores.bg } : undefined}
    >
      {/* O ícone é o da conquista mesmo — inclusive bloqueada, porque ver o
          que está por vir vale mais que ver um cadeado. O cadeado vira selo. */}
      <div className="relative mx-auto size-12">
        <div
          className="grid size-12 place-items-center rounded-full bg-superficie"
          style={{ color: item.conquistada ? item.cores.forte : "var(--cor-texto-3)" }}
        >
          <IconeConquista codigo={item.definicao.codigo} className="size-6" />
        </div>
        {item.conquistada ? null : (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-superficie-2"
          >
            <Lock className="size-3 text-texto-3" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <p
        className={cn(
          "mt-3 text-h3 font-bold",
          item.conquistada ? "text-texto" : "text-texto-3",
        )}
      >
        {nome}
        {item.vezes > 1 ? <span className="ml-1 text-pequeno">×{item.vezes}</span> : null}
      </p>

      <p className={cn("mt-1 text-pequeno", item.conquistada ? "text-texto-2" : "text-texto-3")}>
        {item.definicao.criterioTexto}
      </p>

      {item.conquistada ? (
        <>
          {item.conquistadaEm ? (
            <p className="mt-2 text-rotulo uppercase text-texto-3">
              {item.conquistadaEm.split("-").reverse().join("/")}
            </p>
          ) : null}
          <button
            type="button"
            onClick={compartilhar}
            className="mx-auto mt-3 flex items-center gap-1.5 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            style={{ color: item.cores.forte }}
          >
            <Share2 className="size-3.5" />
            Compartilhar
          </button>
        </>
      ) : (
        <div className="mt-4">
          <div className="h-1 w-full rounded-full bg-borda">
            <div
              className="h-1 rounded-full bg-texto-3"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-rotulo uppercase tabular text-texto-3">
            {formatarProgresso(item.progressoAtual)}/{formatarProgresso(item.progressoAlvo)}
          </p>
        </div>
      )}
    </article>
  );
}

function formatarProgresso(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(".", ",");
}

/**
 * Gera a imagem localmente e baixa. Não publica em lugar nenhum — o
 * compartilhamento acontece no aplicativo de destino.
 */
function gerarImagem(nome: string, criterio: string, cor: string, data: string | null) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    toast.error("Este navegador não gerou a imagem.");
    return;
  }

  const corResolvida = getComputedStyle(document.documentElement)
    .getPropertyValue(cor.replace("var(", "").replace(")", ""))
    .trim() || "#1F9D57";

  ctx.fillStyle = "#FAFAF8";
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = corResolvida;
  ctx.beginPath();
  ctx.arc(540, 380, 110, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#171A15";
  ctx.textAlign = "center";
  ctx.font = "700 64px Inter, system-ui, sans-serif";
  quebrarTexto(ctx, nome, 540, 600, 880, 76);

  ctx.fillStyle = "#6C7268";
  ctx.font = "400 34px Inter, system-ui, sans-serif";
  quebrarTexto(ctx, criterio, 540, 760, 820, 46);

  if (data) {
    ctx.fillStyle = "#9AA095";
    ctx.font = "600 26px Inter, system-ui, sans-serif";
    ctx.fillText(data.split("-").reverse().join("/"), 540, 950);
  }

  ctx.fillStyle = "#9AA095";
  ctx.font = "600 24px Inter, system-ui, sans-serif";
  ctx.fillText("POLIGLOTA", 540, 1010);

  canvas.toBlob((blob) => {
    if (!blob) {
      toast.error("Não deu para gerar a imagem.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conquista-${nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Imagem baixada.");
  }, "image/png");
}

function quebrarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  largura: number,
  alturaLinha: number,
) {
  const palavras = texto.split(" ");
  let linha = "";
  let cursorY = y;
  for (const palavra of palavras) {
    const teste = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > largura && linha) {
      ctx.fillText(linha, x, cursorY);
      linha = palavra;
      cursorY += alturaLinha;
    } else {
      linha = teste;
    }
  }
  if (linha) ctx.fillText(linha, x, cursorY);
}
