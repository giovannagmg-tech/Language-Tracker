import { CalendarCheck } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={CalendarCheck} titulo="Hoje" subtitulo="O que a marcha exige e o que está em risco" />
      <EmConstrucao fase="Fase 1" />
    </>
  );
}
