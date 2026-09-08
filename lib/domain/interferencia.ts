import type { IdiomaSlug } from "./tipos";

/**
 * RN-406 e RN-407. Roda sobre a lista colada antes de ela criar os cartões no
 * Flashcards Deluxe. A lista NÃO é persistida (RN-409) — isto aqui é uma
 * função pura que recebe texto e devolve avisos.
 *
 * A heurística é assumidamente grosseira e offline: um falso positivo custa
 * um segundo de leitura, e o objetivo é lembrar de embaralhar o lote, não
 * classificar fonemas.
 */

export type TipoAviso =
  | "ordem_alfabetica"
  | "grafia_parecida"
  | "som_parecido"
  | "mesma_palavra"
  | "excesso_verbos";

export type Aviso = {
  tipo: TipoAviso;
  mensagem: string;
  itens: string[];
};

const ARTIGOS = [
  "to ", "the ", "a ", "an ",
  "el ", "la ", "los ", "las ", "un ", "una ",
  "le ", "les ", "une ", "des ", "du ",
];

export function separarItens(texto: string): string[] {
  return texto
    .split(/[\n,;\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function normalizar(item: string): string {
  let s = item
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
  for (const artigo of ARTIGOS) {
    if (s.startsWith(artigo)) {
      s = s.slice(artigo.length);
      break;
    }
  }
  return s.trim();
}

/** A forma-base: o que vem antes de barra, parêntese, travessão ou vírgula. */
export function formaBase(item: string): string {
  return normalizar(item).split(/[/(\-,]/)[0].trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const atual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
    }
    anterior = atual;
  }
  return anterior[b.length];
}

/** RN-407. Esqueleto fonético: colapsa o que soa igual e some com o que é mudo. */
export function esqueletoFonetico(item: string, idioma: IdiomaSlug = "ingles"): string {
  let s = normalizar(item);

  s = s.replace(/(.)\1+/g, "$1"); // letras repetidas
  s = s.replace(/ough/g, "o");
  s = s.replace(/ph/g, "f");
  s = s.replace(/qu/g, "k").replace(/q/g, "k");
  s = s.replace(/ch/g, "x");
  s = s.replace(/gn/g, "n");
  s = s.replace(/c([aou])/g, "k$1").replace(/c([ei])/g, "s$1").replace(/c/g, "k");
  s = s.replace(/z/g, "s");
  s = s.replace(/x/g, "ks");
  s = s.replace(/y/g, "i");
  s = s.replace(/w/g, "v");
  if (idioma !== "ingles") s = s.replace(/h/g, "");
  if (idioma === "frances") s = s.replace(/e$/g, "");
  s = s.replace(/[aeiou]+/g, "V");

  return s;
}

const SUFIXOS_VERBO: Record<IdiomaSlug, RegExp> = {
  ingles: /^to\s/i,
  espanhol: /(ar|er|ir)$/,
  frances: /(er|ir|re|oir)$/,
};

export function pareceVerbo(item: string, idioma: IdiomaSlug): boolean {
  const bruto = item.toLowerCase().trim();
  if (idioma === "ingles") return SUFIXOS_VERBO.ingles.test(bruto);
  return SUFIXOS_VERBO[idioma].test(normalizar(item));
}

export type OpcoesChecagem = {
  idioma?: IdiomaSlug;
  minimoItens?: number;
};

export function checarInterferencia(
  itens: string[],
  opcoes: OpcoesChecagem = {},
): Aviso[] {
  const idioma = opcoes.idioma ?? "ingles";
  const minimo = opcoes.minimoItens ?? 3;
  if (itens.length < minimo) return [];

  const avisos: Aviso[] = [];
  const norm = itens.map(normalizar);

  // 1. ordem alfabética
  if (itens.length >= 5) {
    let ordenados = 0;
    for (let i = 1; i < norm.length; i += 1) {
      if (norm[i - 1] <= norm[i]) ordenados += 1;
    }
    if (ordenados / (norm.length - 1) >= 0.7) {
      avisos.push({
        tipo: "ordem_alfabetica",
        mensagem: "O lote está quase em ordem alfabética. Embaralhe antes de criar.",
        itens: [],
      });
    }
  }

  // 2. grafia parecida
  const grafia: string[] = [];
  for (let i = 0; i < norm.length; i += 1) {
    for (let j = i + 1; j < norm.length; j += 1) {
      const a = norm[i];
      const b = norm[j];
      if (a === b) continue;
      const dist = levenshtein(a, b);
      const similaridade = 1 - dist / Math.max(a.length, b.length);
      const prefixo = a.length >= 5 && b.length >= 5 && a.slice(0, 4) === b.slice(0, 4);
      if ((dist <= 2 && similaridade >= 0.7) || prefixo) {
        grafia.push(`${itens[i]} / ${itens[j]}`);
      }
    }
  }
  if (grafia.length > 0) {
    avisos.push({
      tipo: "grafia_parecida",
      mensagem: "Palavras que se escrevem parecido. Separe em lotes diferentes.",
      itens: grafia,
    });
  }

  // 3. som parecido
  const esqueletos = itens.map((i) => esqueletoFonetico(i, idioma));
  const som: string[] = [];
  for (let i = 0; i < esqueletos.length; i += 1) {
    for (let j = i + 1; j < esqueletos.length; j += 1) {
      if (norm[i] === norm[j]) continue;
      if (levenshtein(esqueletos[i], esqueletos[j]) <= 1) {
        const par = `${itens[i]} / ${itens[j]}`;
        if (!grafia.includes(par)) som.push(par);
      }
    }
  }
  if (som.length > 0) {
    avisos.push({
      tipo: "som_parecido",
      mensagem: "Palavras que soam parecido. Isso vira interferência.",
      itens: som,
    });
  }

  // 4. mesma palavra, sentidos diferentes
  const porBase = new Map<string, string[]>();
  for (const item of itens) {
    const base = formaBase(item);
    porBase.set(base, [...(porBase.get(base) ?? []), item]);
  }
  const repetidas = [...porBase.entries()].filter(([, lista]) => lista.length > 1);
  if (repetidas.length > 0) {
    avisos.push({
      tipo: "mesma_palavra",
      mensagem: "A mesma palavra aparece mais de uma vez. Deixe um sentido por lote.",
      itens: repetidas.map(([base, lista]) => `${base} (${lista.length}×)`),
    });
  }

  // 5. excesso de verbos
  if (itens.length >= 5) {
    const verbos = itens.filter((i) => pareceVerbo(i, idioma));
    const proporcao = verbos.length / itens.length;
    if (proporcao > 0.4) {
      avisos.push({
        tipo: "excesso_verbos",
        mensagem: `${verbos.length} de ${itens.length} itens são verbos (${Math.round(proporcao * 100)}%). Misture substantivos e adjetivos.`,
        itens: verbos,
      });
    }
  }

  return avisos;
}
