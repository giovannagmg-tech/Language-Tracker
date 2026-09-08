"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { sincronizarConquistas } from "@/lib/motores/conquistas";
import { PILARES, TIPOS_MATERIAL } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

// ---------------------------------------------------------------------------
// Materiais
// ---------------------------------------------------------------------------

const material = z.object({
  idiomaId: z.string().uuid(),
  tipo: z.enum(TIPOS_MATERIAL),
  titulo: z.string().min(1, "Dê um título.").max(140),
  unidade: z.string().min(1).max(20).default("licao"),
  posicaoAtual: z.coerce.number().int().min(0).default(0),
  total: z.coerce.number().int().min(1).nullish(),
  url: z.string().url("URL inválida.").nullish().or(z.literal("")),
  principal: z.coerce.boolean().default(false),
});

/** Um material principal por idioma: marcar outro desmarca o anterior. */
export async function salvarMaterial(
  bruta: z.input<typeof material>,
  id?: string,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = material.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  if (d.principal) {
    const query = supabase
      .from("materiais")
      .update({ principal: false })
      .eq("idioma_id", d.idiomaId)
      .eq("principal", true);
    await (id ? query.neq("id", id) : query);
  }

  const campos = {
    idioma_id: d.idiomaId,
    tipo: d.tipo,
    titulo: d.titulo,
    unidade: d.unidade,
    posicao_atual: d.posicaoAtual,
    total: d.total ?? null,
    url: d.url || null,
    principal: d.principal,
  };

  const { error } = id
    ? await supabase.from("materiais").update(campos).eq("id", id)
    : await supabase.from("materiais").insert({ user_id: userId, ...campos });

  if (error) return { ok: false, erro: error.message };
  revalidatePath("/materiais");
  return { ok: true };
}

/** Avançar uma unidade é a ação mais frequente — vale um botão só. */
export async function avancarMaterial(
  id: string,
  passo = 1,
): Promise<{ ok: boolean; posicao: number; erro?: string }> {
  const { supabase } = await sessao();
  const { data: atual } = await supabase
    .from("materiais")
    .select("posicao_atual, total")
    .eq("id", id)
    .maybeSingle();

  if (!atual) return { ok: false, posicao: 0, erro: "Material não encontrado." };

  const teto = atual.total ?? Number.MAX_SAFE_INTEGER;
  const posicao = Math.min(teto, Math.max(0, atual.posicao_atual + passo));

  const { error } = await supabase
    .from("materiais")
    .update({ posicao_atual: posicao, ultima_sessao_em: hojeLocal() })
    .eq("id", id);

  if (error) return { ok: false, posicao: atual.posicao_atual, erro: error.message };
  revalidatePath("/materiais");
  return { ok: true, posicao };
}

export async function arquivarMaterial(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase.from("materiais").update({ ativo: false }).eq("id", id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/materiais");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Recursos
// ---------------------------------------------------------------------------

const recurso = z.object({
  titulo: z.string().min(1, "Dê um título.").max(140),
  url: z.string().url("URL inválida."),
  tipo: z.enum([
    "dicionario", "colocacoes", "lista_frequencia", "canal", "podcast",
    "app", "ipa", "comunidade", "clube", "outro",
  ]),
  idiomas: z.array(z.string().uuid()).default([]),
  pilares: z.array(z.enum(PILARES)).default([]),
  nota: z.string().max(300).nullish(),
});

export async function salvarRecurso(
  bruta: z.input<typeof recurso>,
  id?: string,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = recurso.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;
  const campos = {
    titulo: d.titulo,
    url: d.url,
    tipo: d.tipo,
    idiomas: d.idiomas,
    pilares: d.pilares,
    nota: d.nota ?? null,
  };

  const { error } = id
    ? await supabase.from("recursos").update(campos).eq("id", id)
    : await supabase.from("recursos").insert({ user_id: userId, ...campos });

  if (error) return { ok: false, erro: error.message };
  revalidatePath("/recursos");
  return { ok: true };
}

export async function alternarFavorito(id: string, favorito: boolean) {
  const { supabase } = await sessao();
  await supabase.from("recursos").update({ favorito }).eq("id", id);
  revalidatePath("/recursos");
  return { ok: true };
}

export async function registrarAcessoRecurso(id: string) {
  const { supabase } = await sessao();
  await supabase.from("recursos").update({ ultimo_acesso_em: hojeLocal() }).eq("id", id);
  return { ok: true };
}

export async function removerRecurso(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase.from("recursos").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };
  revalidatePath("/recursos");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

/** Recalcula o catálogo inteiro — usado depois de importar histórico. */
export async function recalcularConquistas(): Promise<{
  ok: boolean;
  avaliadas: number;
  novas: number;
}> {
  const r = await sincronizarConquistas();
  revalidatePath("/conquistas");
  revalidatePath("/hoje");
  return { ok: true, avaliadas: r.avaliadas, novas: r.novas.length };
}
