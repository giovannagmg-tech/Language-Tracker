import { LayoutDashboard } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={LayoutDashboard} titulo="Dashboard" subtitulo="Semana, mês e ano" />
      <EmConstrucao fase="Fase 2" />
    </>
  );
}
