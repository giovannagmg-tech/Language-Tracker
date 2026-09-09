/**
 * As duas variáveis com prefixo NEXT_PUBLIC_ são **embutidas no bundle em
 * tempo de build**, não lidas em tempo de execução. Se o deploy rodou antes de
 * elas existirem, chegam aqui como `undefined` — e é preciso um novo build,
 * não um restart.
 */

export type ConfiguracaoSupabase = { url: string; chave: string };

/** Devolve null em vez de lançar: quem chama decide se degrada ou falha. */
export function configuracaoSupabase(): ConfiguracaoSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}

export function nomesFaltando(): string[] {
  const faltando: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) faltando.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) faltando.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return faltando;
}

/**
 * Versão estrita, para os caminhos de servidor em que seguir sem Supabase não
 * faz sentido nenhum. A mensagem diz o que fazer, não só o que faltou.
 */
export function configuracaoObrigatoria(): ConfiguracaoSupabase {
  const config = configuracaoSupabase();
  if (config) return config;
  throw new Error(
    `Variáveis ausentes: ${nomesFaltando().join(", ")}. ` +
      "Elas são embutidas no build — depois de configurá-las na Vercel, é preciso um novo deploy.",
  );
}

export const SUPABASE_URL = () => configuracaoObrigatoria().url;
export const SUPABASE_CHAVE_PUBLICA = () => configuracaoObrigatoria().chave;
