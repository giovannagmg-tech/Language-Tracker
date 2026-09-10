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

/** Paleta sugerida na criação — separadas o bastante para não se confundirem. */
export const CORES_SUGERIDAS = [
  "#2F6FED",
  "#E4A11B",
  "#D14D5A",
  "#3E8E5A",
  "#B0479E",
  "#0E8A8A",
  "#8A5A2B",
  "#6B6B6B",
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
