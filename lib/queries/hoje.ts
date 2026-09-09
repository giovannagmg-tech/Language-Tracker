import "server-only";
import { cache } from "react";
import {
  hoje as hojeLocal,
  horaLocal,
  semanaDe,
  somaDias,
  type DataISO,
} from "@/lib/domain/datas";
import {
  diasComPiso,
  diasComRegistro,
  minutosFalaPorIdioma,
  pisoDoDia,
  type Piso,
} from "@/lib/domain/piso";
import { tarefasDoDia, pendentesDoDia } from "@/lib/domain/marchas";
import { avaliarSeisRegras, regrasEmRisco, type RegraAvaliada } from "@/lib/domain/regras";
import { faltamParaRecorde, maiorSequencia, sequencia } from "@/lib/domain/sequencias";
import type {
  DefinicaoMarcha,
  RevisaoDominio,
  SessaoDominio,
  TarefaAvaliada,
} from "@/lib/domain/modelos";
import type { Atividade, Categoria, Marcha, Pilar, TempoDoDia } from "@/lib/domain/tipos";
import { tarefasDeMarcha } from "@/lib/schemas/marcha";
import { supabaseServidor } from "@/lib/supabase/server";

/** Janela de histórico que a tela Hoje precisa: sequência e recorde do ano. */
const DIAS_DE_HISTORICO = 400;

export type IdiomaResumo = {
  id: string;
  slug: string;
  nome: string;
  bandeira: string;
  cor: string;
};

export type EstadoHoje = {
  hoje: DataISO;
  hora: number;
  horaAperto: number;
  marcha: Marcha;
  nomeMarcha: string;
  idiomas: IdiomaResumo[];
  idiomaFocoId: string;
  piso: Piso;
  /** Minutos de fala de hoje por idioma; idioma sem fala não aparece. */
  minutosFalaPorIdioma: Record<string, number>;
  tarefas: TarefaAvaliada[];
  pendentes: number;
  regras: RegraAvaliada[];
  emRisco: number;
  streakRegistro: number;
  streakPiso: number;
  recorde: number;
  faltamRecorde: number;
  revisoesDoDia: RevisaoDominio[];
  sessoesDoDia: SessaoDominio[];
  pilaresDoDia: (Pilar | null)[];
};

/** Memoizado por requisição: o layout e a página Hoje compartilham a mesma leitura. */
export const carregarHoje = cache(async function carregarHoje(): Promise<EstadoHoje> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();
  const hora = horaLocal();
  const semana = semanaDe(hoje);
  const desde = somaDias(hoje, -DIAS_DE_HISTORICO);

  const [
    { data: config },
    { data: idiomasRaw },
    { data: marchaRaw },
    { data: defsRaw },
    { data: blocoRaw },
    { data: sessoesRaw },
    { data: revisoesRaw },
    { data: clubeRaw },
  ] = await Promise.all([
    supabase.from("config").select("hora_aperto").maybeSingle(),
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    supabase.from("marcha_historico").select("numero").is("data_fim", null).maybeSingle(),
    supabase.from("marchas_def").select("numero, nome, descricao, tarefas").order("numero"),
    supabase
      .from("blocos_plano")
      .select("idioma_foco")
      .lte("data_inicio", hoje)
      .gte("data_fim", hoje)
      .maybeSingle(),
    supabase
      .from("sessoes")
      .select(
        "id, data, idioma_id, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, producao, violou_regra_5",
      )
      .gte("data", desde),
    supabase.from("revisoes_flashcards").select("data, idioma_id, revisou").gte("data", desde),
    supabase
      .from("tarefas")
      .select("id")
      .eq("tipo", "clube_conversacao")
      .eq("estado", "aberta")
      .gte("data_prevista", hoje)
      .lte("data_prevista", somaDias(hoje, 13)),
  ]);

  const idiomas: IdiomaResumo[] = idiomasRaw ?? [];
  const marcha = (marchaRaw?.numero ?? 1) as Marcha;

  // Definição de marcha é dado editável: uma tarefa malformada não pode derrubar
  // a tela inteira. A inválida é ignorada e reportada.
  const definicoes: DefinicaoMarcha[] = (defsRaw ?? []).map((d) => {
    const analise = tarefasDeMarcha.safeParse(d.tarefas);
    if (!analise.success) {
      console.error(`Marcha ${d.numero} com tarefas inválidas`, analise.error.issues);
    }
    return {
      numero: d.numero as Marcha,
      nome: d.nome,
      descricao: d.descricao,
      tarefas: analise.success ? analise.data : [],
    };
  });

  const sessoes: SessaoDominio[] = (sessoesRaw ?? []).map((s) => ({
    id: s.id,
    data: s.data,
    idiomaId: s.idioma_id,
    duracaoMin: s.duracao_min,
    categoria: s.categoria as Categoria,
    pilar: s.pilar as Pilar | null,
    atividade: s.atividade as Atividade,
    tempo: s.tempo as TempoDoDia,
    minutosFala: s.minutos_fala,
    producao: s.producao,
    violouRegra5: s.violou_regra_5,
  }));

  const revisoes: RevisaoDominio[] = (revisoesRaw ?? []).map((r) => ({
    data: r.data,
    idiomaId: r.idioma_id,
    revisou: r.revisou,
  }));

  const sessoesDoDia = sessoes.filter((s) => s.data === hoje);
  const revisoesDoDia = revisoes.filter((r) => r.data === hoje);
  const sessoesDaSemana = sessoes.filter((s) => s.data >= semana.inicio && s.data <= semana.fim);
  const sessoesDaSemanaTodas = sessoesDaSemana;

  const horaAperto = config?.hora_aperto ?? 20;
  const piso = pisoDoDia({ revisoes: revisoesDoDia, sessoes: sessoesDoDia, hora, horaAperto });

  const tarefas = tarefasDoDia({
    definicoes,
    marchaAtiva: marcha,
    data: hoje,
    sessoesDoDia,
    revisoesDoDia,
    sessoesDaSemana: sessoesDaSemanaTodas,
    itensRevisaoResolvidosNoDia: 0,
  });

  const datasRegistro = diasComRegistro(sessoes, revisoes);
  const datasPiso = diasComPiso(sessoes, revisoes);
  const ontem = somaDias(hoje, -1);

  const regras = avaliarSeisRegras({
    hoje,
    hora,
    horaAperto,
    marchaAtiva: marcha,
    emBrancoHoje: !datasRegistro.has(hoje),
    emBrancoOntem: !datasRegistro.has(ontem),
    piso,
    conversacaoNaSemana: sessoesDaSemanaTodas.some(
      (s) => s.atividade === "conversacao" || s.atividade === "aula",
    ),
    clubeAgendado: (clubeRaw ?? []).length > 0,
    audioNaSemana: sessoesDaSemanaTodas.some((s) => s.atividade === "audio_grupo"),
    violouRegra5Hoje: sessoesDoDia.some((s) => s.violouRegra5),
  });

  const streakRegistro = sequencia(datasRegistro, hoje);
  const recorde = maiorSequencia(datasRegistro);

  return {
    hoje,
    hora,
    horaAperto,
    marcha,
    nomeMarcha: definicoes.find((d) => d.numero === marcha)?.nome ?? "Sobrevivência",
    idiomas,
    idiomaFocoId: blocoRaw?.idioma_foco ?? idiomas[0]?.id ?? "",
    piso,
    minutosFalaPorIdioma: minutosFalaPorIdioma(sessoesDoDia),
    tarefas,
    pendentes: pendentesDoDia(tarefas),
    regras,
    emRisco: regrasEmRisco(regras),
    streakRegistro,
    streakPiso: sequencia(datasPiso, hoje),
    recorde,
    faltamRecorde: faltamParaRecorde(streakRegistro, recorde),
    revisoesDoDia,
    sessoesDoDia,
    pilaresDoDia: sessoesDoDia.map((s) => s.pilar),
  };
});
