import { History } from "lucide-react";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FiltrosHistorico } from "@/components/historico/filtros";
import { TabelaHistorico } from "@/components/historico/tabela";
import type { Categoria, OrigemSessao } from "@/lib/domain/tipos";
import { fmtHoras } from "@/lib/formatadores";
import { carregarHistorico } from "@/lib/queries/historico";

const CATEGORIAS = ["ativo", "imersao"] as const;
const ORIGENS = ["manual", "toggl", "automatica"] as const;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

/** Query string é entrada do usuário: valida antes de virar filtro no banco. */
function limpar(params: Record<string, string | string[] | undefined>) {
  const um = (c: string) => {
    const v = params[c];
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const categoria = um("categoria");
  const origem = um("origem");
  const de = um("de");
  const ate = um("ate");
  const pagina = Number(um("pagina") ?? 1);

  return {
    idiomaId: um("idioma"),
    categoria: CATEGORIAS.includes(categoria as Categoria)
      ? (categoria as Categoria)
      : undefined,
    origem: ORIGENS.includes(origem as OrigemSessao) ? (origem as OrigemSessao) : undefined,
    de: de && DATA.test(de) ? de : undefined,
    ate: ate && DATA.test(ate) ? ate : undefined,
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.floor(pagina) : 1,
  };
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const e = await carregarHistorico(limpar(params));

  const paginaUrl = (n: number) => {
    const novos = new URLSearchParams();
    for (const [c, v] of Object.entries(params)) {
      if (typeof v === "string" && v !== "" && c !== "pagina") novos.set(c, v);
    }
    if (n > 1) novos.set("pagina", String(n));
    const q = novos.toString();
    return q ? `/historico?${q}` : "/historico";
  };

  return (
    <>
      <CabecalhoPagina
        icone={History}
        titulo="Histórico"
        subtitulo={
          e.total === 0
            ? "Todos os registros de estudo"
            : `${e.total} ${e.total === 1 ? "registro" : "registros"} · ${fmtHoras(e.minutosNoFiltro)}`
        }
      />

      <FiltrosHistorico idiomas={e.idiomas} total={e.total} />

      <TabelaHistorico linhas={e.linhas} idiomas={e.idiomas} />

      {e.paginas > 1 ? (
        <nav
          aria-label="Paginação do histórico"
          className="mt-8 flex items-center justify-between gap-4 border-t border-borda pt-4"
        >
          {e.pagina > 1 ? (
            <Link
              href={paginaUrl(e.pagina - 1)}
              className="h-9 rounded-full border border-borda-forte px-4 py-2 text-pequeno text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              ← anteriores
            </Link>
          ) : (
            <span />
          )}

          <span className="text-pequeno text-texto-3 tabular">
            página {e.pagina} de {e.paginas}
          </span>

          {e.pagina < e.paginas ? (
            <Link
              href={paginaUrl(e.pagina + 1)}
              className="h-9 rounded-full border border-borda-forte px-4 py-2 text-pequeno text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              seguintes →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
