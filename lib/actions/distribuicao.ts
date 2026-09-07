"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizarPara100, somaValida } from "@/lib/domain/distribuicao";
import { PILARES } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

const item = z.object({ chave: z.string().min(1), percentual: z.coerce.number().int().min(0).max(100) });

const entrada = z.object({
  dimensao: z.enum(["pilar", "idioma"]),
  blocoId: z.string().uuid().nullable(),
  itens: z.array(item).min(1),
  /** Quando vem preenchido, normaliza preservando este campo (RN-904). */
  normalizarFixando: z.string().nullish(),
});

export type ResultadoDistribuicao =
  | { ok: true; itens: { chave: string; percentual: number }[] }
  | { ok: false; erro: string };

/**
 * RN-902 e RN-904. Salvar a divisão-alvo é o que faz o dashboard e a meta
 * mensal mudarem — por isso revalida os três caminhos.
 */
export async function salvarDistribuicao(
  bruta: z.input<typeof entrada>,
): Promise<ResultadoDistribuicao> {
  const parsed = entrada.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { dimensao, blocoId, normalizarFixando } = parsed.data;
  const itens = normalizarFixando
    ? normalizarPara100(parsed.data.itens, normalizarFixando)
    : parsed.data.itens;

  if (!somaValida(itens)) {
    const total = itens.reduce((t, i) => t + i.percentual, 0);
    return { ok: false, erro: `Os percentuais somam ${total}%. Normalize para 100%.` };
  }

  if (dimensao === "pilar") {
    const chaves = new Set(itens.map((i) => i.chave));
    if (PILARES.some((p) => !chaves.has(p))) {
      return { ok: false, erro: "A divisão por pilar precisa dos quatro pilares." };
    }
  }

  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sem sessão." };

  // A unicidade no banco usa um índice por expressão (coalesce do bloco), que o
  // PostgREST não sabe inferir num upsert. Trocar por apagar e reinserir o
  // conjunto inteiro é mais simples e igualmente atômico para 3 ou 4 linhas.
  const alvo = supabase.from("distribuicao_alvo").delete().eq("dimensao", dimensao);
  const { error: erroApagar } = blocoId
    ? await alvo.eq("bloco_id", blocoId)
    : await alvo.is("bloco_id", null);
  if (erroApagar) return { ok: false, erro: erroApagar.message };

  const { error } = await supabase.from("distribuicao_alvo").insert(
    itens.map((i) => ({
      user_id: user.id,
      bloco_id: blocoId,
      dimensao,
      chave: i.chave,
      percentual: i.percentual,
    })),
  );

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/distribuicao");
  revalidatePath("/dashboard");
  revalidatePath("/metas");
  return { ok: true, itens };
}

const foco = z.object({
  blocoId: z.string().uuid(),
  idiomaId: z.string().uuid().nullable(),
  pilar: z.enum(PILARES).nullable(),
  nota: z.string().max(200).nullish(),
});

/** RN-903. É daqui que a tela Metas puxa o cartão "Foco em Distribuição". */
export async function salvarFocoDoMes(
  bruta: z.input<typeof foco>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = foco.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const supabase = await supabaseServidor();
  const { error } = await supabase
    .from("blocos_plano")
    .update({
      foco_mes_idioma: parsed.data.idiomaId,
      foco_mes_pilar: parsed.data.pilar,
      foco_mes_nota: parsed.data.nota ?? null,
    })
    .eq("id", parsed.data.blocoId);

  if (error) return { ok: false, erro: error.message };

  revalidatePath("/distribuicao");
  revalidatePath("/metas");
  return { ok: true };
}
