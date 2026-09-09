import { Upload } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { AssistenteDeImportacao } from "@/components/importacao/assistente";
import { HistoricoDeLotes } from "@/components/importacao/lotes";
import { ROTULO_ATIVIDADE } from "@/lib/domain/tipos";
import { carregarImportacao } from "@/lib/queries/toggl";

const ROTULO_CAMPO: Record<string, string> = {
  project: "Projeto",
  description: "Descrição",
  tags: "Tags",
  client: "Cliente",
  task: "Tarefa",
};

export default async function ImportacaoPage() {
  const e = await carregarImportacao();

  return (
    <>
      <CabecalhoPagina
        icone={Upload}
        titulo="Importação do Toggl"
        subtitulo="Trazer o histórico sem duplicar o que já existe"
      />

      <div className="space-y-6">
        <AssistenteDeImportacao idiomas={e.idiomas} />

        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="text-h2 text-texto">Regras de mapeamento</h2>
          <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
            Rodam em ordem crescente; a última que casa vence
          </p>

          {e.regras.length === 0 ? (
            <p className="text-corpo text-texto-2">Nenhuma regra cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-pequeno">
                <thead>
                  <tr className="border-b border-borda">
                    {["Ordem", "Campo", "Operador", "Valor", "Saída"].map((h) => (
                      <th key={h} scope="col" className="py-2 text-left text-rotulo uppercase text-texto-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {e.regras.map((r) => {
                    const idioma = e.idiomas.find((i) => i.id === r.saidaIdioma);
                    return (
                      <tr key={r.id} className="border-b border-borda last:border-0">
                        <td className="py-2 tabular text-texto-3">{r.ordem}</td>
                        <td className="py-2 text-texto-2">{ROTULO_CAMPO[r.campo] ?? r.campo}</td>
                        <td className="py-2 text-texto-3">{r.operador}</td>
                        <td className="py-2 text-texto">{r.valor}</td>
                        <td className="py-2 text-texto-2">
                          {idioma ? `${idioma.bandeira} ${idioma.nome}` : ""}
                          {r.saidaAtividade ? ROTULO_ATIVIDADE[r.saidaAtividade] : ""}
                          {!idioma && !r.saidaAtividade ? "—" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="mb-4 text-h2 text-texto">Importações anteriores</h2>
          <HistoricoDeLotes lotes={e.lotes} />
        </section>
      </div>
    </>
  );
}
