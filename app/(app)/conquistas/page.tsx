import { Trophy } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={Trophy} titulo="Conquistas" subtitulo="Derivadas do método" />
      <EmConstrucao fase="Fase 5" />
    </>
  );
}
