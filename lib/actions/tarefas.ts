"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal } from "@/lib/domain/datas";
import { novaDataAoAdiar, podeAdiar } from "@/lib/domain/tarefas";
import { sincronizarTarefas } from "@/lib/motores/tarefas";
import { supabaseServidor } from "@/lib/supabase/server";

function revalidar() {
  revalidatePath("/tarefas");
  revalidatePath("/hoje");
  revalidatePath("/revisao");
}

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

/** Envelope de ação para o motor: o motor em si é chamado direto pelas páginas. */
export async function sincronizarTarefasAgora(): Promise<{ criadas: number }> {
  const r = await sincronizarTarefas();
  if (r.criadas > 0) revalidar();
  return r;
}

const novaManual = z.object({
  titulo: z.string().min(1, "Dê um título.").max(140),
  idiomaId: z.string().uuid().nullable(),
  dataPrevista: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recorrencia: z.enum(["nenhuma", "diaria", "semanal", "mensal"]).default("nenhuma"),
  metaId: z.string().uuid().nullish(),
});

export async function criarTarefa(
  bruta: z.input<typeof novaManual>,
): Promise<{ ok: boolean; erro?: string }> {
  const parsed = novaManual.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;
  const { error } = await supabase.from("tarefas").insert({
    user_id: userId,
    tipo: "manual",
    automatica: false,
    titulo: d.titulo,
    idioma_id: d.idiomaId,
    data_prevista: d.dataPrevista,
    janela: "dia",
    chave_idempotencia: `manual:${crypto.randomUUID()}`,
    quantidade_exigida: 1,
    recorrencia: d.recorrencia,
    meta_id: d.metaId ?? null,
  });

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

export async function avancarTarefa(
  id: string,
  quantidade = 1,
): Promise<{ ok: boolean; concluida: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("quantidade_exigida, quantidade_feita, recorrencia, data_prevista")
    .eq("id", id)
    .maybeSingle();

  if (!tarefa) return { ok: false, concluida: false, erro: "Tarefa não encontrada." };

  const feita = Math.max(0, tarefa.quantidade_feita + quantidade);
  const concluida = feita >= tarefa.quantidade_exigida;

  const { error } = await supabase
    .from("tarefas")
    .update({
      quantidade_feita: feita,
      estado: concluida ? "concluida" : "aberta",
      concluida_em: concluida ? hojeLocal() : null,
    })
    .eq("id", id);

  if (error) return { ok: false, concluida: false, erro: error.message };
  revalidar();
  return { ok: true, concluida };
}

export async function adiarTarefa(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { data: tarefa } = await supabase
    .from("tarefas")
    .select("automatica, adiada_vezes, data_prevista, janela")
    .eq("id", id)
    .maybeSingle();

  if (!tarefa) return { ok: false, erro: "Tarefa não encontrada." };
  if (!podeAdiar({ automatica: tarefa.automatica, adiadaVezes: tarefa.adiada_vezes })) {
    return { ok: false, erro: "Tarefa automática só pode ser adiada uma vez." };
  }

  const { error } = await supabase
    .from("tarefas")
    .update({
      data_prevista: novaDataAoAdiar(tarefa.data_prevista, tarefa.janela),
      adiada_vezes: tarefa.adiada_vezes + 1,
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

export async function dispensarTarefa(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase
    .from("tarefas")
    .update({ estado: "dispensada", dispensada_em: hojeLocal() })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}

export async function reabrirTarefa(id: string): Promise<{ ok: boolean; erro?: string }> {
  const { supabase } = await sessao();
  const { error } = await supabase
    .from("tarefas")
    .update({ estado: "aberta", concluida_em: null, dispensada_em: null, quantidade_feita: 0 })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };
  revalidar();
  return { ok: true };
}
