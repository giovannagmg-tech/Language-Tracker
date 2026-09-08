import { Trophy } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { GradeDeConquistas } from "@/components/conquistas/grade";
import { sincronizarConquistas } from "@/lib/motores/conquistas";
import { carregarConquistas } from "@/lib/queries/acervo";

export default async function ConquistasPage() {
  await sincronizarConquistas();
  const e = await carregarConquistas();

  return (
    <>
      <CabecalhoPagina
        icone={Trophy}
        titulo="Conquistas"
        subtitulo={
          e.conquistadas === 0
            ? `0 de ${e.total}. A primeira é fácil: registre 7 dias seguidos.`
            : `${e.conquistadas} de ${e.total}`
        }
      />
      <GradeDeConquistas estado={e} />
    </>
  );
}
