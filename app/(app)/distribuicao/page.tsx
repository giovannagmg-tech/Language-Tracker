import { PieChart } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={PieChart} titulo="Planilha de Distribuição" subtitulo="Para onde o tempo deve ir" />
      <EmConstrucao fase="Fase 3" />
    </>
  );
}
