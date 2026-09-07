"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { emailPermitido } from "@/lib/auth/allowlist";
import { supabaseServidor } from "@/lib/supabase/server";

const entrada = z.object({ email: z.string().email("E-mail inválido.") });

export type EstadoLogin = { ok: boolean; mensagem: string } | null;

export async function enviarLink(
  _anterior: EstadoLogin,
  form: FormData,
): Promise<EstadoLogin> {
  const parsed = entrada.safeParse({ email: form.get("email") });
  if (!parsed.success) {
    return { ok: false, mensagem: parsed.error.issues[0].message };
  }

  const { email } = parsed.data;
  if (!emailPermitido(email)) {
    // Mensagem idêntica à de sucesso seria mentira; aqui é melhor ser direta.
    return { ok: false, mensagem: "Esse e-mail não tem acesso a este app." };
  }

  const origem = (await headers()).get("origin") ?? "";
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${origem}/auth/confirmar`,
    },
  });

  if (error) {
    return { ok: false, mensagem: `Não deu para enviar: ${error.message}` };
  }

  return { ok: true, mensagem: "Link enviado. Abra o e-mail e volte para cá." };
}
