/**
 * Regras puras de idioma. O slug é identidade dentro da conta: ele entra na
 * chave única `(user_id, slug)` e nunca muda depois de criado.
 */

/** `Português (Brasil)` → `portugues-brasil`. Sem acento, sem espaço, sem símbolo. */
export function slugDoIdioma(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Slug livre dentro da conta. Colidiu, ganha sufixo numérico — dois idiomas
 * chamados "Inglês" são improváveis, mas o banco recusaria o segundo e a tela
 * mostraria um erro de chave única, que não diz nada a ninguém.
 */
export function slugLivre(nome: string, existentes: readonly string[]): string {
  const base = slugDoIdioma(nome) || "idioma";
  if (!existentes.includes(base)) return base;
  for (let i = 2; i < 100; i += 1) {
    const tentativa = `${base}-${i}`;
    if (!existentes.includes(tentativa)) return tentativa;
  }
  return `${base}-${Date.now()}`;
}

/** Cor de contorno em hexadecimal, aceita `#abc` e `#aabbcc`. */
export function corValida(cor: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(cor.trim());
}

/**
 * Uma bandeira de país é um par de indicadores regionais (dois codepoints).
 * Aceitamos também emoji comum, para quem quiser 🗣 num idioma sem bandeira —
 * o que barramos é texto solto virando "bandeira".
 */
export function bandeiraValida(valor: string): boolean {
  const bruto = valor.trim();
  if (bruto === "") return true; // sem bandeira é permitido
  const pontos = [...bruto];
  if (pontos.length > 4) return false;
  return pontos.every((c) => (c.codePointAt(0) ?? 0) > 0x1000);
}

/**
 * Paleta sugerida na criação. Não foi escolhida a olho: cada cor alcança pelo
 * menos 3:1 contra o fundo claro **e** contra o escuro — o mínimo para uma
 * forma ser vista —, e a menor distância entre duas delas é 0,142, acima do
 * limiar. Os testes guardam as duas propriedades.
 */
export const CORES_SUGERIDAS = [
  "#2F6FED", // azul       — inglês
  "#C08A12", // âmbar      — espanhol
  "#D14D5A", // vermelho   — francês
  "#407262", // verde-petróleo
  "#9835AC", // roxo
  "#3AA63A", // verde
  "#7996B4", // azul-acinzentado
  "#CE5FCE", // rosa
] as const;

/** Bandeiras oferecidas de atalho. Ela pode digitar qualquer outra. */
export const BANDEIRAS_SUGERIDAS = [
  "🇺🇸", "🇬🇧", "🇪🇸", "🇫🇷", "🇮🇹", "🇩🇪", "🇧🇷", "🇵🇹",
  "🇯🇵", "🇰🇷", "🇨🇳", "🇷🇺", "🇳🇱", "🇸🇪", "🇬🇷", "🗣",
] as const;

/** Cor ainda não usada, para a próxima sugestão não repetir. */
export function proximaCor(usadas: readonly string[]): string {
  const normalizadas = usadas.map((c) => c.toLowerCase());
  return (
    CORES_SUGERIDAS.find((c) => !normalizadas.includes(c.toLowerCase())) ??
    CORES_SUGERIDAS[0]
  );
}

// ---------------------------------------------------------------------------
// Distinção entre cores
// ---------------------------------------------------------------------------

type RGB = [number, number, number];

function paraRgb(hex: string): RGB {
  const c = hex.trim().replace("#", "");
  const cheio = c.length === 3 ? [...c].map((x) => x + x).join("") : c;
  return [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16) / 255) as RGB;
}

/**
 * OKLab: distância nesse espaço acompanha a percepção bem melhor que a
 * distância em RGB, onde dois verdes distintos parecem próximos e dois azuis
 * parecidos parecem longe.
 */
function paraOklab([r, g, b]: RGB): RGB {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function distanciaDeCores(a: string, b: string): number {
  const [l1, a1, b1] = paraOklab(paraRgb(a));
  const [l2, a2, b2] = paraOklab(paraRgb(b));
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Abaixo disto duas cores viram a mesma num gráfico de barras pequeno.
 *
 * Calibrado, não chutado: o par mais próximo dos idiomas dela hoje é italiano
 * × alemão, a 0,125. O limiar fica logo abaixo disso — apertar mais acusaria
 * uma combinação que já existe e funciona.
 */
export const DISTANCIA_MINIMA = 0.11;

/** Devolve a cor conflitante, ou `null` se a nova é distinguível de todas. */
export function corConflitante(
  nova: string,
  existentes: readonly { nome: string; cor: string }[],
): { nome: string; cor: string } | null {
  for (const outra of existentes) {
    if (distanciaDeCores(nova, outra.cor) < DISTANCIA_MINIMA) return outra;
  }
  return null;
}
