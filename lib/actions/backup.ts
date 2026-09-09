"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TABELAS, VERSAO_BACKUP, type Backup, type Diagnostico } from "@/lib/backup-tipos";
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

export async function exportarBackup(): Promise<{ ok: boolean; erro?: string; backup?: Backup }> {
  const { supabase } = await sessao();
  const tabelas: Record<string, unknown[]> = {};

  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela).select("*");
    if (error) return { ok: false, erro: `Falha ao ler ${tabela}: ${error.message}` };
    tabelas[tabela] = data ?? [];
  }

  return {
    ok: true,
    backup: { versao: VERSAO_BACKUP, exportadoEm: new Date().toISOString(), tabelas },
  };
}

/** Uma linha por sessão, para abrir em planilha. */
export async function exportarSessoesCSV(): Promise<{ ok: boolean; csv?: string; erro?: string }> {
  const { supabase } = await sessao();

  const [{ data: sessoes, error }, { data: idiomas }] = await Promise.all([
    supabase
      .from("sessoes")
      .select("data, hora_inicio, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, palavras_novas, producao, origem, idioma_id, nota")
      .order("data"),
    supabase.from("idiomas").select("id, nome"),
  ]);

  if (error) return { ok: false, erro: error.message };

  const nome = new Map((idiomas ?? []).map((i) => [i.id, i.nome]));
  const colunas = [
    "data", "hora", "duracao_min", "idioma", "categoria", "pilar",
    "atividade", "tempo", "minutos_fala", "palavras_novas", "producao", "origem", "nota",
  ];

  const escapar = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const linhas = (sessoes ?? []).map((s) =>
    [
      s.data, s.hora_inicio ?? "", s.duracao_min, nome.get(s.idioma_id) ?? "",
      s.categoria, s.pilar ?? "", s.atividade, s.tempo, s.minutos_fala,
      s.palavras_novas, s.producao ? "sim" : "não", s.origem, s.nota ?? "",
    ]
      .map(escapar)
      .join(","),
  );

  return { ok: true, csv: [colunas.join(","), ...linhas].join("\n") };
}

const backupSchema = z.object({
  versao: z.number().int(),
  exportadoEm: z.string(),
  tabelas: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

/**
 * Substitui **todos** os dados. Apaga na ordem inversa da exportação para não
 * bater em chave estrangeira, e reescreve com o user_id de quem está logado —
 * um backup de outra conta vira dado desta, nunca invasão da outra.
 */
export async function importarBackup(
  bruto: unknown,
): Promise<{ ok: boolean; erro?: string; linhas?: number }> {
  const parsed = backupSchema.safeParse(bruto);
  if (!parsed.success) return { ok: false, erro: "Arquivo não parece um backup do Poliglota." };

  if (parsed.data.versao > VERSAO_BACKUP) {
    return {
      ok: false,
      erro: `Backup da versão ${parsed.data.versao}; este app lê até a ${VERSAO_BACKUP}. Atualize o app antes de restaurar.`,
    };
  }

  const { supabase, userId } = await sessao();

  for (const tabela of [...TABELAS].reverse()) {
    const { error } = await supabase.from(tabela).delete().eq("user_id", userId);
    if (error) return { ok: false, erro: `Falha ao limpar ${tabela}: ${error.message}` };
  }

  let total = 0;
  for (const tabela of TABELAS) {
    const linhas = parsed.data.tabelas[tabela] ?? [];
    if (linhas.length === 0) continue;

    const comDono = linhas.map((linha) => ({ ...linha, user_id: userId }));
    for (let i = 0; i < comDono.length; i += 500) {
      const { error } = await supabase.from(tabela).insert(comDono.slice(i, i + 500));
      if (error) return { ok: false, erro: `Falha ao restaurar ${tabela}: ${error.message}` };
    }
    total += linhas.length;
  }

  revalidatePath("/", "layout");
  return { ok: true, linhas: total };
}

export async function carregarDiagnostico(): Promise<Diagnostico> {
  const { supabase } = await sessao();

  const [{ data: telemetria }, { data: sessoes }, { data: aberturas }, { data: config }] =
    await Promise.all([
      supabase.from("telemetria_registro").select("duracao_ms").order("momento", { ascending: false }).limit(30),
      supabase.from("sessoes").select("origem"),
      supabase.from("log_abertura_app").select("data"),
      supabase.from("config").select("backup_ultimo_em").maybeSingle(),
    ]);

  const duracoes = (telemetria ?? []).map((t) => t.duracao_ms).sort((a, b) => a - b);
  const meio = Math.floor(duracoes.length / 2);

  const porOrigem = new Map<string, number>();
  for (const s of sessoes ?? []) porOrigem.set(s.origem, (porOrigem.get(s.origem) ?? 0) + 1);

  return {
    medianaRegistroMs:
      duracoes.length === 0
        ? null
        : duracoes.length % 2 === 0
          ? (duracoes[meio - 1] + duracoes[meio]) / 2
          : duracoes[meio],
    registrosPorOrigem: [...porOrigem].map(([origem, total]) => ({ origem, total })),
    diasComAppAberto: (aberturas ?? []).length,
    totalSessoes: (sessoes ?? []).length,
    ultimoBackup: config?.backup_ultimo_em ?? null,
    hoje: hojeLocal(),
  };
}

export async function marcarBackupFeito(): Promise<{ ok: boolean }> {
  const { supabase, userId } = await sessao();
  await supabase
    .from("config")
    .update({ backup_ultimo_em: new Date().toISOString() })
    .eq("user_id", userId);
  revalidatePath("/configuracoes");
  return { ok: true };
}
