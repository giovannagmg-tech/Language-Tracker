import "server-only";
import { z } from "zod";
import type { Marcha } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

const linha = z.object({ numero: z.union([z.literal(1), z.literal(2), z.literal(3)]) });

/** Marcha vigente (RN-201). Toda conta nasce na marcha 1 pelo bootstrap. */
export async function marchaVigente(): Promise<Marcha> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("marcha_historico")
    .select("numero")
    .is("data_fim", null)
    .maybeSingle();

  const parsed = linha.safeParse(data);
  return parsed.success ? parsed.data.numero : 1;
}
