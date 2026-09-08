import { BookOpen } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { PainelMateriais } from "@/components/acervo/materiais";
import { carregarMateriais } from "@/lib/queries/acervo";

export default async function MateriaisPage() {
  const e = await carregarMateriais();

  return (
    <>
      <CabecalhoPagina
        icone={BookOpen}
        titulo="Materiais de Estudo"
        subtitulo="Um material principal por idioma"
      />
      <PainelMateriais estado={e} />
    </>
  );
}
