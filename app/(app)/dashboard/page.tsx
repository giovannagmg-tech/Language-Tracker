import { LayoutDashboard } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { SeletorRecorte } from "@/components/dashboard/seletor-recorte";
import {
  BarrasIdiomas,
  BarrasPilares,
  ColunasSerie,
  Colunas,
  DonutTempos,
} from "@/components/graficos/charts";
import { MolduraGrafico } from "@/components/graficos/moldura";
import {
  AnelProgresso,
  BarraComposicao,
  GradeCalor,
  NumeroGrande,
} from "@/components/graficos/primitivos";
import { bordaDoIdioma } from "@/components/ui/idioma";
import { fmtDataCurta, fmtHoras, fmtPct, fmtPct0 } from "@/lib/formatadores";
import { chaveSemana, intervalo, somaDias } from "@/lib/domain/datas";
import { ROTULO_PILAR, ROTULO_TEMPO, type Pilar, type TempoDoDia } from "@/lib/domain/tipos";
import { carregarDashboard, type Recorte } from "@/lib/queries/dashboard";

const CORES_PILAR: Record<Pilar, string> = {
  vocabulario: "var(--pilar-vocabulario)",
  gramatica: "var(--pilar-gramatica)",
  pronuncia: "var(--pilar-pronuncia)",
  fala: "var(--pilar-fala)",
};

const CORES_TEMPO: Record<TempoDoDia, string> = {
  cadeira: "var(--pilar-vocabulario)",
  maos_livres: "var(--pilar-gramatica)",
  maos_ocupadas: "var(--pilar-pronuncia)",
};

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function ehRecorte(v: string | undefined): v is Recorte {
  return v === "semana" || v === "mes" || v === "ano";
}

function delta(atual: number, anterior: number, maiorMelhor = true) {
  if (anterior === 0 && atual === 0) return null;
  const diff = atual - anterior;
  if (Math.abs(diff) < 0.0001) return null;
  const seta = diff > 0 ? "↑" : "↓";
  return { texto: `${seta} ${Math.abs(Math.round(diff))}`, melhor: maiorMelhor ? diff > 0 : diff < 0 };
}

/** Semanas do período, cada uma com seus sete dias — grade do calendário de calor. */
function semanasDoPeriodo(inicio: string, fim: string) {
  const primeira = chaveSemana(inicio);
  const ultima = chaveSemana(fim);
  const semanas: { inicio: string; dias: string[] }[] = [];
  let cursor = primeira;
  while (cursor <= ultima) {
    semanas.push({ inicio: cursor, dias: intervalo(cursor, somaDias(cursor, 6)) });
    cursor = somaDias(cursor, 7);
  }
  return semanas;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ recorte?: string; ref?: string }>;
}) {
  const { recorte: recorteBruto, ref } = await searchParams;
  const recorte: Recorte = ehRecorte(recorteBruto) ? recorteBruto : "semana";
  const e = await carregarDashboard(recorte, ref);

  const nomeIdioma = (id: string) => e.idiomas.find((i) => i.id === id)?.nome ?? "—";
  const corIdioma = (slug: string) => `var(--idioma-${slug})`;

  return (
    <>
      <CabecalhoPagina
        icone={LayoutDashboard}
        titulo="Dashboard"
        subtitulo="Semana, mês e ano — o mesmo vocabulário visual"
      />

      <SeletorRecorte
        recorte={e.recorte}
        rotuloPeriodo={e.rotuloPeriodo}
        anterior={e.anterior}
        proximo={e.proximo}
      />

      {/* A. quatro números */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NumeroGrande
          rotulo="Horas totais"
          valor={fmtHoras(e.composicao.total)}
          contexto={`mediana de ${Math.round(e.medianaDiaria)} min por dia ativo`}
          delta={delta(e.composicao.total, e.composicaoAnterior.total)}
        />
        <NumeroGrande
          rotulo="Em estudo ativo"
          valor={fmtPct(e.composicao.pctAtivo)}
          contexto={`meta ${fmtPct0(e.metaPctAtivo)}`}
          delta={delta(e.composicao.pctAtivo * 100, e.composicaoAnterior.pctAtivo * 100)}
        />
        <NumeroGrande
          rotulo="Dias com registro"
          valor={`${e.cobertura.diasComRegistro}`}
          contexto={`de ${e.cobertura.diasNoPeriodo} dias`}
          delta={delta(e.cobertura.diasComRegistro, e.coberturaAnterior.diasComRegistro)}
        />
        <NumeroGrande
          rotulo="Maior lacuna"
          valor={`${e.cobertura.lacuna.dias} ${e.cobertura.lacuna.dias === 1 ? "dia" : "dias"}`}
          contexto={
            e.cobertura.lacuna.dias > 0
              ? `${fmtDataCurta(e.cobertura.lacuna.inicio)} a ${fmtDataCurta(e.cobertura.lacuna.fim)}`
              : "sem buraco no período"
          }
          delta={delta(e.cobertura.lacuna.dias, e.coberturaAnterior.lacuna.dias, false)}
        />
      </div>

      {/* L. diagnóstico */}
      <section className="mb-6 rounded-card border border-borda bg-superficie-2 p-6">
        <h2 className="mb-3 text-rotulo uppercase text-texto-3">O que este período diz</h2>
        <ul className="space-y-2">
          {e.diagnostico.map((d) => (
            <li key={d.chave} className="flex flex-wrap items-baseline gap-2 text-corpo text-texto">
              <span>{d.texto}</span>
              <a
                href={`#${d.alvo}`}
                className="text-pequeno text-texto-3 underline underline-offset-2 hover:text-texto-2"
              >
                ver
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <MolduraGrafico
          ancora="composicao"
          titulo="Ativo, flashcards e imersão"
          subtitulo="A ordem nunca muda, para dois períodos ficarem comparáveis"
          altura={200}
          className="lg:col-span-2"
          tabela={{
            colunas: ["Categoria", "Tempo", "Fatia"],
            linhas: [
              ["Estudo ativo", fmtHoras(e.composicao.ativo), fmtPct(e.composicao.pctAtivo)],
              ["Flashcards", fmtHoras(e.composicao.flashcards), fmtPct(e.composicao.pctFlashcards)],
              ["Imersão", fmtHoras(e.composicao.imersao), fmtPct(e.composicao.pctImersao)],
              ["Total", fmtHoras(e.composicao.total), "100%"],
            ],
          }}
        >
          <BarraComposicao
            ativo={e.composicao.ativo}
            flashcards={e.composicao.flashcards}
            imersao={e.composicao.imersao}
            total={e.composicao.total}
            meta={e.metaPctAtivo}
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="serie"
          titulo="Horas ao longo do período"
          subtitulo={
            e.granularidade === "semana" ? "Uma coluna por semana ISO" : "Uma coluna por dia"
          }
          altura={300}
          className="lg:col-span-2"
          legenda={[
            { rotulo: "Estudo ativo", cor: "var(--grafico-ativo)" },
            { rotulo: "Flashcards", cor: "var(--grafico-flashcards)" },
            { rotulo: "Imersão", cor: "var(--grafico-imersao)" },
          ]}
          tabela={{
            colunas: ["Data", "Ativo", "Flashcards", "Imersão", "Total"],
            linhas: e.serie
              .filter((p) => p.total > 0)
              .map((p) => [fmtDataCurta(p.rotulo), p.ativo, p.flashcards, p.imersao, p.total]),
          }}
        >
          <ColunasSerie dados={e.serie} faixas={e.faixasMarcha} mediana={e.medianaDiaria} />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="pilares"
          titulo="Pilares: real contra o alvo"
          subtitulo="Barra cheia é o realizado; a clara é o alvo"
          altura={240}
          legenda={[
            { rotulo: "Vocabulário", cor: CORES_PILAR.vocabulario },
            { rotulo: "Gramática", cor: CORES_PILAR.gramatica },
            { rotulo: "Pronúncia", cor: CORES_PILAR.pronuncia },
            { rotulo: "Fala", cor: CORES_PILAR.fala },
          ]}
          tabela={{
            colunas: ["Pilar", "Real", "Alvo", "Desvio"],
            linhas: e.pilares.map((p) => [
              ROTULO_PILAR[p.pilar],
              fmtPct(p.real),
              fmtPct(p.alvo),
              `${p.desvio >= 0 ? "+" : ""}${Math.round(p.desvio * 100)} pp`,
            ]),
          }}
        >
          <BarrasPilares
            dados={e.pilares.map((p) => ({
              pilar: ROTULO_PILAR[p.pilar],
              real: p.real,
              alvo: p.alvo,
              minutos: p.minutos,
              cor: CORES_PILAR[p.pilar],
            }))}
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="tempos"
          titulo="Os três tempos"
          subtitulo="Onde o tempo que você acha que não tem realmente está"
          altura={240}
          legenda={e.tempos.map((t) => ({
            rotulo: ROTULO_TEMPO[t.tempo],
            cor: CORES_TEMPO[t.tempo],
          }))}
          tabela={{
            colunas: ["Tempo", "Duração", "Fatia"],
            linhas: e.tempos.map((t) => [ROTULO_TEMPO[t.tempo], fmtHoras(t.minutos), fmtPct(t.pct)]),
          }}
        >
          <DonutTempos
            centro={fmtPct0(e.tempos.find((t) => t.tempo === "cadeira")?.pct ?? 0)}
            dados={e.tempos.map((t) => ({
              tempo: ROTULO_TEMPO[t.tempo],
              minutos: t.minutos,
              pct: t.pct,
              cor: CORES_TEMPO[t.tempo],
            }))}
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="idiomas"
          titulo="Horas por idioma"
          altura={200}
          tabela={{
            colunas: ["Idioma", "Tempo", "Fatia"],
            linhas: e.porIdioma.map((i) => [nomeIdioma(i.idiomaId), fmtHoras(i.minutos), fmtPct(i.pct)]),
          }}
        >
          <BarrasIdiomas
            dados={e.porIdioma.map((i) => {
              const idioma = e.idiomas.find((x) => x.id === i.idiomaId);
              return {
                idioma: idioma?.nome ?? "—",
                minutos: i.minutos,
                alvo: null,
                cor: idioma ? corIdioma(idioma.slug) : "var(--imersao)",
              };
            })}
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="fala"
          titulo="Minutos de fala por semana"
          subtitulo={`Média de ${Math.round(e.mediaFala)} min · meta ${e.metaFalaSemana}`}
          altura={240}
          tabela={{
            colunas: ["Semana de", "Minutos"],
            linhas: e.fala.map((s) => [fmtDataCurta(s.semana), Math.round(s.valor)]),
          }}
        >
          <Colunas
            dados={e.fala.map((s) => ({ rotulo: s.semana, valor: s.valor }))}
            meta={e.metaFalaSemana}
            rotuloMeta={`meta ${e.metaFalaSemana}`}
            formato="min"
            rotuloComo="data"
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="flashcards"
          titulo="Dias com flashcards"
          subtitulo={`Média de ${e.mediaFlashcards.toFixed(1).replace(".", ",")} dias por semana · meta ${e.metaFlashSemana}`}
          altura={240}
          tabela={{
            colunas: ["Semana de", "Dias"],
            linhas: e.flashcards.map((s) => [fmtDataCurta(s.semana), s.valor]),
          }}
        >
          <Colunas
            dados={e.flashcards.map((s) => ({ rotulo: s.semana, valor: s.valor }))}
            meta={e.metaFlashSemana}
            rotuloMeta={`meta ${e.metaFlashSemana}`}
            formato="dias"
            rotuloComo="data"
            corAcima="var(--grafico-flashcards)"
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="hora"
          titulo="Por hora do dia"
          subtitulo={
            e.porHora.pico !== null ? `Pico às ${e.porHora.pico}h` : "Sem horário registrado"
          }
          altura={220}
          tabela={{
            colunas: ["Hora", "Minutos"],
            linhas: e.porHora.horas
              .map((v, h) => [`${h}h`, v] as [string, number])
              .filter(([, v]) => v > 0),
          }}
        >
          <Colunas
            dados={e.porHora.horas.map((v, h) => ({
              rotulo: `${h}`,
              valor: v,
              destaque: h === e.porHora.pico,
            }))}
            formato="min"
            rotuloComo="hora"
            corNeutra="var(--cor-borda-forte)"
            corAcima="var(--grafico-ativo)"
          />
        </MolduraGrafico>

        <MolduraGrafico
          ancora="dia-semana"
          titulo="Por dia da semana"
          subtitulo={
            e.porDiaSemana.maisForte
              ? `${DIAS_SEMANA[e.porDiaSemana.maisForte - 1]} é o mais forte · ${DIAS_SEMANA[(e.porDiaSemana.maisFraco ?? 1) - 1]} o mais fraco`
              : "Sem registro no período"
          }
          altura={220}
          tabela={{
            colunas: ["Dia", "Minutos"],
            linhas: e.porDiaSemana.dias.map((v, i) => [DIAS_SEMANA[i], v]),
          }}
        >
          <Colunas
            dados={e.porDiaSemana.dias.map((v, i) => ({
              rotulo: DIAS_SEMANA[i],
              valor: v,
              destaque: i + 1 === e.porDiaSemana.maisForte,
            }))}
            formato="min"
            corNeutra="var(--cor-borda-forte)"
            corAcima="var(--grafico-ativo)"
          />
        </MolduraGrafico>
      </div>

      {/* I. camadas por idioma */}
      <section id="camadas" className="mt-6">
        <h2 className="mb-4 text-h2 text-texto">Palavras e camadas</h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {e.camadas.map((c) => (
            <div
              key={c.idioma.id}
              className="rounded-card border border-borda bg-superficie p-6 shadow-card"
              style={bordaDoIdioma(c.idioma)}
            >
              <p className="mb-4 text-h3 text-texto">
                <span className="mr-2">{c.idioma.bandeira}</span>
                {c.idioma.nome}
              </p>
              <AnelProgresso
                progresso={c.progresso.progresso}
                cor="var(--meta-longo)"
                absoluto={`${c.progresso.acumulado} / ${c.progresso.proxima?.limiar ?? c.progresso.acumulado} palavras`}
                contexto={
                  c.progresso.proxima
                    ? `${c.progresso.camada?.nome ?? "antes da camada 1"} · faltam ${c.progresso.faltam} para ${c.progresso.proxima.nome}`
                    : `${c.progresso.camada?.nome ?? ""} — última camada`
                }
              />
              <p className="mt-4 border-t border-borda pt-4 text-pequeno text-texto-2">
                {c.progresso.regua}
              </p>
              <p className="mt-1 text-pequeno text-texto-2">
                {c.projecaoDias === null
                  ? "Nesse ritmo, nunca."
                  : c.projecaoDias === 0
                    ? "Camada atingida."
                    : `Nesse ritmo, ${c.projecaoDias} dias.`}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* H. calendário de calor */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <MolduraGrafico
          titulo="Calendário de flashcards"
          subtitulo="Célula cheia é dia com revisão — o indicador é frequência, não volume"
          altura={260}
          tabela={{
            colunas: ["Semana de", "Dias com flashcards"],
            linhas: e.flashcards.map((s) => [fmtDataCurta(s.semana), s.valor]),
          }}
        >
          <GradeCalor
            semanas={semanasDoPeriodo(e.periodo.inicio, e.periodo.fim)}
            diasMarcados={new Set(e.diasComFlashcards)}
          />
        </MolduraGrafico>

        <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h3 className="text-h2 text-texto">Concentração</h3>
          <p className="mt-0.5 text-pequeno text-texto-2">
            Quanto do período cabe nos maiores dias
          </p>
          <p className="mt-4 text-display text-texto">{fmtPct0(e.concentracaoTop3.pct)}</p>
          <p className="text-pequeno text-texto-2">nos três maiores dias</p>
          <ul className="mt-4 space-y-1.5 border-t border-borda pt-4">
            {e.concentracaoTop10.dias.slice(0, 5).map((d) => (
              <li key={d.data} className="flex justify-between text-pequeno">
                <span className="text-texto-2">{fmtDataCurta(d.data)}</span>
                <span className="tabular text-texto">{fmtHoras(d.minutos)}</span>
              </li>
            ))}
            {e.concentracaoTop10.dias.length === 0 ? (
              <li className="text-pequeno text-texto-2">Nenhum dia com registro.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </>
  );
}
