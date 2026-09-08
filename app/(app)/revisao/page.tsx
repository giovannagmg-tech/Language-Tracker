import { RotateCcw } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FilaDeRevisao, ListaDePontos } from "@/components/revisao/fila";
import { sincronizarTarefas } from "@/lib/motores/tarefas";
import { carregarRevisao } from "@/lib/queries/revisao";

export default async function RevisaoPage() {
  await sincronizarTarefas();
  const e = await carregarRevisao();

  return (
    <>
      <CabecalhoPagina
        icone={RotateCcw}
        titulo="Revisão"
        subtitulo="Tudo que está em dívida, do mais urgente para o menos"
      />

      <div className="space-y-6">
        <FilaDeRevisao
          itens={e.itens}
          idiomas={e.idiomas}
          hoje={e.hoje}
          resolvidosNaSemana={e.resolvidosNaSemana}
        />

        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="text-h2 text-texto">Pontos gramaticais</h2>
          <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
            Marcar &ldquo;errei na revisão&rdquo; gera as duas frases em voz alta
          </p>
          <ListaDePontos pontos={e.pontos} idiomas={e.idiomas} />
        </section>

        <p className="text-pequeno text-texto-3">
          Cartões devidos ficam no Flashcards Deluxe.
        </p>
      </div>
    </>
  );
}
