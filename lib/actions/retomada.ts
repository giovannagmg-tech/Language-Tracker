"use server";

import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";

/** RN-604. Sai sem culpa e sem conquista: a saída manual não conclui o protocolo. */
export async function encerrarRetomada(): Promise<{ ok: boolean; erro?: string }> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sem sessão." };

  const { error } = await supabase
    .from("retomadas")
    .update({ ativa: false, abandonada: true, concluida_em: null })
    .eq("ativa", true);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/hoje");
  revalidatePath("/metas");
  return { ok: true };
}
