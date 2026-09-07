import { ListTodo } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { EmConstrucao } from "@/components/app/em-construcao";

export default function Pagina() {
  return (
    <>
      <CabecalhoPagina icone={ListTodo} titulo="Tarefas" subtitulo="Geradas pelas regras e criadas por você" />
      <EmConstrucao fase="Fase 3" />
    </>
  );
}
