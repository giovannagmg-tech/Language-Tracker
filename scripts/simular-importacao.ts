/**
 * Roda o pipeline REAL de importação do Toggl contra um CSV, sem tocar no
 * banco. Serve para ver o que a importação vai produzir antes de produzi-la —
 * e para provar que nenhuma regra foi reescrita fora de `lib/domain/`.
 *
 *   npx tsx scripts/simular-importacao.ts <arquivo.csv> <regras.json>
 */
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { lerLinhas, mapear, type RegraMapeamento } from "../lib/domain/toggl";
import { ROTULO_ATIVIDADE } from "../lib/domain/tipos";

const [, , caminhoCsv, caminhoRegras] = process.argv;
if (!caminhoCsv || !caminhoRegras) {
  console.error("uso: tsx scripts/simular-importacao.ts <csv> <regras.json>");
  process.exit(1);
}

const bruto = readFileSync(caminhoCsv, "utf8").replace(/^﻿/, "");
const { data: registros } = Papa.parse<Record<string, string>>(bruto, {
  header: true,
  skipEmptyLines: true,
});

const regras: RegraMapeamento[] = JSON.parse(readFileSync(caminhoRegras, "utf8"));
const nomeIdioma: Record<string, string> = JSON.parse(
  process.env.IDIOMAS ?? "{}",
);

const linhas = lerLinhas(registros);
const mapeadas = linhas.map((l) => mapear(l, regras));

const invalidas = mapeadas.filter((m) => m.linha.erro !== null);
const semIdioma = mapeadas.filter((m) => m.linha.erro === null && m.idiomaId === null);
const prontas = mapeadas.filter((m) => m.linha.erro === null && m.idiomaId !== null);

console.log(`linhas lidas         ${linhas.length}`);
console.log(`inválidas            ${invalidas.length}`);
console.log(`sem idioma (ignorar) ${semIdioma.length}`);
console.log(`prontas para importar ${prontas.length}`);

const chaves = new Set(prontas.map((m) => m.chave));
console.log(`chaves distintas     ${chaves.size}${chaves.size === prontas.length ? "" : "  ⚠ há colisão"}`);

console.log("\n--- por idioma ---");
const porIdioma = new Map<string, { n: number; min: number }>();
for (const m of prontas) {
  const k = nomeIdioma[m.idiomaId!] ?? m.idiomaId!;
  const a = porIdioma.get(k) ?? { n: 0, min: 0 };
  a.n += 1;
  a.min += m.linha.duracaoMin;
  porIdioma.set(k, a);
}
for (const [k, v] of [...porIdioma].sort((a, b) => b[1].min - a[1].min)) {
  console.log(`  ${k.padEnd(10)} ${String(v.n).padStart(4)} registros  ${String(Math.floor(v.min / 60)).padStart(3)}h${String(v.min % 60).padStart(2, "0")}`);
}

console.log("\n--- por categoria ---");
const porCat = new Map<string, number>();
for (const m of prontas) porCat.set(m.categoria, (porCat.get(m.categoria) ?? 0) + m.linha.duracaoMin);
const totalMin = prontas.reduce((t, m) => t + m.linha.duracaoMin, 0);
for (const [k, v] of porCat) {
  console.log(`  ${k.padEnd(10)} ${String(Math.floor(v / 60)).padStart(3)}h${String(v % 60).padStart(2, "0")}  ${((v / totalMin) * 100).toFixed(1)}%`);
}

console.log("\n--- por atividade ---");
const porAtiv = new Map<string, number>();
for (const m of prontas) porAtiv.set(m.atividade, (porAtiv.get(m.atividade) ?? 0) + 1);
for (const [k, v] of [...porAtiv].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${ROTULO_ATIVIDADE[k as keyof typeof ROTULO_ATIVIDADE].padEnd(18)} ${v}`);
}

console.log("\n--- descartadas por não terem idioma ---");
const projetos = new Map<string, number>();
for (const m of semIdioma) projetos.set(m.linha.project, (projetos.get(m.linha.project) ?? 0) + 1);
for (const [k, v] of [...projetos].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(26)} ${v}`);
}

const foraDaFaixa = prontas.filter((m) => m.linha.duracaoMin < 1 || m.linha.duracaoMin > 480);
if (foraDaFaixa.length > 0) {
  console.log(`\n⚠ ${foraDaFaixa.length} linha(s) fora do limite 1..480 min do banco:`);
  for (const m of foraDaFaixa.slice(0, 10)) {
    console.log(`  linha ${m.linha.numero}: ${m.linha.duracaoMin} min — ${m.linha.data} ${m.linha.project}`);
  }
}
