import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { GradeDoMes } from "@/components/calendario/grade";
import { mesVizinho, nomeDoMes } from "@/lib/domain/calendario";
import { hoje as hojeLocal, mesDe } from "@/lib/domain/datas";
import { fmtHoras } from "@/lib/formatadores";
import { carregarCalendario } from "@/lib/queries/calendario";
import { cn } from "@/lib/utils";

const MES = /^\d{4}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const um = (c: string) => {
    const v = params[c];
    return typeof v === "string" && v !== "" ? v : undefined;
  };

  const mesParam = um("mes");
  const mes = mesParam && MES.test(mesParam) ? `${mesParam}-01` : mesDe(hojeLocal()).inicio;
  const idiomaParam = um("idioma");
  const idioma = idiomaParam && UUID.test(idiomaParam) ? idiomaParam : null;

  const e = await carregarCalendario(mes, idioma);

  const url = (mudanca: { mes?: string; idioma?: string | null }) => {
    const p = new URLSearchParams();
    const novoMes = mudanca.mes ?? e.mes.slice(0, 7);
    if (novoMes !== mesDe(e.hoje).inicio.slice(0, 7)) p.set("mes", novoMes);
    const novoIdioma = mudanca.idioma === undefined ? e.idiomaFiltrado : mudanca.idioma;
    if (novoIdioma) p.set("idioma", novoIdioma);
    const q = p.toString();
    return q ? `/calendario?${q}` : "/calendario";
  };

  const media =
    e.totais.diasComRegistro > 0
      ? Math.round(e.totais.minutos / e.totais.diasComRegistro)
      : 0;

  return (
    <>
      <CabecalhoPagina
        icone={CalendarDays}
        titulo="Calendário"
        subtitulo="O que você fez e o que planejou, mês a mês"
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            href={url({ mes: mesVizinho(e.mes, -1).slice(0, 7) })}
            aria-label="Mês anterior"
            className="grid size-9 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <h2 className="min-w-[168px] text-center text-h2 text-texto">{nomeDoMes(e.mes)}</h2>
          <Link
            href={url({ mes: mesVizinho(e.mes, 1).slice(0, 7) })}
            aria-label="Mês seguinte"
            className="grid size-9 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ChevronRight className="size-4" />
          </Link>
          {e.mes !== mesDe(e.hoje).inicio ? (
            <Link
              href={url({ mes: mesDe(e.hoje).inicio.slice(0, 7) })}
              className="ml-1 text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
            >
              hoje
            </Link>
          ) : null}
        </div>

        {/* RN-1213: só idiomas ativos, e só os que têm algo no mês. */}
        {e.idiomas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            <Pastilha href={url({ idioma: null })} ativa={e.idiomaFiltrado === null}>
              Todos
            </Pastilha>
            {e.idiomas.map((i) => (
              <Pastilha
                key={i.id}
                href={url({ idioma: i.id })}
                ativa={e.idiomaFiltrado === i.id}
              >
                {i.bandeira} {i.nome}
              </Pastilha>
            ))}
          </div>
        ) : null}
      </div>

      <GradeDoMes semanas={e.semanas} escala={e.escala} idiomas={e.idiomas} />

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-borda pt-4 sm:grid-cols-4">
        <Numero rotulo="No mês" valor={e.totais.minutos > 0 ? fmtHoras(e.totais.minutos) : "—"} />
        <Numero
          rotulo="Dias com registro"
          valor={`${e.totais.diasComRegistro}/${e.totais.diasNoMes}`}
        />
        <Numero rotulo="Média por dia ativo" valor={media > 0 ? fmtHoras(media) : "—"} />
        <Numero
          rotulo="Tarefas"
          valor={
            e.totais.tarefasAbertas + e.totais.tarefasConcluidas === 0
              ? "—"
              : `${e.totais.tarefasConcluidas}/${e.totais.tarefasAbertas + e.totais.tarefasConcluidas}`
          }
        />
      </dl>

      {e.totais.minutos === 0 && e.totais.tarefasConcluidas === 0 ? (
        <p className="mt-4 text-pequeno text-texto-2">
          Nada neste mês. As setas andam pelo histórico — você tem registros
          desde janeiro.
        </p>
      ) : null}
    </>
  );
}

function Pastilha({
  href,
  ativa,
  children,
}: {
  href: string;
  ativa: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={ativa ? "true" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-pequeno outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
        ativa ? "border-texto bg-texto text-fundo" : "border-borda-forte text-texto-2",
      )}
    >
      {children}
    </Link>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-rotulo uppercase text-texto-3">{rotulo}</dt>
      <dd className="mt-0.5 text-numero-sm text-texto tabular">{valor}</dd>
    </div>
  );
}
