import { BookOpen } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={BookOpen} titulo="Materiais de Estudo" subtitulo="Um material principal por idioma" />
      <EmConstrucao fase="Fase 5" />
    </>
  );
}
