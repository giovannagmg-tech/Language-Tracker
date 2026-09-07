import { Target } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={Target} titulo="Metas" subtitulo="Palavras, nível, conversação e painel mensal" />
      <EmConstrucao fase="Fase 3" />
    </>
  );
}
