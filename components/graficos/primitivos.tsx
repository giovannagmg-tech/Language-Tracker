"use client";

import { cn } from "@/lib/utils";

import { fmtDataCurta, fmtHoras, fmtPct, fmtPct0 } from "@/lib/formatadores";

/**
 * Número-herói. Figuras proporcionais de propósito: `tabular-nums` num
 * tamanho de display faz "121" parecer frouxo.
 */
export function NumeroGrande({
  valor,
  rotulo,
  contexto,
  delta,
  className,
}: {
  valor: string;
  rotulo: string;
  contexto?: string;
  delta?: { texto: string; melhor: boolean } | null;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-borda bg-superficie p-5 shadow-card", className)}>
      <p className="text-rotulo uppercase text-texto-3">{rotulo}</p>
      <p className="mt-1 text-numero text-texto">{valor}</p>
      <div className="mt-1 flex items-baseline gap-2">
        {contexto ? <span className="text-pequeno text-texto-2">{contexto}</span> : null}
        {delta ? (
          <span
            className={cn(
              "text-pequeno font-medium",
              delta.melhor ? "text-sucesso" : "text-texto-3",
            )}
          >
            {delta.texto}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * RN-701. Barra empilhada única: a composição do período em uma linha.
 * A ordem — ativo, flashcards, imersão — nunca muda, para dois períodos
 * ficarem comparáveis de relance. A meta de 35% fica sempre desenhada.
 */
export function BarraComposicao({
  ativo,
  flashcards,
  imersao,
  total,
  meta,
}: {
  ativo: number;
  flashcards: number;
  imersao: number;
  total: number;
  meta: number;
}) {
  if (total === 0) {
    return (
      <div className="flex h-full flex-col justify-center">
        <div className="h-10 w-full rounded-[6px] bg-superficie-2" />
        <p className="mt-3 text-pequeno text-texto-2">Nenhum minuto registrado no período.</p>
      </div>
    );
  }

  const fatias = [
    { chave: "ativo", rotulo: "Estudo ativo", minutos: ativo, cor: "var(--grafico-ativo)" },
    { chave: "flashcards", rotulo: "Flashcards", minutos: flashcards, cor: "var(--grafico-flashcards)" },
    { chave: "imersao", rotulo: "Imersão", minutos: imersao, cor: "var(--grafico-imersao)" },
  ].filter((f) => f.minutos > 0);

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="relative">
        <div className="flex h-10 w-full gap-[2px] overflow-hidden rounded-[6px]">
          {fatias.map((f) => (
            <div
              key={f.chave}
              style={{ background: f.cor, width: `${(f.minutos / total) * 100}%` }}
              title={`${f.rotulo}: ${fmtHoras(f.minutos)} (${fmtPct(f.minutos / total)})`}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute -top-1 bottom-[-6px] w-[2px] bg-texto"
          style={{ left: `calc(${meta * 100}% - 1px)` }}
          aria-hidden
        />
        <span
          className="absolute -top-5 text-rotulo uppercase text-texto"
          style={{ left: `calc(${meta * 100}% - 1px)` }}
        >
          meta {fmtPct0(meta)}
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-4">
        {[
          { rotulo: "Ativo", minutos: ativo, cor: "var(--grafico-ativo)" },
          { rotulo: "Flashcards", minutos: flashcards, cor: "var(--grafico-flashcards)" },
          { rotulo: "Imersão", minutos: imersao, cor: "var(--grafico-imersao)" },
        ].map((f) => (
          <div key={f.rotulo}>
            <dt className="flex items-center gap-1.5 text-rotulo uppercase text-texto-3">
              <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: f.cor }} />
              {f.rotulo}
            </dt>
            <dd className="mt-1 text-numero-sm text-texto">{fmtPct(f.minutos / total)}</dd>
            <dd className="text-pequeno text-texto-2">{fmtHoras(f.minutos)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Calendário de calor. O indicador é binário — teve flashcards ou não —,
 * então a célula não tem escala de intensidade.
 */
export function GradeCalor({
  semanas,
  diasMarcados,
}: {
  semanas: { inicio: string; dias: string[] }[];
  diasMarcados: Set<string>;
}) {
  const nomes = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2">
      <div className="grid w-full max-w-[240px] grid-cols-7 gap-1.5 text-center">
        {nomes.map((n, i) => (
          <span key={i} className="text-rotulo uppercase text-texto-3">
            {n}
          </span>
        ))}
      </div>
      <div className="w-full max-w-[240px] space-y-1.5">
        {semanas.map((semana) => (
          <div key={semana.inicio} className="grid grid-cols-7 gap-1.5">
            {semana.dias.map((dia) => {
              const marcado = diasMarcados.has(dia);
              return (
                <div
                  key={dia}
                  title={`${fmtDataCurta(dia)}${marcado ? " · flashcards" : " · sem flashcards"}`}
                  className={cn(
                    "aspect-square rounded-[4px]",
                    marcado ? "bg-grafico-flashcards" : "bg-superficie-2",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Medidor de anel — o componente-assinatura do design system (docs/07, 2.4).
 * O percentual grande no centro, o valor absoluto embaixo, e o percentual
 * repetido em negrito. A repetição é intencional.
 *
 * O documento fixa 44px no centro do anel **grande** (160px). O anel compacto
 * (116px) herdava o mesmo tamanho, e "100%" a 44px mede mais que o vão interno
 * de 98px — o número vazava por cima do traço. O corpo agora sai do diâmetro:
 * 0,275 × 160 = 44px, exatamente o valor do documento, e o compacto encolhe
 * junto em vez de estourar.
 */
export function AnelProgresso({
  progresso,
  cor,
  absoluto,
  contexto,
  diametro = 160,
  espessura = 12,
}: {
  progresso: number;
  cor: string;
  absoluto: string;
  contexto: string;
  diametro?: number;
  espessura?: number;
}) {
  const raio = (diametro - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = Math.min(1, Math.max(0, progresso));
  const corpoCentro = Math.round(diametro * 0.275);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: diametro, height: diametro }}>
        <svg width={diametro} height={diametro} role="img" aria-label={`${fmtPct0(progresso)} — ${absoluto}`}>
          <circle
            cx={diametro / 2}
            cy={diametro / 2}
            r={raio}
            fill="none"
            stroke="var(--cor-superficie-2)"
            strokeWidth={espessura}
          />
          <circle
            cx={diametro / 2}
            cy={diametro / 2}
            r={raio}
            fill="none"
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={`${circunferencia * preenchido} ${circunferencia}`}
            transform={`rotate(-90 ${diametro / 2} ${diametro / 2})`}
          />
        </svg>
        <span
          className="absolute inset-0 grid place-items-center font-bold tabular text-texto"
          style={{
            fontSize: `${corpoCentro}px`,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {fmtPct0(progresso)}
        </span>
      </div>
      <p className="mt-3 max-w-full text-balance text-numero-sm text-texto">{absoluto}</p>
      <p className="mt-0.5 max-w-full text-balance text-pequeno text-texto-2">{contexto}</p>
      <p className="mt-1 text-corpo font-semibold text-texto">{fmtPct0(progresso)}</p>
    </div>
  );
}
