import "server-only";
import { chaveSemana, hoje as hojeLocal, mesDe, somaDias } from "@/lib/domain/datas";
import { tarefasAGerar, type ContextoTarefas } from "@/lib/domain/tarefas";
import { marchaVigente } from "@/lib/queries/marcha";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Marcha } from "@/lib/domain/tipos";

async function sessao() {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão.");
  return { supabase, userId: user.id };
}

/**
 * RN-801 e RN-802. Lê o estado, pergunta ao domínio o que falta, e grava só
 * o que ainda não existe aberto. Roda na abertura de Hoje e de Tarefas —
 * rodar duas vezes no mesmo dia não pode duplicar nada.
 */
export async function sincronizarTarefas(): Promise<{ criadas: number }> {
  const { supabase, userId } = await sessao();
  const hoje = hojeLocal();
  const semana = chaveSemana(hoje);
  const mes = mesDe(hoje);
  const marcha = await marchaVigente();

  const [
    { data: sessoesSemana },
    { data: sessoesMes },
    { data: clube },
    { data: vocab },
    { data: pontos },
    { data: blocos },
    { data: autoavaliacoes },
    { data: idiomas },
  ] = await Promise.all([
    supabase
      .from("sessoes")
      .select("atividade")
      .gte("data", semana)
      .lte("data", somaDias(semana, 6)),
    supabase
      .from("sessoes")
      .select("atividade")
      .gte("data", mes.inicio)
      .lte("data", mes.fim),
    supabase
      .from("tarefas")
      .select("id")
      .eq("tipo", "clube_conversacao")
      .eq("estado", "aberta")
      .gte("data_prevista", hoje),
    supabase
      .from("registros_vocabulario")
      .select("idioma_id, palavras_novas, palavras_ativadas")
      .gte("data", somaDias(hoje, -30)),
    supabase
      .from("pontos_gramaticais")
      .select("id, idioma_id, titulo, frases_exigidas")
      .eq("estado", "errei"),
    supabase.from("blocos_plano").select("id, nome, data_fim").lt("data_fim", hoje),
    supabase.from("autoavaliacoes").select("bloco_id, idioma_id"),
    supabase.from("idiomas").select("id, nome").eq("ativo", true),
  ]);

  const pendentesPorIdioma = new Map<string, number>();
  for (const r of vocab ?? []) {
    const saldo = r.palavras_novas - r.palavras_ativadas;
    if (saldo > 0) {
      pendentesPorIdioma.set(r.idioma_id, (pendentesPorIdioma.get(r.idioma_id) ?? 0) + saldo);
    }
  }

  // Só o bloco mais recente que já fechou é cobrado — não os quatro do plano.
  const blocoFechado = (blocos ?? []).sort((a, b) => b.data_fim.localeCompare(a.data_fim))[0];
  const jaAvaliados = new Set(
    (autoavaliacoes ?? []).map((a) => `${a.bloco_id}:${a.idioma_id}`),
  );
  const autoavaliacoesPendentes = blocoFechado
    ? (idiomas ?? [])
        .filter((i) => !jaAvaliados.has(`${blocoFechado.id}:${i.id}`))
        .map((i) => ({ blocoId: blocoFechado.id, idiomaId: i.id, nomeIdioma: i.nome }))
    : [];

  const ctx: ContextoTarefas = {
    hoje,
    marchaAtiva: marcha as Marcha,
    pendentesAtivacao: [...pendentesPorIdioma].map(([idiomaId, quantidade]) => ({
      idiomaId,
      quantidade,
    })),
    pontosComErro: (pontos ?? []).map((p) => ({
      id: p.id,
      idiomaId: p.idioma_id,
      titulo: p.titulo,
      frasesExigidas: p.frases_exigidas,
    })),
    audioNaSemana: (sessoesSemana ?? []).some((s) => s.atividade === "audio_grupo"),
    clubeAgendado: (clube ?? []).length > 0,
    conversacaoNaSemana: (sessoesSemana ?? []).some(
      (s) => s.atividade === "conversacao" || s.atividade === "aula",
    ),
    videoNoMes: (sessoesMes ?? []).some((s) => s.atividade === "gravacao_video"),
    autoavaliacoesPendentes,
  };

  const candidatas = tarefasAGerar(ctx);
  if (candidatas.length === 0) return { criadas: 0 };

  const { data: abertas } = await supabase
    .from("tarefas")
    .select("chave_idempotencia")
    .eq("estado", "aberta");
  const existentes = new Set((abertas ?? []).map((t) => t.chave_idempotencia));

  // Dispensada na mesma janela não volta (RN-803).
  const { data: dispensadas } = await supabase
    .from("tarefas")
    .select("chave_idempotencia")
    .eq("estado", "dispensada");
  for (const d of dispensadas ?? []) existentes.add(d.chave_idempotencia);

  const { data: concluidas } = await supabase
    .from("tarefas")
    .select("chave_idempotencia")
    .eq("estado", "concluida");
  for (const c of concluidas ?? []) existentes.add(c.chave_idempotencia);

  const aInserir = candidatas.filter((t) => !existentes.has(t.chaveIdempotencia));
  if (aInserir.length === 0) return { criadas: 0 };

  const { error } = await supabase.from("tarefas").insert(
    aInserir.map((t) => ({
      user_id: userId,
      tipo: t.tipo,
      automatica: true,
      titulo: t.titulo,
      idioma_id: t.idiomaId,
      data_prevista: t.dataPrevista,
      janela: t.janela,
      chave_idempotencia: t.chaveIdempotencia,
      quantidade_exigida: t.quantidadeExigida,
      ponto_gramatical_id: t.pontoGramaticalId ?? null,
    })),
  );

  if (error) return { criadas: 0 };
  return { criadas: aInserir.length };
}

