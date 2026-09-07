"use server";

import { revalidatePath } from "next/cache";
import { entradaRevisao } from "@/lib/schemas/sessao";
import { supabaseServidor } from "@/lib/supabase/server";

/**
 * RN-403. Check diário, um por idioma e por dia. Reclicar desmarca.
 * Não pergunta quantos cartões: o indicador é frequência, não volume.
 */
export async function alternarRevisao(
  idiomaId: string,
  data: string,
): Promise<{ ok: boolean; revisou: boolean; erro?: string }> {
  const parsed = entradaRevisao.safeParse({ idiomaId, data });
  if (!parsed.success) {
    return { ok: false, revisou: false, erro: parsed.error.issues[0].message };
  }

  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, revisou: false, erro: "Sem sessão." };

  const { data: existente } = await supabase
    .from("revisoes_flashcards")
    .select("id, revisou")
    .eq("idioma_id", idiomaId)
    .eq("data", data)
    .maybeSingle();

  const novoValor = !existente?.revisou;

  const { error } = existente
    ? await supabase
        .from("revisoes_flashcards")
        .update({ revisou: novoValor })
        .eq("id", existente.id)
    : await supabase.from("revisoes_flashcards").insert({
        user_id: user.id,
        idioma_id: idiomaId,
        data,
        revisou: true,
      });

  if (error) return { ok: false, revisou: existente?.revisou ?? false, erro: error.message };

  revalidatePath("/hoje");
  revalidatePath("/flashcards");
  return { ok: true, revisou: novoValor };
}
