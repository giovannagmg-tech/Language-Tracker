import { RotateCcw } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={RotateCcw} titulo="Revisão" subtitulo="Tudo que está em dívida, por urgência" />
      <EmConstrucao fase="Fase 4" />
    </>
  );
}
