import { PlusCircle } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FormularioSessao } from "@/components/registro/formulario-sessao";
import { PILARES, type Pilar } from "@/lib/domain/tipos";
import { carregarHoje } from "@/lib/queries/hoje";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const e = await carregarHoje();

  const um = (c: string) => {
    const v = params[c];
    return typeof v === "string" && v !== "" ? v : undefined;
  };

  // RN-1207: rascunho vindo de uma tarefa do calendário. Query string é entrada
  // do usuário — valida cada campo antes de deixar entrar no formulário.
  const idioma = um("idioma");
  const pilar = um("pilar");
  const data = um("data");
  const duracao = Number(um("duracao"));
  const tarefa = um("tarefa");

  const veioDeTarefa = tarefa !== undefined && UUID.test(tarefa);

  const inicial = {
    idiomaId: idioma && UUID.test(idioma) ? idioma : undefined,
    pilar: pilar && PILARES.includes(pilar as Pilar) ? (pilar as Pilar) : undefined,
    data: data && DATA.test(data) ? data : undefined,
    duracaoMin: Number.isFinite(duracao) && duracao >= 1 && duracao <= 480 ? duracao : undefined,
    tarefaId: veioDeTarefa ? tarefa : undefined,
  };

  const temRascunho = Object.values(inicial).some((v) => v !== undefined);

  return (
    <>
      <CabecalhoPagina
        icone={PlusCircle}
        titulo="Registro de Estudo"
        subtitulo={
          veioDeTarefa
            ? "Confirme o que aconteceu — salvar aqui conclui a tarefa"
            : "Uma sessão em menos de 10 segundos"
        }
      />
      <div className="max-w-3xl rounded-card border border-borda bg-superficie p-6 shadow-card">
        <FormularioSessao
          idiomas={e.idiomas}
          idiomaFocoId={e.idiomaFocoId}
          hoje={e.hoje}
          marcha={e.marcha}
          pilaresDoDia={e.pilaresDoDia}
          inicial={temRascunho ? inicial : undefined}
        />
      </div>
    </>
  );
}
