import { Rows3 } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FerramentasDoLote } from "@/components/flashcards/ferramentas-lote";
import { PainelIdioma } from "@/components/flashcards/painel-idioma";
import { GradeCalor } from "@/components/graficos/primitivos";
import { chaveSemana, intervalo, somaDias } from "@/lib/domain/datas";
import { carregarFlashcards } from "@/lib/queries/flashcards";

function semanasDoMes(inicio: string, fim: string) {
  const semanas: { inicio: string; dias: string[] }[] = [];
  let cursor = chaveSemana(inicio);
  const ultima = chaveSemana(fim);
  while (cursor <= ultima) {
    semanas.push({ inicio: cursor, dias: intervalo(cursor, somaDias(cursor, 6)) });
    cursor = somaDias(cursor, 7);
  }
  return semanas;
}

export default async function FlashcardsPage() {
  const e = await carregarFlashcards();
  const diasNoMes = e.diasDoMes.filter((d) => e.diasComFlashcards.has(d)).length;

  return (
    <>
      <CabecalhoPagina
        icone={Rows3}
        titulo="Flashcards"
        subtitulo="Acompanhamento — os cartões vivem no Flashcards Deluxe"
      />

      <p className="mb-6 rounded-card border border-borda bg-superficie-2 px-6 py-4 text-corpo text-texto-2">
        Seus cartões vivem no Flashcards Deluxe. Aqui a gente só mede: dias com revisão, palavras
        criadas e a velocidade do lote. Nada de criar, editar ou revisar cartão por aqui.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-borda bg-superficie p-5 shadow-card">
          <p className="text-rotulo uppercase text-texto-3">Sequência</p>
          <p className="mt-1 text-numero text-texto">
            {e.streakGeral} {e.streakGeral === 1 ? "dia" : "dias"}
          </p>
          <p className="mt-1 text-pequeno text-texto-2">
            {e.recordeFlashcards > 0 ? `recorde de ${e.recordeFlashcards}` : "sem recorde ainda"}
          </p>
        </div>
        <div className="rounded-card border border-borda bg-superficie p-5 shadow-card">
          <p className="text-rotulo uppercase text-texto-3">Dias no mês</p>
          <p className="mt-1 text-numero text-texto">{diasNoMes}</p>
          <p className="mt-1 text-pequeno text-texto-2">de {e.diasDoMes.length} dias</p>
        </div>
        <div className="rounded-card border border-borda bg-superficie p-5 shadow-card">
          <p className="text-rotulo uppercase text-texto-3">Palavras hoje</p>
          <p className="mt-1 text-numero text-texto">
            {e.idiomas.reduce((t, i) => t + i.palavrasHoje, 0)}
          </p>
          <p className="mt-1 text-pequeno text-texto-2">somando os idiomas</p>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {e.idiomas.map((idioma) => (
          <PainelIdioma key={idioma.idioma.id} dados={idioma} hoje={e.hoje} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="text-h2 text-texto">Calendário de {e.mes.rotulo}</h2>
          <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
            Célula cheia é dia com revisão — o indicador é frequência, não volume
          </p>
          <div className="h-[260px]">
            <GradeCalor
              semanas={semanasDoMes(e.mes.inicio, e.mes.fim)}
              diasMarcados={e.diasComFlashcards}
            />
          </div>
        </section>

        <FerramentasDoLote
          idiomas={e.idiomas.map((i) => i.idioma)}
          hoje={e.hoje}
          minimoItens={e.loteMinimoChecagem}
        />
      </div>
    </>
  );
}
