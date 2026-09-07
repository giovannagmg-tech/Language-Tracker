import { PlusCircle } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={PlusCircle} titulo="Registro de Estudo" subtitulo="Uma sessão em menos de 10 segundos" />
      <EmConstrucao fase="Fase 1" />
    </>
  );
}
