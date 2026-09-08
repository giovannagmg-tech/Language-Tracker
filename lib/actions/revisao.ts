"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { supabaseServidor } from "@/lib/supabase/server";

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

function revalidar() {
  revalidatePath("/revisao");
  revalidatePath("/tarefas");
  revalidatePath("/hoje");
}

const novoPonto = z.object({
  idiomaId: z.string().uuid(),
  titulo: z.string().min(1, "Dê um nome ao ponto.").max(120),
  materialId: z.string().uuid().nullish(),
});

export async function criarPontoGramatical(
  bruta: z.input<typeof novoPonto>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = novoPonto.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const { error } = await supabase.from("pontos_gramaticais").insert({
    user_id: userId,
    idioma_id: parsed.data.idiomaId,
    titulo: parsed.data.titulo,
    material_id: parsed.data.materialId ?? null,
    estudado_em: hojeLocal(),
    estado: "ok",
  });

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

/**
 * RN-410. Marcar "errei na revisão" é o gatilho das duas frases em voz alta.
 * A tarefa em si é criada pelo motor, na próxima sincronização.
 */
export async function marcarPontoErrado(
  id: string,
  errado: boolean,
): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase
    .from("pontos_gramaticais")
    .update({
      estado: errado ? "errei" : "ok",
      marcado_errei_em: errado ? hojeLocal() : null,
      frases_feitas: errado ? 0 : undefined,
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

/** Conclui o ponto quando as frases exigidas foram feitas em voz alta. */
export async function registrarFrasesDoPonto(
  id: string,
  frases: number,
): Promise<{ ok: boolean; concluido: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { data: ponto } = await supabase
    .from("pontos_gramaticais")
    .select("frases_exigidas, frases_feitas")
    .eq("id", id)
    .maybeSingle();

  if (!ponto) return { ok: false, concluido: false, erro: "Ponto não encontrado." };

  const feitas = Math.max(0, ponto.frases_feitas + Math.round(frases));
  const concluido = feitas >= ponto.frases_exigidas;

  const { error } = await supabase
    .from("pontos_gramaticais")
    .update({
      frases_feitas: feitas,
      estado: concluido ? "ok" : "em_correcao",
      marcado_errei_em: concluido ? null : undefined,
      ultima_revisao_em: hojeLocal(),
    })
    .eq("id", id);

  if (error) return { ok: false, concluido: false, erro: error.message };
  revalidar();
  return { ok: true, concluido };
}
