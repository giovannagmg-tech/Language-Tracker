/**
 * Gera o SQL de uma importação do Toggl usando o pipeline REAL do domínio.
 * Nenhuma regra do método é reescrita aqui: `lerLinhas`, `mapear` e
 * `chaveToggl` são os mesmos que a tela de Importação usa.
 *
 * A saída cria um `lotes_importacao` — é isso que faz o botão "desfazer lote"
 * do app funcionar sobre o que este script escreveu.
 *
 *   npx tsx scripts/importar-toggl.ts <csv> <regras.json> <user_id> > carga.sql
 */
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { lerLinhas, mapear, type RegraMapeamento } from "../lib/domain/toggl";

const [, , caminhoCsv, caminhoRegras, userId] = process.argv;
if (!caminhoCsv || !caminhoRegras || !userId) {
  console.error("uso: tsx scripts/importar-toggl.ts <csv> <regras.json> <user_id>");
  process.exit(1);
}

const bruto = readFileSync(caminhoCsv, "utf8").replace(/^﻿/, "");
const { data: registros } = Papa.parse<Record<string, string>>(bruto, {
  header: true,
  skipEmptyLines: true,
});
const regras: RegraMapeamento[] = JSON.parse(readFileSync(caminhoRegras, "utf8"));

const linhas = lerLinhas(registros);
const total = linhas.length;

const invalidas = linhas.filter((l) => l.erro !== null).length;
const mapeadas = linhas.filter((l) => l.erro === null).map((l) => mapear(l, regras));
const semIdioma = mapeadas.filter((m) => m.idiomaId === null).length;

// Deduplicação por chave (RN-1004): o Toggl tem lançamentos que colidem em
// data + hora + duração + descrição. O app trata como duplicata; aqui também.
const vistas = new Set<string>();
const aInserir: typeof mapeadas = [];
let duplicadas = 0;
for (const m of mapeadas) {
  if (m.idiomaId === null) continue;
  if (vistas.has(m.chave)) {
    duplicadas += 1;
    continue;
  }
  vistas.add(m.chave);
  aInserir.push(m);
}

const datas = aInserir.map((m) => m.linha.data!).sort();
const esc = (v: string) => `'${v.replace(/'/g, "''")}'`;
const nulo = (v: string | null) => (v === null ? "null" : esc(v));

const partes: string[] = [];
partes.push("begin;");
partes.push(`with lote as (
  insert into lotes_importacao
    (user_id, arquivo_nome, intervalo_inicio, intervalo_fim,
     linhas_total, importadas, ignoradas, conflitos, revisadas_manualmente)
  values (${esc(userId)}, ${esc("Toggl_time_entries_2026-01-01_to_2026-12-31.csv")},
    ${esc(datas[0])}, ${esc(datas[datas.length - 1])},
    ${total}, ${aInserir.length}, ${duplicadas + semIdioma + invalidas}, 0, 0)
  returning id
)
insert into sessoes
  (user_id, idioma_id, data, hora_inicio, duracao_min, categoria, pilar,
   atividade, tempo, producao, minutos_fala, nota, origem, via,
   chave_toggl, lote_importacao)
select * from (values`);

const valores = aInserir.map((m) => {
  const l = m.linha;
  const nota = l.description.trim() ? l.description.trim().slice(0, 500) : null;
  return `  (${esc(userId)}::uuid, ${esc(m.idiomaId!)}::uuid, ${esc(l.data!)}::date, ${nulo(l.horaInicio)}::time,
   ${Math.min(480, Math.max(1, l.duracaoMin))}, ${esc(m.categoria)}::categoria_sessao, ${m.pilar === null ? "null" : esc(m.pilar)}::pilar,
   ${esc(m.atividade)}::atividade, ${esc(m.tempo)}::tempo_do_dia, ${m.producao}, 0,
   ${nulo(nota)}, 'toggl'::origem_sessao, 'formulario'::via_registro, ${esc(m.chave)})`;
});

partes.push(valores.join(",\n"));
partes.push(`) as v(user_id, idioma_id, data, hora_inicio, duracao_min, categoria, pilar,
      atividade, tempo, producao, minutos_fala, nota, origem, via, chave_toggl),
  lote;`);
partes.push("commit;");

console.log(partes.join("\n"));

console.error(`linhas ${total} · inválidas ${invalidas} · sem idioma ${semIdioma} · duplicadas ${duplicadas} · inserindo ${aInserir.length}`);
console.error(`intervalo ${datas[0]} .. ${datas[datas.length - 1]}`);
console.error(`minutos ${aInserir.reduce((t, m) => t + Math.max(1, m.linha.duracaoMin), 0)}`);
