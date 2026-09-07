import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "./env";

/**
 * Cliente para Server Components e Server Actions.
 * Sem tipos gerados ainda: rode `npm run db:types` depois de criar o projeto
 * no Supabase e passe `Database` como genérico (primeira tarefa da Fase 1).
 */
export async function supabaseServidor() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL(), SUPABASE_CHAVE_PUBLICA(), {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          for (const { name, value, options } of cookiesParaGravar) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Component não pode gravar cookie: o middleware já renova a sessão.
        }
      },
    },
  });
}

export async function usuarioAtual() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
