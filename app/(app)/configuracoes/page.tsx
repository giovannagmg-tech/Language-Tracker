import { Settings } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={Settings} titulo="Configurações" subtitulo="Todo parâmetro do método" />
      <EmConstrucao fase="Fase 7" />
    </>
  );
}
