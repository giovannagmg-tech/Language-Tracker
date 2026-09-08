import { Library } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { PainelRecursos } from "@/components/acervo/recursos";
import { carregarRecursos } from "@/lib/queries/acervo";

export default async function RecursosPage() {
  const e = await carregarRecursos();

  return (
    <>
      <CabecalhoPagina
        icone={Library}
        titulo="Recursos"
        subtitulo="Dicionários, listas, canais e comunidades"
      />
      <PainelRecursos estado={e} />
    </>
  );
}
