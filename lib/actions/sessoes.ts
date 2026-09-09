"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  classificar,
  conflitoGramaticaPronuncia,
  instagramLiberado,
} from "@/lib/domain/classificacao";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { entradaSessao, type EntradaSessao } from "@/lib/schemas/sessao";
import { marchaVigente } from "@/lib/queries/marcha";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Pilar } from "@/lib/domain/tipos";

export type ResultadoRegistro =
  | { ok: true; id: string; violouRegra5: boolean }
  | { ok: false; erro: string };

async function idDoUsuario() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

function revalidarTudo() {
  revalidatePath("/hoje");
  revalidatePath("/registro");
  revalidatePath("/dashboard");
  revalidatePath("/historico");
}

/**
 * RN-101 a RN-106 e RN-305. Classifica no servidor: o formulário sugere,
 * o domínio decide. Nunca bloqueia (RN-004) — no máximo grava a violação.
 */
export async function registrarSessao(entrada: EntradaSessao): Promise<ResultadoRegistro> {
  const parsed = entradaSessao.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, erro: parsed.error.issues[0].message };
  }
  const dados = parsed.data;

  const { supabase, userId } = await idDoUsuario();

  if (dados.atividade === "conteudo_instagram") {
    const marcha = await marchaVigente();
    if (!instagramLiberado(marcha)) {
      return { ok: false, erro: `Conteúdo no Instagram é da marcha 3. Você está na marcha ${marcha}.` };
    }
  }

  const c = classificar({
    atividade: dados.atividade,
    duracaoMin: dados.duracaoMin,
    pilar: dados.pilar ?? undefined,
    tempo: dados.tempo,
    categoria: dados.categoria,
    minutosFala: dados.minutosFala,
  });

  if (c.categoria === "ativo" && c.pilar === null) {
    return { ok: false, erro: "Escolha o pilar desta sessão." };
  }

  // A checagem da regra 5 é refeita aqui: o cliente avisa, o servidor decide.
  const { data: doDia } = await supabase
    .from("sessoes")
    .select("pilar")
    .eq("data", dados.data);
  const conflito = conflitoGramaticaPronuncia(
    c.pilar,
    (doDia ?? []).map((s) => ({ pilar: s.pilar as Pilar | null })),
  );

  const { data: inserida, error } = await supabase
    .from("sessoes")
    .insert({
      user_id: userId,
      idioma_id: dados.idiomaId,
      data: dados.data,
      hora_inicio: dados.horaInicio ?? null,
      duracao_min: dados.duracaoMin,
      categoria: c.categoria,
      pilar: c.pilar,
      atividade: dados.atividade,
      tempo: c.tempo,
      producao: c.producao,
      palavras_novas: dados.palavrasNovas,
      minutos_fala: c.minutosFala,
      pontos_gramaticais: dados.pontosGramaticais,
      frases_produzidas: dados.frasesProduzidas,
      nota: dados.nota ?? null,
      violou_regra_5: conflito !== null,
      origem: "manual",
      via: dados.via,
    })
    .select("id")
    .single();

  if (error || !inserida) {
    return { ok: false, erro: error?.message ?? "Não deu para salvar." };
  }

  if (dados.palavrasNovas > 0) {
    await somarPalavras(dados.idiomaId, dados.data, dados.palavrasNovas);
  }

  if (dados.duracaoRegistroMs !== undefined) {
    await supabase.from("telemetria_registro").insert({
      user_id: userId,
      duracao_ms: dados.duracaoRegistroMs,
      via: dados.via,
    });
  }

  revalidarTudo();
  return { ok: true, id: inserida.id, violouRegra5: conflito !== null };
}

async function somarPalavras(idiomaId: string, data: string, quantidade: number) {
  const { supabase, userId } = await idDoUsuario();
  const { data: existente } = await supabase
    .from("registros_vocabulario")
    .select("id, palavras_novas")
    .eq("idioma_id", idiomaId)
    .eq("data", data)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("registros_vocabulario")
      .update({ palavras_novas: existente.palavras_novas + quantidade })
      .eq("id", existente.id);
  } else {
    await supabase.from("registros_vocabulario").insert({
      user_id: userId,
      idioma_id: idiomaId,
      data,
      palavras_novas: quantidade,
    });
  }
}

/**
 * RN-301 e RN-302: o botão que salva o dia. Um minuto de fala, mãos ocupadas,
 * no idioma do bloco vigente. É a ação mais importante do app.
 */
export async function registrarUmMinuto(idiomaId: string): Promise<ResultadoRegistro> {
  return registrarSessao({
    idiomaId,
    data: hojeLocal(),
    duracaoMin: 1,
    atividade: "fala_sozinha",
    tempo: "maos_ocupadas",
    palavrasNovas: 0,
    pontosGramaticais: 0,
    frasesProduzidas: 0,
    via: "botao_regra",
    confirmouRegra5: false,
  });
}

/** RN-304. */
export async function registrarAudioGrupo(idiomaId: string): Promise<ResultadoRegistro> {
  return registrarSessao({
    idiomaId,
    data: hojeLocal(),
    duracaoMin: 1,
    atividade: "audio_grupo",
    palavrasNovas: 0,
    pontosGramaticais: 0,
    frasesProduzidas: 0,
    via: "botao_regra",
    confirmouRegra5: false,
  });
}

/**
 * Apaga uma sessão. Serve tanto ao "desfazer" do toast quanto ao histórico.
 * O RLS garante que só a dona apaga a própria linha — o `id` sozinho não
 * alcança sessão de ninguém.
 */
export async function excluirSessao(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!z.string().uuid().safeParse(id).success) return { ok: false, erro: "Registro inválido." };

  const { supabase } = await idDoUsuario();
  const { error } = await supabase.from("sessoes").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };

  revalidarTudo();
  return { ok: true };
}
