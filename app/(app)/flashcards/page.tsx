import { Rows3 } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={Rows3} titulo="Flashcards" subtitulo="Acompanhamento do deck que vive no Flashcards Deluxe" />
      <EmConstrucao fase="Fase 4" />
    </>
  );
}
