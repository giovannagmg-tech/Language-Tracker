"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hoje as hojeLocal, somaDias } from "@/lib/domain/datas";
import { LIMITE_DE_ADIAMENTOS } from "@/lib/domain/tarefas-manuais";
import { PILARES } from "@/lib/domain/tipos";
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
  revalidatePath("/calendario");
  revalidatePath("/tarefas");
  revalidatePath("/hoje");
}

const uuid = z.string().uuid();
const dataISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

const entrada = z.object({
  titulo: z.string().trim().min(1, "A tarefa precisa de um título.").max(140),
  descricao: z.string().trim().max(500).nullish(),
  idiomaId: uuid.nullish(),
  data: dataISO,
  pilar: z.enum(PILARES).nullish(),
  horaPrevista: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Horário inválido.")
    .nullish(),
  duracaoPrevistaMin: z.coerce.number().int().min(1).max(480).nullish(),
  doDia: z.coerce.boolean().default(false),
});

export type EntradaTarefaManual = z.input<typeof entrada>;

/**
 * O índice único `tarefas_uma_do_dia` recusa a segunda tarefa marcada no mesmo
 * dia. Em vez de devolver erro de banco, desmarcamos a anterior — que é o que
 * "essa é a do dia" significa: trocar de escolha, não empilhar escolhas.
 */
async function liberarDoDia(
  supabase: Awaited<ReturnType<typeof sessao>>["supabase"],
  userId: string,
  data: string,
  exceto?: string,
) {
  let q = supabase
    .from("tarefas")
    .update({ do_dia: false })
    .eq("user_id", userId)
    .eq("data_prevista", data)
    .eq("do_dia", true);
  if (exceto) q = q.neq("id", exceto);
  await q;
}

export async function criarTarefaManual(
  bruta: EntradaTarefaManual,
): Promise<{ ok: boolean; erro?: string; id?: string }> {
  const parsed = entrada.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  if (d.doDia) await liberarDoDia(supabase, userId, d.data);

  const { data: criada, error } = await supabase
    .from("tarefas")
    .insert({
      user_id: userId,
      tipo: "manual",
      automatica: false,
      titulo: d.titulo,
      descricao: d.descricao || null,
      idioma_id: d.idiomaId ?? null,
      data_prevista: d.data,
      pilar: d.pilar ?? null,
      hora_prevista: d.horaPrevista ? `${d.horaPrevista}:00` : null,
      duracao_prevista_min: d.duracaoPrevistaMin ?? null,
      do_dia: d.doDia,
      janela: "dia",
      // Tarefa manual não tem idempotência de motor; a chave é o próprio id.
      chave_idempotencia: `manual:${crypto.randomUUID()}`,
    })
    .select("id")
    .single();

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true, id: criada.id };
}

export async function editarTarefaManual(
  id: string,
  bruta: EntradaTarefaManual,
): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(id).success) return { ok: false, erro: "Tarefa inválida." };
  const parsed = entrada.safeParse(bruta);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };

  const { supabase, userId } = await sessao();
  const d = parsed.data;

  // RN-1204: automática é do motor de marcha; a tela nem oferece, mas a ação
  // também recusa — a defesa que importa é a do servidor.
  const { data: atual } = await supabase
    .from("tarefas")
    .select("automatica")
    .eq("id", id)
    .single();
  if (!atual) return { ok: false, erro: "Tarefa não encontrada." };
  if (atual.automatica) return { ok: false, erro: "Tarefa automática não é editável." };

  if (d.doDia) await liberarDoDia(supabase, userId, d.data, id);

  const { error } = await supabase
    .from("tarefas")
    .update({
      titulo: d.titulo,
      descricao: d.descricao || null,
      idioma_id: d.idiomaId ?? null,
      data_prevista: d.data,
      pilar: d.pilar ?? null,
      hora_prevista: d.horaPrevista ? `${d.horaPrevista}:00` : null,
      duracao_prevista_min: d.duracaoPrevistaMin ?? null,
      do_dia: d.doDia,
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

export async function excluirTarefaManual(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(id).success) return { ok: false, erro: "Tarefa inválida." };

  const { supabase } = await sessao();
  const { data: atual } = await supabase
    .from("tarefas")
    .select("automatica")
    .eq("id", id)
    .single();
  if (atual?.automatica) {
    return { ok: false, erro: "Tarefa automática não se apaga — dispense-a." };
  }

  const { error } = await supabase.from("tarefas").delete().eq("id", id);
  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

/** RN-803: adiar um dia, uma vez só. */
export async function adiarTarefa(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(id).success) return { ok: false, erro: "Tarefa inválida." };

  const { supabase } = await sessao();
  const { data: atual } = await supabase
    .from("tarefas")
    .select("data_prevista, adiada_vezes, estado")
    .eq("id", id)
    .single();

  if (!atual) return { ok: false, erro: "Tarefa não encontrada." };
  if (atual.estado === "concluida") return { ok: false, erro: "Tarefa já concluída." };
  if (atual.adiada_vezes >= LIMITE_DE_ADIAMENTOS) {
    return { ok: false, erro: "Essa já foi adiada uma vez. Faça, mude a data ou dispense." };
  }

  // Adiar a partir de hoje, não da data original: uma tarefa de quatro dias
  // atrás iria para três dias atrás, o que não adia nada.
  const base = atual.data_prevista > hojeLocal() ? atual.data_prevista : hojeLocal();

  const { error } = await supabase
    .from("tarefas")
    .update({
      data_prevista: somaDias(base, 1),
      adiada_vezes: atual.adiada_vezes + 1,
      estado: "adiada",
    })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

export async function alternarDoDia(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(id).success) return { ok: false, erro: "Tarefa inválida." };

  const { supabase, userId } = await sessao();
  const { data: atual } = await supabase
    .from("tarefas")
    .select("do_dia, data_prevista")
    .eq("id", id)
    .single();
  if (!atual) return { ok: false, erro: "Tarefa não encontrada." };

  if (!atual.do_dia) await liberarDoDia(supabase, userId, atual.data_prevista, id);

  const { error } = await supabase
    .from("tarefas")
    .update({ do_dia: !atual.do_dia })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

export async function dispensarTarefa(id: string): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(id).success) return { ok: false, erro: "Tarefa inválida." };

  const { supabase } = await sessao();
  const { error } = await supabase
    .from("tarefas")
    .update({ estado: "dispensada", dispensada_em: hojeLocal(), do_dia: false })
    .eq("id", id);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}

/**
 * RN-1207. Chamado pelo registro rápido depois que a sessão foi gravada: é o
 * salvar da sessão que conclui a tarefa, nunca o contrário. Se a sessão falha,
 * a tarefa continua aberta — que é a verdade.
 */
export async function concluirTarefaComSessao(
  tarefaId: string,
  sessaoId: string,
): Promise<{ ok: boolean; erro?: string }> {
  if (!uuid.safeParse(tarefaId).success || !uuid.safeParse(sessaoId).success) {
    return { ok: false, erro: "Referência inválida." };
  }

  const { supabase } = await sessao();
  const { error } = await supabase
    .from("tarefas")
    .update({
      estado: "concluida",
      concluida_em: hojeLocal(),
      sessao_id: sessaoId,
      quantidade_feita: 1,
    })
    .eq("id", tarefaId);

  if (error) return { ok: false, erro: error.message };

  revalidar();
  return { ok: true };
}
