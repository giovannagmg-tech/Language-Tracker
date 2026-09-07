import { PlusCircle } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FormularioSessao } from "@/components/registro/formulario-sessao";
import { carregarHoje } from "@/lib/queries/hoje";

export default async function RegistroPage() {
  const e = await carregarHoje();

  return (
    <>
      <CabecalhoPagina
        icone={PlusCircle}
        titulo="Registro de Estudo"
        subtitulo="Uma sessão em menos de 10 segundos"
      />
      <div className="max-w-3xl rounded-card border border-borda bg-superficie p-6 shadow-card">
        <FormularioSessao
          idiomas={e.idiomas}
          idiomaFocoId={e.idiomaFocoId}
          hoje={e.hoje}
          marcha={e.marcha}
          pilaresDoDia={e.pilaresDoDia}
        />
      </div>
    </>
  );
}
