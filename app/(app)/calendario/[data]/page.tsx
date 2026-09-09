import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { PainelDoDia } from "@/components/calendario/painel-do-dia";
import { somaDias } from "@/lib/domain/datas";
import { fmtHoras } from "@/lib/formatadores";
import { carregarDia } from "@/lib/queries/dia";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function porExtenso(data: string): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${data}T12:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default async function DiaPage({ params }: { params: Promise<{ data: string }> }) {
  const { data } = await params;
  if (!DATA.test(data)) notFound();

  const e = await carregarDia(data);
  const ehHoje = e.data === e.hoje;

  return (
    <>
      <CabecalhoPagina
        icone={CalendarDays}
        titulo={ehHoje ? "Hoje" : porExtenso(e.data)}
        subtitulo={
          e.minutosDoDia > 0
            ? `${fmtHoras(e.minutosDoDia)} registrados neste dia`
            : "Nada registrado neste dia"
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/calendario?mes=${e.data.slice(0, 7)}`}
          className="inline-flex items-center gap-1.5 text-pequeno text-texto-3 underline underline-offset-2 outline-none hover:text-texto-2 focus-visible:ring-2 focus-visible:ring-lime-500"
        >
          <ArrowLeft className="size-3.5" />
          voltar ao mês
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/calendario/${somaDias(e.data, -1)}`}
            aria-label="Dia anterior"
            className="grid size-8 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <Link
            href={`/calendario/${somaDias(e.data, 1)}`}
            aria-label="Dia seguinte"
            className="grid size-8 place-items-center rounded-full border border-borda-forte text-texto-2 outline-none hover:border-texto-3 focus-visible:ring-2 focus-visible:ring-lime-500"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <PainelDoDia estado={e} />

      {e.minutosDoDia > 0 ? (
        <p className="mt-6 border-t border-borda pt-4 text-pequeno text-texto-2">
          As sessões deste dia estão em{" "}
          <Link
            href={`/historico?de=${e.data}&ate=${e.data}`}
            className="underline underline-offset-2 hover:text-texto"
          >
            Histórico
          </Link>
          , onde dá para apagar uma a uma.
        </p>
      ) : null}
    </>
  );
}
