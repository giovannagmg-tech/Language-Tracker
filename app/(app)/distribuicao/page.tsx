import { PieChart } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/cabecalho-pagina";
import { FocoDoMes } from "@/components/distribuicao/foco-do-mes";
import { TabelaPercentuais } from "@/components/distribuicao/tabela-percentuais";
import { corDaFaixa, type Desvio } from "@/lib/domain/distribuicao";
import { ROTULO_PILAR, type Pilar } from "@/lib/domain/tipos";
import { fmtDataCurta } from "@/lib/formatadores";
import { carregarDistribuicao } from "@/lib/queries/distribuicao";

export default async function DistribuicaoPage() {
  const e = await carregarDistribuicao();

  const realPilar = Object.fromEntries(e.desviosPilar.map((d) => [d.chave, d.realizado / 100]));
  const realIdioma = Object.fromEntries(e.desviosIdioma.map((d) => [d.chave, d.realizado / 100]));

  const nomeIdioma = (id: string) => e.idiomas.find((i) => i.id === id)?.nome ?? "—";
  const corIdioma = (id: string) => {
    const i = e.idiomas.find((x) => x.id === id);
    return i ? `var(--idioma-${i.slug})` : "var(--imersao)";
  };

  const grupos: {
    titulo: string;
    desvios: Desvio[];
    rotular: (chave: string) => string;
    cor: (chave: string) => string;
  }[] = [
    {
      titulo: "Pilares",
      desvios: e.desviosPilar,
      rotular: (c) => ROTULO_PILAR[c as Pilar],
      cor: (c) => `var(--pilar-${c})`,
    },
    {
      titulo: "Idiomas",
      desvios: e.desviosIdioma,
      rotular: nomeIdioma,
      cor: corIdioma,
    },
  ];

  return (
    <>
      <CabecalhoPagina
        icone={PieChart}
        titulo="Planilha de Distribuição"
        subtitulo="Para onde o tempo deve ir — e para onde ele foi"
      />

      <section className="mb-6 rounded-card border border-borda bg-superficie-2 p-6">
        {e.blocoVigente ? (
          <p className="text-corpo text-texto">
            Bloco vigente: <span className="font-semibold">{e.blocoVigente.nome}</span> ·{" "}
            {fmtDataCurta(e.blocoVigente.dataInicio)} a {fmtDataCurta(e.blocoVigente.dataFim)}
            <span className="ml-2 text-texto-2">realizado de {e.periodoRealizado.rotulo}</span>
          </p>
        ) : (
          <p className="text-corpo text-texto-2">
            Nenhum bloco do plano cobre hoje. Os alvos por idioma ficam sem bloco de referência.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <TabelaPercentuais
          titulo="Divisão por pilar"
          subtitulo="Vale para todos os blocos"
          dimensao="pilar"
          blocoId={null}
          valores={e.alvoPilar}
          linhas={e.alvoPilar.map((a) => ({
            chave: a.chave,
            rotulo: ROTULO_PILAR[a.chave as Pilar],
            cor: `var(--pilar-${a.chave})`,
            realizado: realPilar[a.chave] ?? 0,
          }))}
        />

        <TabelaPercentuais
          titulo="Divisão por idioma"
          subtitulo={e.blocoVigente ? `Alvo do bloco ${e.blocoVigente.nome}` : "Sem bloco vigente"}
          dimensao="idioma"
          blocoId={e.blocoVigente?.id ?? null}
          valores={e.alvoIdioma}
          linhas={e.alvoIdioma.map((a) => ({
            chave: a.chave,
            rotulo: nomeIdioma(a.chave),
            cor: corIdioma(a.chave),
            realizado: realIdioma[a.chave] ?? 0,
          }))}
        />

        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card lg:col-span-2">
          <h2 className="text-h2 text-texto">Alvo contra realizado</h2>
          <p className="mt-0.5 mb-5 text-pequeno text-texto-2">
            Zero no centro. À esquerda está abaixo do alvo, à direita acima.
          </p>
          <div className="space-y-5">
            {grupos.map((grupo) => (
              <div key={grupo.titulo}>
                <p className="mb-2 text-rotulo uppercase text-texto-3">{grupo.titulo}</p>
                <ul className="space-y-2">
                  {grupo.desvios.map((d) => {
                    const escala = Math.min(50, Math.abs(d.delta)) / 50;
                    return (
                      <li key={d.chave} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-pequeno text-texto-2">
                          {grupo.rotular(d.chave)}
                        </span>
                        <span className="relative h-5 flex-1 rounded-[4px] bg-superficie-2">
                          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-borda-forte" />
                          <span
                            className="absolute inset-y-[3px] rounded-[3px]"
                            style={{
                              background: grupo.cor(d.chave),
                              width: `${escala * 50}%`,
                              left: d.delta >= 0 ? "50%" : undefined,
                              right: d.delta < 0 ? "50%" : undefined,
                            }}
                          />
                        </span>
                        <span
                          className="w-16 shrink-0 text-right text-pequeno font-medium tabular"
                          style={{ color: corDaFaixa(d.faixa) }}
                        >
                          {d.delta > 0 ? "+" : ""}
                          {d.delta} pp
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <FocoDoMes
          blocoId={e.blocoVigente?.id ?? null}
          idiomas={e.idiomas}
          focoIdioma={e.foco.idiomaId}
          focoPilar={e.foco.pilar}
          nota={e.foco.nota}
          sugestao={e.sugestaoFoco}
        />

        <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
          <h2 className="text-h2 text-texto">Blocos do plano</h2>
          <p className="mt-0.5 mb-4 text-pequeno text-texto-2">
            O bloco vigente define o alvo por idioma
          </p>
          <ul className="space-y-2">
            {e.blocos.map((b) => {
              const vigente = b.id === e.blocoVigente?.id;
              const foco = e.idiomas.find((i) => i.id === b.idiomaFoco);
              return (
                <li
                  key={b.id}
                  className={`flex items-baseline justify-between gap-3 rounded-[10px] px-3 py-2 ${
                    vigente ? "bg-lime-100" : ""
                  }`}
                >
                  <span className="text-corpo text-texto">{b.nome}</span>
                  <span className="text-pequeno tabular text-texto-2">
                    {fmtDataCurta(b.dataInicio)} – {fmtDataCurta(b.dataFim)}
                    {foco ? ` · ${foco.bandeira}` : ""}
                  </span>
                </li>
              );
            })}
            {e.blocos.length === 0 ? (
              <li className="text-pequeno text-texto-2">Nenhum bloco cadastrado.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </>
  );
}
