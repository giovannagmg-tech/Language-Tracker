import type { DataISO } from "./datas";
import { DEFAULTS, classificar } from "./classificacao";
import type { Atividade, Categoria, Pilar, TempoDoDia } from "./tipos";

/**
 * RN-1001 a RN-1006. O CSV do Toggl é dado hostil: encoding com BOM, separador
 * que muda por locale, duração em HH:MM:SS, linha em branco no meio e coluna
 * que some. Nada aqui lança — linha ruim vira linha marcada, não exceção.
 */

/** Teto de segurança: acima disso o corpo da Server Action fica grande demais. */
export const MAXIMO_DE_LINHAS = 5000;

export type LinhaToggl = {
  /** Número da linha no arquivo, para a usuária achar o problema. */
  numero: number;
  project: string;
  description: string;
  tags: string;
  client: string;
  task: string;
  data: DataISO | null;
  horaInicio: string | null;
  duracaoMin: number;
  erro: string | null;
};

export type CampoRegra = "project" | "description" | "tags" | "client" | "task";
export type OperadorRegra = "contem" | "igual" | "regex";

export type RegraMapeamento = {
  id: string;
  ordem: number;
  campo: CampoRegra;
  operador: OperadorRegra;
  valor: string;
  saidaIdioma: string | null;
  saidaAtividade: Atividade | null;
  saidaPilar: Pilar | null;
  saidaTempo: TempoDoDia | null;
  ativa: boolean;
};

export type Mapeada = {
  linha: LinhaToggl;
  idiomaId: string | null;
  atividade: Atividade;
  pilar: Pilar | null;
  tempo: TempoDoDia;
  categoria: Categoria;
  producao: boolean;
  chave: string;
  precisaRevisao: boolean;
};

export type Classificacao = "nova" | "duplicada" | "conflito" | "revisar" | "invalida";

export type LinhaClassificada = Mapeada & { classificacao: Classificacao; conflitoCom?: string };

// ---------------------------------------------------------------------------
// Leitura do arquivo
// ---------------------------------------------------------------------------

const ALIAS: Record<string, keyof LinhaToggl | "ignorar"> = {
  project: "project",
  projeto: "project",
  description: "description",
  descricao: "description",
  tags: "tags",
  etiquetas: "tags",
  client: "client",
  cliente: "client",
  task: "task",
  tarefa: "task",
  "start date": "data",
  "data de inicio": "data",
  "start time": "horaInicio",
  "hora de inicio": "horaInicio",
  duration: "duracaoMin",
  duracao: "duracaoMin",
};

export function limparBOM(texto: string): string {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/** O separador é o candidato que mais aparece na linha de cabeçalho. */
export function detectarSeparador(texto: string): string {
  const cabecalho = limparBOM(texto).split(/\r?\n/)[0] ?? "";
  const candidatos = [",", ";", "\t"];
  return candidatos.reduce((melhor, atual) =>
    cabecalho.split(atual).length > cabecalho.split(melhor).length ? atual : melhor,
  );
}

export function normalizarCabecalho(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

export function chaveDaColuna(nome: string): keyof LinhaToggl | "ignorar" {
  return ALIAS[normalizarCabecalho(nome)] ?? "ignorar";
}

/** "32:20:45" → 1941 minutos. Aceita também "1:30" e segundos puros. */
export function duracaoParaMinutos(valor: string): number | null {
  const bruto = valor.trim();
  if (!bruto) return null;

  if (/^\d+$/.test(bruto)) {
    const segundos = Number(bruto);
    return segundos > 0 ? Math.max(1, Math.round(segundos / 60)) : null;
  }

  const partes = bruto.split(":").map((p) => Number(p));
  if (partes.some((p) => !Number.isFinite(p))) return null;

  const [a, b, c] = partes;
  const segundos =
    partes.length === 3 ? a * 3600 + b * 60 + c : partes.length === 2 ? a * 3600 + b * 60 : null;

  if (segundos === null || segundos <= 0) return null;
  return Math.max(1, Math.round(segundos / 60));
}

/** Aceita AAAA-MM-DD e DD/MM/AAAA. Data inválida devolve null, não lança. */
export function normalizarData(valor: string): DataISO | null {
  const bruto = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(bruto)) return bruto;

  const br = bruto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;

  return null;
}

export function normalizarHora(valor: string): string | null {
  const m = valor.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hora = Number(m[1]);
  if (hora > 23) return null;
  return `${String(hora).padStart(2, "0")}:${m[2]}`;
}

/**
 * Converte os registros já parseados (PapaParse devolve objetos) em linhas do
 * domínio. Linha sem data ou sem duração é marcada como inválida.
 */
export function lerLinhas(registros: Record<string, string>[]): LinhaToggl[] {
  return registros.map((registro, indice) => {
    const campos: Record<string, string> = {};
    for (const [coluna, valor] of Object.entries(registro)) {
      const chave = chaveDaColuna(coluna);
      if (chave !== "ignorar") campos[chave] = valor ?? "";
    }

    const data = normalizarData(campos.data ?? "");
    const duracao = duracaoParaMinutos(campos.duracaoMin ?? "");

    const erro =
      data === null
        ? "Data ausente ou em formato desconhecido."
        : duracao === null
          ? "Duração ausente ou zerada."
          : null;

    return {
      numero: indice + 2, // +1 pelo cabeçalho, +1 porque humano conta do 1
      project: (campos.project ?? "").trim(),
      description: (campos.description ?? "").trim(),
      tags: (campos.tags ?? "").trim(),
      client: (campos.client ?? "").trim(),
      task: (campos.task ?? "").trim(),
      data,
      horaInicio: normalizarHora(campos.horaInicio ?? ""),
      duracaoMin: duracao ?? 0,
      erro,
    };
  });
}

export function colunasObrigatoriasFaltando(colunas: string[]): string[] {
  const presentes = new Set(colunas.map(chaveDaColuna));
  const faltando: string[] = [];
  if (!presentes.has("data")) faltando.push("Start date");
  if (!presentes.has("duracaoMin")) faltando.push("Duration");
  return faltando;
}

// ---------------------------------------------------------------------------
// RN-1002 — motor de mapeamento
// ---------------------------------------------------------------------------

function comparar(texto: string, operador: OperadorRegra, valor: string): boolean {
  const a = normalizarCabecalho(texto);
  const b = normalizarCabecalho(valor);
  if (!b) return false;

  if (operador === "igual") return a === b;
  if (operador === "contem") return a.includes(b);

  try {
    return new RegExp(valor, "i").test(texto);
  } catch {
    // Regex inválida é problema da regra, não do arquivo: ela simplesmente não casa.
    return false;
  }
}

/** Regras rodam em ordem crescente e a última que casa vence. */
export function aplicarRegras(
  linha: LinhaToggl,
  regras: RegraMapeamento[],
): {
  idiomaId: string | null;
  atividade: Atividade | null;
  pilar: Pilar | null;
  tempo: TempoDoDia | null;
} {
  const saida: {
    idiomaId: string | null;
    atividade: Atividade | null;
    pilar: Pilar | null;
    tempo: TempoDoDia | null;
  } = { idiomaId: null, atividade: null, pilar: null, tempo: null };

  const ordenadas = [...regras].filter((r) => r.ativa).sort((a, b) => a.ordem - b.ordem);

  for (const regra of ordenadas) {
    const campo = linha[regra.campo];
    if (typeof campo !== "string") continue;
    if (!comparar(campo, regra.operador, regra.valor)) continue;

    if (regra.saidaIdioma) saida.idiomaId = regra.saidaIdioma;
    if (regra.saidaAtividade) saida.atividade = regra.saidaAtividade;
    if (regra.saidaPilar) saida.pilar = regra.saidaPilar;
    if (regra.saidaTempo) saida.tempo = regra.saidaTempo;
  }

  return saida;
}

/** Hash curto e determinístico — a chave de deduplicação (RN-1004). */
export function chaveToggl(linha: LinhaToggl): string {
  const base = `${linha.data ?? ""}|${linha.horaInicio ?? ""}|${linha.duracaoMin}|${normalizarCabecalho(linha.description)}`;
  let h1 = 0x811c9dc5;
  for (let i = 0; i < base.length; i += 1) {
    h1 ^= base.charCodeAt(i);
    h1 = Math.imul(h1, 0x01000193) >>> 0;
  }
  return `${h1.toString(36)}-${base.length.toString(36)}`;
}

export function mapear(linha: LinhaToggl, regras: RegraMapeamento[]): Mapeada {
  const saida = aplicarRegras(linha, regras);
  const atividade: Atividade = saida.atividade ?? "outro";

  const c = classificar({
    atividade,
    duracaoMin: Math.max(1, linha.duracaoMin),
    pilar: saida.pilar ?? undefined,
    tempo: saida.tempo ?? undefined,
  });

  return {
    linha,
    idiomaId: saida.idiomaId,
    atividade,
    pilar: c.pilar,
    tempo: saida.tempo ?? DEFAULTS[atividade].tempo,
    categoria: c.categoria,
    producao: c.producao,
    chave: chaveToggl(linha),
    precisaRevisao: saida.idiomaId === null || saida.atividade === null,
  };
}

// ---------------------------------------------------------------------------
// RN-1004 — deduplicação
// ---------------------------------------------------------------------------

export type SessaoExistente = {
  id: string;
  data: DataISO;
  idiomaId: string;
  atividade: Atividade;
  duracaoMin: number;
  origem: "manual" | "toggl" | "automatica";
  chaveToggl: string | null;
};

const TOLERANCIA_CONFLITO_MIN = 5;

export function classificarLinhas(
  linhas: LinhaToggl[],
  regras: RegraMapeamento[],
  existentes: SessaoExistente[],
): LinhaClassificada[] {
  const porChave = new Set(
    existentes.filter((s) => s.chaveToggl !== null).map((s) => s.chaveToggl as string),
  );

  const chavesNoArquivo = new Set<string>();

  return linhas.map((linha) => {
    if (linha.erro !== null) {
      return { ...mapear(linha, regras), classificacao: "invalida" as const };
    }

    const mapeada = mapear(linha, regras);

    // Duplicata exata: já importada antes, ou repetida dentro do próprio arquivo.
    if (porChave.has(mapeada.chave) || chavesNoArquivo.has(mapeada.chave)) {
      return { ...mapeada, classificacao: "duplicada" as const };
    }
    chavesNoArquivo.add(mapeada.chave);

    const conflito = existentes.find(
      (s) =>
        s.origem === "manual" &&
        s.data === linha.data &&
        s.idiomaId === mapeada.idiomaId &&
        s.atividade === mapeada.atividade &&
        Math.abs(s.duracaoMin - linha.duracaoMin) <= TOLERANCIA_CONFLITO_MIN,
    );

    if (conflito) {
      return { ...mapeada, classificacao: "conflito" as const, conflitoCom: conflito.id };
    }

    if (mapeada.precisaRevisao) {
      return { ...mapeada, classificacao: "revisar" as const };
    }

    return { ...mapeada, classificacao: "nova" as const };
  });
}

export type ResumoImportacao = {
  total: number;
  novas: number;
  duplicadas: number;
  conflitos: number;
  revisar: number;
  invalidas: number;
  minutos: number;
  intervalo: { inicio: DataISO; fim: DataISO } | null;
};

export function resumir(linhas: LinhaClassificada[]): ResumoImportacao {
  const contar = (c: Classificacao) => linhas.filter((l) => l.classificacao === c).length;
  const importaveis = linhas.filter(
    (l) => l.classificacao === "nova" || l.classificacao === "revisar",
  );
  const datas = linhas
    .map((l) => l.linha.data)
    .filter((d): d is DataISO => d !== null)
    .sort();

  return {
    total: linhas.length,
    novas: contar("nova"),
    duplicadas: contar("duplicada"),
    conflitos: contar("conflito"),
    revisar: contar("revisar"),
    invalidas: contar("invalida"),
    minutos: importaveis.reduce((t, l) => t + l.linha.duracaoMin, 0),
    intervalo: datas.length > 0 ? { inicio: datas[0], fim: datas[datas.length - 1] } : null,
  };
}
