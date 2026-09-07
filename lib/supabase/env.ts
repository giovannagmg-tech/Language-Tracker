function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ausente: ${nome}. Veja .env.example e o README.`,
    );
  }
  return valor;
}

export const SUPABASE_URL = () =>
  obrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

export const SUPABASE_CHAVE_PUBLICA = () =>
  obrigatoria(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
