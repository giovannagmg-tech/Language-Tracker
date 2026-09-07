import { Library } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={Library} titulo="Recursos" subtitulo="Links e ferramentas com tags" />
      <EmConstrucao fase="Fase 5" />
    </>
  );
}
