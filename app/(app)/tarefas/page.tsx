import { ListTodo } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { ListaTarefasCompleta } from "@/components/tarefas/lista";
import { NovaTarefa } from "@/components/tarefas/nova-tarefa";
import { sincronizarTarefas } from "@/lib/motores/tarefas";
import { carregarTarefas } from "@/lib/queries/tarefas";

export default async function TarefasPage() {
  // O motor roda ao abrir a tela; é idempotente por construção (RN-802).
  // Chamado direto do motor, não pela Server Action: revalidar durante o
  // render é erro em tempo de execução.
  await sincronizarTarefas();
  const e = await carregarTarefas();

  return (
    <>
      <CabecalhoPagina
        icone={ListTodo}
        titulo="Tarefas"
        subtitulo="O que as regras cobraram e o que você decidiu fazer"
        acoes={<NovaTarefa idiomas={e.idiomas} hoje={e.hoje} />}
      />

      <div className="space-y-6">
        <ListaTarefasCompleta
          titulo="Geradas pelas regras"
          descricao="Título e critério vêm do método — dá para concluir, adiar uma vez ou dispensar"
          tarefas={e.automaticas}
          idiomas={e.idiomas}
          hoje={e.hoje}
          vazio="Nada pendente. As regras geram tarefa sozinhas quando precisar."
        />

        <ListaTarefasCompleta
          titulo="Minhas tarefas"
          descricao="As que você criou"
          tarefas={e.manuais}
          idiomas={e.idiomas}
          hoje={e.hoje}
          vazio="Nenhuma tarefa sua por aqui."
        />
      </div>
    </>
  );
}
