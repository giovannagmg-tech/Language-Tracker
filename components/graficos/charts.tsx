"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDataCurta, fmtHoras, fmtPct } from "@/lib/formatadores";

const EIXO = { fill: "var(--cor-texto-3)", fontSize: 11 };
const GRID = "var(--cor-borda)";
const SUPERFICIE = "var(--cor-superficie)";

type LinhaTooltip = { rotulo: string; valor: string; cor?: string };

function Caixa({ titulo, linhas }: { titulo: string; linhas: LinhaTooltip[] }) {
  return (
    <div className="rounded-[10px] border border-borda bg-superficie px-3 py-2 shadow-popover">
      <p className="mb-1 text-rotulo uppercase text-texto-3">{titulo}</p>
      {linhas.map((l) => (
        <p key={l.rotulo} className="flex items-center gap-2 text-pequeno text-texto">
          {l.cor ? (
            <span aria-hidden className="size-2 rounded-[2px]" style={{ background: l.cor }} />
          ) : null}
          <span className="text-texto-2">{l.rotulo}</span>
          <span className="ml-auto font-medium tabular">{l.valor}</span>
        </p>
      ))}
    </div>
  );
}

type PayloadItem = { name?: string; value?: number; color?: string; payload?: Record<string, unknown> };

// ---------------------------------------------------------------------------

export type DadoPilar = {
  pilar: string;
  real: number;
  alvo: number;
  minutos: number;
  cor: string;
};

/** RN-703. Barras pareadas: realizado cheio, alvo em 25% da mesma cor. */
export function BarrasPilares({ dados }: { dados: DadoPilar[] }) {
  const max = Math.max(0.4, ...dados.map((d) => Math.max(d.real, d.alvo))) * 1.1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barGap={2}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          domain={[0, max]}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
          tick={EIXO}
          axisLine={false}
          tickLine={false}
        />
        <YAxis type="category" dataKey="pilar" tick={EIXO} axisLine={false} tickLine={false} width={92} />
        <Tooltip
          cursor={{ fill: "var(--cor-superficie-2)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as DadoPilar;
            return (
              <Caixa
                titulo={d.pilar}
                linhas={[
                  { rotulo: "Realizado", valor: fmtPct(d.real), cor: d.cor },
                  { rotulo: "Alvo", valor: fmtPct(d.alvo) },
                  { rotulo: "Tempo", valor: fmtHoras(d.minutos) },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="alvo" radius={[0, 4, 4, 0]} fillOpacity={0.25} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={`alvo-${d.pilar}`} fill={d.cor} />
          ))}
        </Bar>
        <Bar dataKey="real" radius={[0, 4, 4, 0]} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={`real-${d.pilar}`} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------

export type DadoTempo = { tempo: string; minutos: number; pct: number; cor: string };

/** RN-709. Donut com três fatias — part-to-whole de relance, nunca comparação fina. */
export function DonutTempos({ dados, centro }: { dados: DadoTempo[]; centro: string }) {
  const total = dados.reduce((t, d) => t + d.minutos, 0);
  if (total === 0) {
    return <p className="grid h-full place-items-center text-pequeno text-texto-2">Sem tempo registrado.</p>;
  }

  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = (payload[0] as PayloadItem).payload as unknown as DadoTempo;
              return (
                <Caixa
                  titulo={d.tempo}
                  linhas={[
                    { rotulo: "Tempo", valor: fmtHoras(d.minutos), cor: d.cor },
                    { rotulo: "Fatia", valor: fmtPct(d.pct) },
                  ]}
                />
              );
            }}
          />
          <Pie
            data={dados}
            dataKey="minutos"
            nameKey="tempo"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke={SUPERFICIE}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {dados.map((d) => (
              <Cell key={d.tempo} fill={d.cor} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-numero text-texto">{centro}</p>
          <p className="text-rotulo uppercase text-texto-3">na cadeira</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export type DadoIdioma = { idioma: string; minutos: number; alvo: number | null; cor: string };

export function BarrasIdiomas({ dados }: { dados: DadoIdioma[] }) {
  if (dados.length === 0) {
    return <p className="grid h-full place-items-center text-pequeno text-texto-2">Sem horas no período.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
          tick={EIXO}
          axisLine={false}
          tickLine={false}
        />
        <YAxis type="category" dataKey="idioma" tick={EIXO} axisLine={false} tickLine={false} width={80} />
        <Tooltip
          cursor={{ fill: "var(--cor-superficie-2)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as DadoIdioma;
            return (
              <Caixa
                titulo={d.idioma}
                linhas={[{ rotulo: "Tempo", valor: fmtHoras(d.minutos), cor: d.cor }]}
              />
            );
          }}
        />
        <Bar dataKey="minutos" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={d.idioma} fill={d.cor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------

export type PontoSerieGrafico = {
  rotulo: string;
  ativo: number;
  flashcards: number;
  imersao: number;
  total: number;
};

export type FaixaMarchaGrafico = { numero: number; inicio: string; fim: string };

/** RN-711. Colunas empilhadas com as faixas de marcha no fundo. */
export function ColunasSerie({
  dados,
  faixas,
  mediana,
}: {
  dados: PontoSerieGrafico[];
  faixas: FaixaMarchaGrafico[];
  mediana: number;
}) {
  const opacidade: Record<number, number> = { 1: 0.08, 2: 0.14, 3: 0.2 };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        {faixas.map((f) => (
          <ReferenceArea
            key={`${f.numero}-${f.inicio}`}
            x1={f.inicio}
            x2={f.fim}
            fill="var(--lime-500)"
            fillOpacity={opacidade[f.numero] ?? 0.08}
            ifOverflow="extendDomain"
            label={{ value: `M${f.numero}`, position: "insideTopLeft", fill: "var(--cor-texto-3)", fontSize: 10 }}
          />
        ))}
        <XAxis
          dataKey="rotulo"
          tickFormatter={fmtDataCurta}
          tick={EIXO}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={EIXO} axisLine={false} tickLine={false} width={40} />
        {mediana > 0 ? (
          <ReferenceLine
            y={mediana}
            stroke="var(--cor-texto)"
            strokeWidth={1.5}
            label={{ value: "mediana", position: "right", fill: "var(--cor-texto-3)", fontSize: 10 }}
          />
        ) : null}
        <Tooltip
          cursor={{ fill: "var(--cor-superficie-2)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as PontoSerieGrafico;
            return (
              <Caixa
                titulo={fmtDataCurta(String(label))}
                linhas={[
                  { rotulo: "Ativo", valor: fmtHoras(d.ativo), cor: "var(--grafico-ativo)" },
                  { rotulo: "Flashcards", valor: fmtHoras(d.flashcards), cor: "var(--grafico-flashcards)" },
                  { rotulo: "Imersão", valor: fmtHoras(d.imersao), cor: "var(--grafico-imersao)" },
                  { rotulo: "Total", valor: fmtHoras(d.total) },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="ativo" stackId="t" fill="var(--grafico-ativo)" stroke={SUPERFICIE} strokeWidth={2} isAnimationActive={false} />
        <Bar dataKey="flashcards" stackId="t" fill="var(--grafico-flashcards)" stroke={SUPERFICIE} strokeWidth={2} isAnimationActive={false} />
        <Bar dataKey="imersao" stackId="t" fill="var(--grafico-imersao)" stroke={SUPERFICIE} strokeWidth={2} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------

export type Coluna = { rotulo: string; valor: number; destaque?: boolean };

/**
 * Colunas verticais com linha de meta. Usada para minutos de fala por semana,
 * hora do dia e dia da semana — a mesma forma, a mesma leitura.
 */
export function Colunas({
  dados,
  meta,
  rotuloMeta,
  formato,
  rotuloComo = "texto",
  corAcima = "var(--grafico-ativo)",
  corAbaixo = "var(--pilar-pronuncia)",
  corNeutra,
}: {
  dados: Coluna[];
  meta?: number;
  rotuloMeta?: string;
  formato: "min" | "dias";
  rotuloComo?: "data" | "hora" | "texto";
  corAcima?: string;
  corAbaixo?: string;
  corNeutra?: string;
}) {
  const formatarValor = (v: number) =>
    formato === "min" ? `${Math.round(v)} min` : `${v} ${v === 1 ? "dia" : "dias"}`;
  const formatarRotulo = (r: string) =>
    rotuloComo === "data" ? fmtDataCurta(r) : rotuloComo === "hora" ? `${r}h` : r;

  const cor = (c: Coluna) => {
    if (corNeutra) return c.destaque ? corAcima : corNeutra;
    if (meta === undefined) return corAcima;
    return c.valor >= meta ? corAcima : corAbaixo;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="rotulo"
          tickFormatter={formatarRotulo}
          tick={EIXO}
          axisLine={false}
          tickLine={false}
          minTickGap={8}
        />
        <YAxis
          tick={EIXO}
          axisLine={false}
          tickLine={false}
          width={36}
          {...(meta === undefined
            ? {}
            : { domain: [0, (max: number) => Math.max(max * 1.1, meta * 1.15)] as const })}
        />
        {meta !== undefined ? (
          <ReferenceLine
            y={meta}
            stroke="var(--cor-texto)"
            strokeWidth={1.5}
            label={{
              value: rotuloMeta ?? `meta ${meta}`,
              position: "insideTopRight",
              fill: "var(--cor-texto)",
              fontSize: 10,
            }}
          />
        ) : null}
        <Tooltip
          cursor={{ fill: "var(--cor-superficie-2)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as Coluna;
            return (
              <Caixa
                titulo={formatarRotulo ? formatarRotulo(String(label)) : String(label)}
                linhas={[{ rotulo: "Valor", valor: formatarValor(d.valor), cor: cor(d) }]}
              />
            );
          }}
        />
        <Bar dataKey="valor" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {dados.map((d) => (
            <Cell key={d.rotulo} fill={cor(d)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
