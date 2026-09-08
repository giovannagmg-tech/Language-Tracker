import "server-only";
import { hoje as hojeLocal, somaDias } from "@/lib/domain/datas";
import { diasSemRegistro } from "@/lib/domain/lacunas";
import { diasComRegistro } from "@/lib/domain/piso";
import {
  avaliarProgresso,
  definicaoDaFase,
  deveEntrarEmRetomada,
  diaCumpreFase,
  duracaoEmDias,
  type DiaDaRetomada,
  type NumeroFase,
} from "@/lib/domain/retomada";
import { supabaseServidor } from "@/lib/supabase/server";

export type RetomadaAtiva = {
  id: string;
  inicio: string;
  fase: NumeroFase;
  diasCumpridos: number;
  diasExigidos: number;
  nomeFase: string;
  resumoFase: string;
  diasDeLacuna: number;
};

export type EstadoMotorRetomada = {
  ativa: RetomadaAtiva | null;
  entrouAgora: boolean;
  avancouAgora: boolean;
  concluiuAgora: boolean;
};

/**
 * RN-601 a RN-604. Detecta a lacuna, cria o protocolo, marca o dia quando ele
 * cumpre a fase e avança. Nunca regride: os dias já contados não são perdidos.
 */
export async function sincronizarRetomada(): Promise<EstadoMotorRetomada> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ativa: null, entrouAgora: false, avancouAgora: false, concluiuAgora: false };

  const hoje = hojeLocal();

  const [{ data: config }, { data: retomadaRaw }] = await Promise.all([
    supabase.from("config").select("dias_para_retomada").maybeSingle(),
    supabase
      .from("retomadas")
      .select("id, inicio, fase, dias_de_lacuna")
      .eq("ativa", true)
      .maybeSingle(),
  ]);

  const limiar = config?.dias_para_retomada ?? 7;

  // ---- entrada -----------------------------------------------------------
  if (!retomadaRaw) {
    const desde = somaDias(hoje, -120);
    const [{ data: sessoes }, { data: revisoes }] = await Promise.all([
      supabase.from("sessoes").select("data").gte("data", desde),
      supabase.from("revisoes_flashcards").select("data, revisou").gte("data", desde),
    ]);

    const datas = diasComRegistro(
      (sessoes ?? []).map((s) => ({ data: s.data })),
      (revisoes ?? []).map((r) => ({ data: r.data, revisou: r.revisou })),
    );
    const lacuna = diasSemRegistro(datas, hoje);

    if (!deveEntrarEmRetomada(lacuna, limiar, false)) {
      return { ativa: null, entrouAgora: false, avancouAgora: false, concluiuAgora: false };
    }

    const { data: criada } = await supabase
      .from("retomadas")
      .insert({ user_id: user.id, inicio: hoje, dias_de_lacuna: lacuna, fase: 1 })
      .select("id, inicio, fase, dias_de_lacuna")
      .single();

    if (!criada) return { ativa: null, entrouAgora: false, avancouAgora: false, concluiuAgora: false };

    const def = definicaoDaFase(1);
    return {
      ativa: {
        id: criada.id,
        inicio: criada.inicio,
        fase: 1,
        diasCumpridos: 0,
        diasExigidos: def.diasExigidos,
        nomeFase: def.nome,
        resumoFase: def.resumo,
        diasDeLacuna: criada.dias_de_lacuna,
      },
      entrouAgora: true,
      avancouAgora: false,
      concluiuAgora: false,
    };
  }

  // ---- progresso ---------------------------------------------------------
  const fase = retomadaRaw.fase as NumeroFase;

  const [{ data: sessoesHoje }, { data: revisoesHoje }, { data: vocabHoje }, { data: idiomas }, { data: fasesLog }] =
    await Promise.all([
      supabase.from("sessoes").select("atividade, pilar").eq("data", hoje),
      supabase.from("revisoes_flashcards").select("revisou").eq("data", hoje),
      supabase.from("registros_vocabulario").select("palavras_novas").eq("data", hoje),
      supabase.from("idiomas").select("meta_palavras_dia").eq("ativo", true),
      supabase
        .from("retomada_fases")
        .select("data, cumprida")
        .eq("retomada_id", retomadaRaw.id)
        .eq("fase", fase),
    ]);

  const atividades = (sessoesHoje ?? []).map((s) => s.atividade);
  const pilares = (sessoesHoje ?? []).map((s) => s.pilar);
  const metaMaisAlta = Math.max(1, ...(idiomas ?? []).map((i) => i.meta_palavras_dia));

  const dia: DiaDaRetomada = {
    temBrowserMode: atividades.includes("browser_mode"),
    temCheckFlashcards: (revisoesHoje ?? []).some((r) => r.revisou),
    temRevisaoDeConteudo: pilares.some((p) => p === "gramatica" || p === "pronuncia"),
    temConteudoNovo: pilares.some((p) => p === "gramatica" || p === "pronuncia"),
    palavrasNovas: (vocabHoje ?? []).reduce((t, v) => t + v.palavras_novas, 0),
    metaPalavrasDia: metaMaisAlta,
  };

  const cumpreHoje = diaCumpreFase(fase, dia);
  const jaRegistradoHoje = (fasesLog ?? []).some((f) => f.data === hoje && f.cumprida);

  if (cumpreHoje && !jaRegistradoHoje) {
    await supabase.from("retomada_fases").upsert(
      { user_id: user.id, retomada_id: retomadaRaw.id, fase, data: hoje, cumprida: true },
      { onConflict: "retomada_id,fase,data" },
    );
  }

  const cumpridos = new Set((fasesLog ?? []).filter((f) => f.cumprida).map((f) => f.data));
  if (cumpreHoje) cumpridos.add(hoje);

  const progresso = avaliarProgresso(fase, cumpridos.size);

  if (progresso.concluida) {
    await supabase
      .from("retomadas")
      .update({ ativa: false, concluida_em: hoje })
      .eq("id", retomadaRaw.id);
    return { ativa: null, entrouAgora: false, avancouAgora: false, concluiuAgora: true };
  }

  if (progresso.avancou) {
    await supabase.from("retomadas").update({ fase: progresso.fase }).eq("id", retomadaRaw.id);
  }

  const def = definicaoDaFase(progresso.fase);
  return {
    ativa: {
      id: retomadaRaw.id,
      inicio: retomadaRaw.inicio,
      fase: progresso.fase,
      diasCumpridos: progresso.diasCumpridos,
      diasExigidos: def.diasExigidos,
      nomeFase: def.nome,
      resumoFase: def.resumo,
      diasDeLacuna: retomadaRaw.dias_de_lacuna,
    },
    entrouAgora: false,
    avancouAgora: progresso.avancou,
    concluiuAgora: false,
  };
}

export async function duracaoDaUltimaRetomada(): Promise<number | null> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("retomadas")
    .select("inicio, concluida_em")
    .not("concluida_em", "is", null)
    .order("concluida_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.concluida_em) return null;
  return duracaoEmDias(data.inicio, data.concluida_em);
}
