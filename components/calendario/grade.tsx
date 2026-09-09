import Link from "next/link";
import { alturaDaBarra, NOMES_DOS_DIAS, type ResumoDia } from "@/lib/domain/calendario";
import { fmtHoras } from "@/lib/formatadores";
import type { IdiomaDoCalendario } from "@/lib/queries/calendario";
import { cn } from "@/lib/utils";

/**
 * Fase A: só-leitura. A célula leva ao histórico daquele dia — o painel do dia
 * com edição é a fase B. Server Component: não há interação, não há motivo
 * para mandar JavaScript.
 */
export function GradeDoMes({
  semanas,
  escala,
  idiomas,
}: {
  semanas: ResumoDia[][];
  escala: number;
  idiomas: IdiomaDoCalendario[];
}) {
  const bandeiras = new Map(idiomas.map((i) => [i.id, i.bandeira]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-1">
        <caption className="sr-only">
          Calendário do mês: minutos estudados e tarefas de cada dia
        </caption>
        <thead>
          <tr>
            {NOMES_DOS_DIAS.map((dia) => (
              <th
                key={dia}
                scope="col"
                className="pb-1 text-rotulo uppercase font-semibold text-texto-3"
              >
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana) => (
            <tr key={semana[0].data}>
              {semana.map((dia) => (
                <td key={dia.data} className="p-0 align-top">
                  <Celula dia={dia} escala={escala} bandeiras={bandeiras} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Celula({
  dia,
  escala,
  bandeiras,
}: {
  dia: ResumoDia;
  escala: number;
  bandeiras: Map<string, string>;
}) {
  const altura = alturaDaBarra(dia.minutos, escala);
  const vazio = dia.minutos === 0 && dia.tarefasAbertas === 0 && dia.tarefasConcluidas === 0;

  const descricao = [
    dia.minutos > 0 ? fmtHoras(dia.minutos) : "nada registrado",
    dia.tarefasConcluidas > 0 ? `${dia.tarefasConcluidas} concluída(s)` : null,
    dia.tarefasAbertas > 0 ? `${dia.tarefasAbertas} aberta(s)` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const conteudo = (
    <>
      <span className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "text-pequeno tabular",
            dia.hoje ? "font-bold text-texto" : dia.noMes ? "text-texto-2" : "text-texto-3",
          )}
        >
          {Number(dia.data.slice(8, 10))}
        </span>
        {dia.atrasada ? (
          <span
            aria-hidden
            title="tarefa atrasada"
            className="mt-0.5 size-1.5 shrink-0 rounded-full bg-perigo"
          />
        ) : null}
      </span>

      {dia.idiomas.length > 0 ? (
        <span className="mt-1 flex flex-wrap gap-0.5 text-[10px] leading-none">
          {dia.idiomas.map((id) => (
            <span key={id}>{bandeiras.get(id) ?? "•"}</span>
          ))}
        </span>
      ) : null}

      {/* A barra fica no rodapé da célula: comparar alturas exige base comum. */}
      <span className="mt-auto flex h-6 items-end gap-1 pt-1">
        {altura > 0 ? (
          <span
            className="w-full rounded-sm bg-lime-500/70"
            style={{ height: `${Math.max(8, altura * 100)}%` }}
          />
        ) : null}
      </span>

      {dia.tarefasAbertas + dia.tarefasConcluidas > 0 ? (
        <span className="mt-1 flex flex-wrap gap-0.5">
          {Array.from({ length: Math.min(4, dia.tarefasConcluidas) }, (_, i) => (
            <span key={`c${i}`} aria-hidden className="size-1.5 rounded-full bg-sucesso" />
          ))}
          {Array.from({ length: Math.min(4, dia.tarefasAbertas) }, (_, i) => (
            <span
              key={`a${i}`}
              aria-hidden
              className={cn(
                "size-1.5 rounded-full border",
                dia.atrasada ? "border-perigo" : "border-texto-3",
              )}
            />
          ))}
        </span>
      ) : null}
    </>
  );

  const classe = cn(
    "flex h-24 w-full flex-col rounded-[10px] border p-1.5 text-left transition-colors",
    dia.noMes ? "bg-superficie" : "bg-transparent",
    dia.hoje ? "border-texto" : "border-borda",
    !vazio && "hover:border-texto-3",
  );

  if (vazio) {
    return (
      <div className={classe} aria-label={`${dia.data}: nada registrado`}>
        {conteudo}
      </div>
    );
  }

  return (
    <Link
      href={`/historico?de=${dia.data}&ate=${dia.data}`}
      aria-label={`${dia.data}: ${descricao}`}
      className={cn(classe, "outline-none focus-visible:ring-2 focus-visible:ring-lime-500")}
    >
      {conteudo}
    </Link>
  );
}
