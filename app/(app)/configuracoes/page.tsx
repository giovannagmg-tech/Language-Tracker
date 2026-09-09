import { Settings } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { PainelConfiguracoes } from "@/components/configuracoes/painel";
import { carregarDiagnostico } from "@/lib/actions/backup";
import { carregarConfiguracoes } from "@/lib/queries/configuracoes";

export default async function ConfiguracoesPage() {
  const [estado, diagnostico] = await Promise.all([
    carregarConfiguracoes(),
    carregarDiagnostico(),
  ]);

  return (
    <>
      <CabecalhoPagina
        icone={Settings}
        titulo="Configurações"
        subtitulo="Todo parâmetro do método, editável"
      />
      <PainelConfiguracoes estado={estado} diagnostico={diagnostico} />
    </>
  );
}
