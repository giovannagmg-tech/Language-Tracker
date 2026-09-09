import { CalendarCheck } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { ListaTarefas } from "@/components/hoje/lista-tarefas";
import { ModoRetomada } from "@/components/hoje/modo-retomada";
import { PisoDiario } from "@/components/hoje/piso-diario";
import { SemaforoRegras } from "@/components/hoje/semaforo-regras";
import { Sequencias } from "@/components/hoje/sequencias";
import { FormularioSessao } from "@/components/registro/formulario-sessao";
import { sincronizarConquistasSeNecessario } from "@/lib/motores/conquistas";
import { sincronizarRetomada } from "@/lib/motores/retomada";
import { sincronizarTarefas } from "@/lib/motores/tarefas";
import { carregarHoje } from "@/lib/queries/hoje";

function porExtenso(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${data}T12:00:00Z`));
}

export default async function HojePage() {
  // Os três motores rodam ao abrir o dia. Todos idempotentes por construção.
  const retomada = await sincronizarRetomada();
  await sincronizarTarefas();
  await sincronizarConquistasSeNecessario();
  const e = await carregarHoje();

  const emRetomada = retomada.ativa !== null;

  return (
    <>
      <CabecalhoPagina icone={CalendarCheck} titulo="Hoje" subtitulo={porExtenso(e.hoje)} />

      <div className="space-y-8">
        {retomada.ativa ? <ModoRetomada retomada={retomada.ativa} /> : null}

        <PisoDiario
          hoje={e.hoje}
          idiomas={e.idiomas}
          idiomasRevisados={e.revisoesDoDia.filter((r) => r.revisou).map((r) => r.idiomaId)}
          minutosFalaPorIdioma={e.minutosFalaPorIdioma}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {emRetomada ? null : (
            <ListaTarefas
              tarefas={e.tarefas}
              marcha={e.marcha}
              nomeMarcha={e.nomeMarcha}
              hoje={e.hoje}
              idiomaFocoId={e.idiomaFocoId}
            />
          )}

          <section
            className={`rounded-card border border-borda bg-superficie p-6 shadow-card ${
              emRetomada ? "lg:col-span-2" : ""
            }`}
          >
            <h2 className="mb-4 text-h2 text-texto">Registro rápido</h2>
            <FormularioSessao
              idiomas={e.idiomas}
              idiomaFocoId={e.idiomaFocoId}
              hoje={e.hoje}
              marcha={e.marcha}
              pilaresDoDia={e.pilaresDoDia}
              compacto
            />
          </section>
        </div>

        <SemaforoRegras regras={e.regras} hoje={e.hoje} idiomaFocoId={e.idiomaFocoId} />

        {emRetomada ? null : (
          <Sequencias
            streakRegistro={e.streakRegistro}
            streakPiso={e.streakPiso}
            recorde={e.recorde}
            faltamRecorde={e.faltamRecorde}
          />
        )}
      </div>
    </>
  );
}
