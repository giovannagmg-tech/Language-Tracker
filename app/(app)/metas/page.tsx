import { Target } from "lucide-react";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { AnelProgresso } from "@/components/graficos/primitivos";
import { Autoavaliacao } from "@/components/metas/autoavaliacao";
import { EditorPalavras } from "@/components/metas/editor-palavras";
import { MetasLivres } from "@/components/metas/metas-livres";
import { bordaDoIdioma } from "@/components/ui/idioma";
import { corDaMeta, corDoEstado } from "@/lib/domain/metas";
import { degrausAte } from "@/lib/domain/niveis";
import { ROTULO_PILAR } from "@/lib/domain/tipos";
import { fmtPct } from "@/lib/formatadores";
import { carregarMetas, type MetaPainel } from "@/lib/queries/metas";
import { cn } from "@/lib/utils";

function valorFormatado(m: MetaPainel, valor: number): string {
  if (m.formato === "percentual") return fmtPct(valor);
  if (m.formato === "dias") return `${Math.round(valor)}`;
  return `${Math.round(valor)}`;
}

export default async function MetasPage() {
  const e = await carregarMetas();
  const rosa = corDaMeta("mensal");
  const laranja = corDaMeta("longo_prazo");
  const azul = corDaMeta("semanal");
  const focoIdioma = e.idiomas.find((i) => i.id === e.foco.idiomaId);

  return (
    <>
      <CabecalhoPagina
        icone={Target}
        titulo="Metas"
        subtitulo="Palavras, nível, conversação e o painel mensal"
      />

      <MetasLivres
        metas={e.metasLivres}
        idiomas={e.idiomas}
        resumo={e.resumoMetasLivres}
      />

      {/* Painel mensal — cinco indicadores, cor rosa */}
      <section className="mb-8">
        <h2 className="mb-4 text-h2 text-texto">Painel mensal</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {e.painelMensal.map((m) => (
            <div
              key={m.id}
              className="rounded-card border border-borda bg-superficie p-5 text-center shadow-card"
            >
              <p className="mb-3 text-rotulo uppercase text-texto-3">{m.titulo}</p>
              <AnelProgresso
                progresso={m.progresso.progresso}
                cor={rosa.forte}
                diametro={116}
                espessura={9}
                absoluto={`${valorFormatado(m, m.progresso.atual)} / ${valorFormatado(m, m.progresso.alvo)}`}
                contexto={`base ${valorFormatado(m, m.progresso.base)}`}
              />
              <p
                className="mt-2 text-pequeno font-medium"
                style={{ color: corDoEstado(m.progresso.estado) }}
              >
                {m.progresso.atingida
                  ? "atingida"
                  : m.progresso.direcao === "menor_melhor"
                    ? `faltam ${Math.round(m.progresso.faltam)} para baixo`
                    : `faltam ${valorFormatado(m, m.progresso.faltam)}`}
              </p>
            </div>
          ))}
          {e.painelMensal.length === 0 ? (
            <p className="text-pequeno text-texto-2">Nenhuma meta do painel mensal ativa.</p>
          ) : null}
        </div>
      </section>

      {/* Palavras — cor laranja, longo prazo */}
      <section className="mb-8">
        <h2 className="mb-4 text-h2 text-texto">Palavras e camadas</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {e.palavras.map((p) => (
            <div
              key={p.idioma.id}
              className="rounded-card border border-borda bg-superficie p-6 shadow-card"
              style={bordaDoIdioma(p.idioma)}
            >
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <p className="text-h3 text-texto">
                  <span className="mr-2">{p.idioma.bandeira}</span>
                  {p.idioma.nome}
                </p>
                <EditorPalavras idiomaId={p.idioma.id} valorInicial={p.metaDia} />
              </div>

              <AnelProgresso
                progresso={p.camada.progresso}
                cor={laranja.forte}
                absoluto={`${p.camada.acumulado} / ${p.camada.proxima?.limiar ?? p.camada.acumulado} palavras`}
                contexto={
                  p.camada.proxima
                    ? `${p.camada.camada?.nome ?? "antes da camada 1"} · faltam ${p.camada.faltam} para ${p.camada.proxima.nome}`
                    : `${p.camada.camada?.nome ?? ""} — última camada`
                }
              />

              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-borda pt-4">
                {[
                  { rotulo: "Meta/dia", valor: `${p.metaDia}` },
                  { rotulo: "Hoje", valor: `${p.feitoHoje}` },
                  { rotulo: "Média 7d", valor: p.media7d.toFixed(1).replace(".", ",") },
                ].map((item) => (
                  <div key={item.rotulo}>
                    <dt className="text-rotulo uppercase text-texto-3">{item.rotulo}</dt>
                    <dd className="mt-0.5 text-numero-sm text-texto">{item.valor}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-pequeno text-texto-2">
                {p.projecaoDias === null
                  ? "Nesse ritmo, nunca."
                  : p.projecaoDias === 0
                    ? "Camada atingida."
                    : `Nesse ritmo, ${p.projecaoDias} dias até ${p.camada.proxima?.nome ?? "a próxima"}.`}
              </p>
              <p className="mt-1 text-pequeno text-texto-3">{p.camada.regua}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nível — cor laranja, com autoavaliação */}
      <section className="mb-8">
        <h2 className="mb-4 text-h2 text-texto">Nível</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {e.niveis.map((n) => {
            const degraus = degrausAte(n.inicial, n.meta);
            const iAtual = degraus.indexOf(n.atual);
            return (
              <div
                key={n.idioma.id}
                className="rounded-card border border-borda bg-superficie p-6 shadow-card"
                style={bordaDoIdioma(n.idioma)}
              >
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <p className="text-h3 text-texto">
                    <span className="mr-2">{n.idioma.bandeira}</span>
                    {n.idioma.nome}
                  </p>
                  <span className="text-numero-sm text-texto">{n.atual}</span>
                </div>

                <ol className="flex items-center gap-1">
                  {degraus.map((degrau, i) => (
                    <li key={degrau} className="flex-1">
                      <div
                        className={cn(
                          "h-2 rounded-full",
                          i <= iAtual && iAtual >= 0 ? "" : "bg-superficie-2",
                        )}
                        style={i <= iAtual && iAtual >= 0 ? { background: laranja.forte } : undefined}
                      />
                      <span
                        className={cn(
                          "mt-1.5 block text-center text-rotulo",
                          degrau === n.atual ? "font-bold text-texto" : "text-texto-3",
                        )}
                      >
                        {degrau}
                      </span>
                    </li>
                  ))}
                </ol>

                <p className="mt-4 text-pequeno text-texto-2">
                  {n.dataAlvo
                    ? n.diasRestantes !== null && n.diasRestantes >= 0
                      ? `Meta ${n.meta} até ${n.dataAlvo.split("-").reverse().join("/")} — faltam ${n.diasRestantes} dias.`
                      : `Prazo de ${n.meta} vencido em ${n.dataAlvo.split("-").reverse().join("/")}.`
                    : `Meta ${n.meta}, sem data definida.`}
                </p>

                <div className="mt-3">
                  <Autoavaliacao
                    idiomaId={n.idioma.id}
                    nomeIdioma={n.idioma.nome}
                    blocoId={e.blocoVigenteId}
                    nomeBloco={e.foco.nomeBloco}
                    nivelAtual={n.atual}
                    nivelInicial={n.inicial}
                    nivelMeta={n.meta}
                    pendente={n.autoavaliacaoPendente}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Conversação — cor azul, semanal */}
      <section className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-card border border-borda bg-superficie p-6 text-center shadow-card">
          <p className="mb-3 text-rotulo uppercase text-texto-3">Conversações na semana</p>
          <AnelProgresso
            progresso={e.conversacao.conversasSemana.progresso}
            cor={azul.forte}
            diametro={116}
            espessura={9}
            absoluto={`${e.conversacao.conversasSemana.atual} / ${e.conversacao.conversasSemana.alvo}`}
            contexto="conversação ou aula"
          />
        </div>

        <div className="rounded-card border border-borda bg-superficie p-6 text-center shadow-card">
          <p className="mb-3 text-rotulo uppercase text-texto-3">Minutos de fala na semana</p>
          <AnelProgresso
            progresso={e.conversacao.falaSemana.progresso}
            cor={azul.forte}
            diametro={116}
            espessura={9}
            absoluto={`${Math.round(e.conversacao.falaSemana.atual)} / ${e.conversacao.falaSemana.alvo} min`}
            contexto="toda sessão conta"
          />
        </div>

        <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <p className="mb-3 text-rotulo uppercase text-texto-3">Áudio no grupo</p>
          <p className="text-display text-texto">{e.conversacao.audioSemana ? "Feito" : "Falta"}</p>
          <p className="mt-2 text-pequeno text-texto-2">
            {e.conversacao.audioSemana
              ? "O áudio desta semana já foi."
              : "Um por semana, feio mesmo."}
          </p>
        </div>
      </section>

      {/* Foco em Distribuição */}
      <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-h2 text-texto">Foco em Distribuição</h2>
            <p className="mt-2 text-corpo text-texto">
              {focoIdioma || e.foco.pilar ? (
                <>
                  {focoIdioma ? (
                    <span className="font-semibold">
                      {focoIdioma.bandeira} {focoIdioma.nome}
                    </span>
                  ) : null}
                  {focoIdioma && e.foco.pilar ? " · " : ""}
                  {e.foco.pilar ? (
                    <span className="font-semibold">{ROTULO_PILAR[e.foco.pilar]}</span>
                  ) : null}
                </>
              ) : (
                <span className="text-texto-2">Nenhum foco definido para o mês.</span>
              )}
            </p>
            {e.foco.nota ? (
              <p className="mt-1 text-pequeno text-texto-2">{e.foco.nota}</p>
            ) : null}
          </div>
          <Link
            href="/distribuicao"
            className="shrink-0 text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
          >
            editar na Planilha
          </Link>
        </div>
      </section>
    </>
  );
}
