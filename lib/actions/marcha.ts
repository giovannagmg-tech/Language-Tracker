"use server";

import { revalidatePath } from "next/cache";
import { hoje as hojeLocal, somaDias } from "@/lib/domain/datas";
import { ROTULO_MARCHA, type Marcha } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

const COMPLEMENTO: Record<Marcha, string> = {
  1: "O piso continua o mesmo.",
  2: "Quatro blocos e o clube.",
  3: "Turbo. Sábado tem bloco.",
};

/**
 * RN-201 e RN-205. Troca em uma tecla, sem confirmação.
 * O histórico nunca é apagado — é ele que explica queda e pico no dashboard.
 */
export async function trocarMarcha(
  numero: Marcha,
): Promise<{ ok: boolean; mensagem: string }> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensagem: "Sem sessão." };

  const hoje = hojeLocal();
  const { data: vigente } = await supabase
    .from("marcha_historico")
    .select("id, numero, data_inicio")
    .is("data_fim", null)
    .maybeSingle();

  if (vigente?.numero === numero) {
    return { ok: true, mensagem: `Já está na marcha ${numero}.` };
  }

  if (vigente) {
    // Marcha trocada no mesmo dia em que começou: corrige em vez de criar um vão.
    if (vigente.data_inicio === hoje) {
      await supabase.from("marcha_historico").delete().eq("id", vigente.id);
    } else {
      await supabase
        .from("marcha_historico")
        .update({ data_fim: somaDias(hoje, -1) })
        .eq("id", vigente.id);
    }
  }

  const { error } = await supabase.from("marcha_historico").insert({
    user_id: user.id,
    numero,
    data_inicio: hoje,
  });

  if (error) return { ok: false, mensagem: error.message };

  revalidatePath("/hoje");
  revalidatePath("/dashboard");
  return {
    ok: true,
    mensagem: `Marcha ${numero} — ${ROTULO_MARCHA[numero]}. ${COMPLEMENTO[numero]}`,
  };
}
