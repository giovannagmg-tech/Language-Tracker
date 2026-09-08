import "server-only";
import { acumuladoDe } from "@/lib/domain/camadas";
import {
  avaliar,
  reconciliar,
  type ContextoConquistas,
  type ContextoIdioma,
  type DefinicaoConquista,
  type EstadoConquista,
} from "@/lib/domain/conquistas";
import {
  anoDe,
  chaveSemana,
  diaDaSemana,
  dias,
  hoje as hojeLocal,
  intervalo,
  mesDe,
  semanaDe,
  somaDias,
  type DataISO,
} from "@/lib/domain/datas";
import { maiorLacuna } from "@/lib/domain/lacunas";
import { composicao, distribuicaoPilares, noPeriodo } from "@/lib/domain/metrics";
import type { RevisaoDominio, SessaoDominio } from "@/lib/domain/modelos";
import { diasComPiso, diasComRegistro } from "@/lib/domain/piso";
import { sequencia } from "@/lib/domain/sequencias";
import { PILARES, type Atividade, type Categoria, type Pilar, type TempoDoDia } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";

/** Dias corridos desde a última vez em que dois dias seguidos ficaram em branco. */
function diasDesdeDoisEmBranco(datas: Set<DataISO>, hoje: DataISO, janela: number): number {
  const inicio = somaDias(hoje, -janela);
  const todos = intervalo(inicio, hoje);
  let ultimo: DataISO | null = null;
  for (let i = 1; i < todos.length; i += 1) {
    if (!datas.has(todos[i - 1]) && !datas.has(todos[i])) ultimo = todos[i];
  }
  return ultimo === null ? janela : dias(ultimo, hoje);
}

/** Ocorrências consecutivas de um dia da semana que satisfazem a condição. */
function diasDaSemanaSeguidos(
  hoje: DataISO,
  diaAlvo: number,
  satisfaz: (d: DataISO) => boolean,
  maximo = 52,
): number {
  let cursor = hoje;
  while (diaDaSemana(cursor) !== diaAlvo) cursor = somaDias(cursor, -1);

  let total = 0;
  for (let i = 0; i < maximo; i += 1) {
    if (!satisfaz(cursor)) break;
    total += 1;
    cursor = somaDias(cursor, -7);
  }
  return total;
}

function semanasSeguidasComFala(
  sessoes: SessaoDominio[],
  hoje: DataISO,
  minimo: number,
  maximo = 52,
): number {
  const porSemana = new Map<DataISO, number>();
  for (const s of sessoes) {
    const chave = chaveSemana(s.data);
    porSemana.set(chave, (porSemana.get(chave) ?? 0) + s.minutosFala);
  }
  // Começa na última semana fechada: a semana corrente ainda pode crescer.
  let cursor = somaDias(chaveSemana(hoje), -7);
  let total = 0;
  for (let i = 0; i < maximo; i += 1) {
    if ((porSemana.get(cursor) ?? 0) < minimo) break;
    total += 1;
    cursor = somaDias(cursor, -7);
  }
  return total;
}

export type ResultadoConquistas = {
  avaliadas: number;
  novas: { codigo: string; nome: string; idiomaId: string | null }[];
};

/**
 * Documento 06. Constrói o contexto agregado, avalia o catálogo inteiro e
 * grava só o que mudou. Rodar de novo sobre o mesmo estado não escreve nada.
 */
export async function sincronizarConquistasSeNecessario(): Promise<ResultadoConquistas> {
  const supabase = await supabaseServidor();
  const { data } = await supabase
    .from("conquista_estado")
    .select("ultima_avaliacao_em")
    .order("ultima_avaliacao_em", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const ultima = data?.ultima_avaliacao_em;
  if (ultima && ultima.slice(0, 10) === hojeLocal()) return { avaliadas: 0, novas: [] };
  return sincronizarConquistas();
}

export async function sincronizarConquistas(): Promise<ResultadoConquistas> {
  const supabase = await supabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { avaliadas: 0, novas: [] };

  const hoje = hojeLocal();
  const mes = mesDe(hoje);
  const mesFechado = mesDe(somaDias(mes.inicio, -1));
  const semana = semanaDe(hoje);
  const ano = anoDe(hoje);
  const desde = somaDias(hoje, -400);

  const [
    { data: catalogoRaw },
    { data: estadosRaw },
    { data: sessoesRaw },
    { data: revisoesRaw },
    { data: vocabRaw },
    { data: idiomasRaw },
    { data: camadasRaw },
    { data: alvoRaw },
    { data: tarefasRaw },
    { data: retomadasRaw },
    { data: marchaRaw },
    { data: materiaisRaw },
    { data: progressoRaw },
    { data: autoavaliacoesRaw },
    { data: blocosRaw },
  ] = await Promise.all([
    supabase.from("conquistas").select("*").order("ordem"),
    supabase.from("conquista_estado").select("*"),
    supabase
      .from("sessoes")
      .select("id, data, idioma_id, duracao_min, categoria, pilar, atividade, tempo, minutos_fala, producao, violou_regra_5, via")
      .gte("data", desde),
    supabase.from("revisoes_flashcards").select("data, idioma_id, revisou").gte("data", desde),
    supabase
      .from("registros_vocabulario")
      .select("data, idioma_id, palavras_novas, palavras_ativadas, min_por_palavra, checagem_rodada, qtd_avisos_interferencia"),
    supabase.from("idiomas").select("id, palavras_base").eq("ativo", true),
    supabase.from("camadas").select("numero, limiar"),
    supabase.from("distribuicao_alvo").select("chave, percentual").eq("dimensao", "pilar").is("bloco_id", null),
    supabase.from("tarefas").select("tipo, estado, concluida_em, data_prevista"),
    supabase.from("retomadas").select("inicio, concluida_em, abandonada, fase, ativa"),
    supabase.from("marcha_historico").select("numero, data_inicio, data_fim").is("data_fim", null).maybeSingle(),
    supabase.from("materiais").select("id, idioma_id").eq("principal", true),
    supabase.from("material_progresso").select("material_id, data, posicao").gte("data", mes.inicio),
    supabase.from("autoavaliacoes").select("bloco_id, idioma_id"),
    supabase.from("blocos_plano").select("id, data_fim").lt("data_fim", hoje).order("data_fim", { ascending: false }).limit(1),
  ]);

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
  const vias = new Map((sessoesRaw ?? []).map((s) => [s.id, s.via]));

  const revisoes: RevisaoDominio[] = (revisoesRaw ?? []).map((r) => ({
    data: r.data,
    idiomaId: r.idioma_id,
    revisou: r.revisou,
  }));

  const datasRegistro = diasComRegistro(sessoes, revisoes);
  const datasPiso = diasComPiso(sessoes, revisoes);
  const datasFlash = new Set<DataISO>();
  for (const r of revisoes) if (r.revisou) datasFlash.add(r.data);
  for (const s of sessoes) if (s.atividade === "flashcards") datasFlash.add(s.data);

  const doMes = noPeriodo(sessoes, mes);
  const doMesFechado = noPeriodo(sessoes, mesFechado);
  const daSemana = noPeriodo(sessoes, semana);

  const alvoPilar = Object.fromEntries(
    PILARES.map((p) => [
      p,
      ((alvoRaw ?? []).find((a) => a.chave === p)?.percentual ?? 25) / 100,
    ]),
  ) as Record<Pilar, number>;

  const pilaresMesFechado = distribuicaoPilares(doMesFechado, alvoPilar);
  const baseMesFechado = doMesFechado
    .filter((s) => s.categoria === "ativo")
    .reduce((t, s) => t + s.duracaoMin, 0);

  const camadas = camadasRaw ?? [];
  const limiarPorCamada = Object.fromEntries(camadas.map((c) => [c.numero, c.limiar]));

  const materiaisPorIdioma = new Map((materiaisRaw ?? []).map((m) => [m.idioma_id, m.id]));

  const porIdioma: Record<string, ContextoIdioma> = {};
  for (const idioma of idiomasRaw ?? []) {
    const registros = (vocabRaw ?? []).filter((v) => v.idioma_id === idioma.id);
    const doAnoIdioma = registros.filter((v) => v.data >= ano.inicio && v.data <= ano.fim);
    const velocidades = registros
      .map((v) => v.min_por_palavra)
      .filter((v): v is number => v !== null && v > 0);
    const lotesGrandesRapidos = registros.filter(
      (v) => v.palavras_novas >= 10 && v.min_por_palavra !== null && v.min_por_palavra <= 1,
    );

    const materialId = materiaisPorIdioma.get(idioma.id);
    const pontos = (progressoRaw ?? [])
      .filter((p) => p.material_id === materialId)
      .sort((a, b) => a.data.localeCompare(b.data));

    porIdioma[idioma.id] = {
      idiomaId: idioma.id,
      acumuladoPalavras: acumuladoDe(
        idioma.palavras_base,
        registros.map((v) => ({ data: v.data, idiomaId: idioma.id, palavrasNovas: v.palavras_novas })),
      ),
      limiarPorCamada,
      palavrasNoAno: doAnoIdioma.reduce((t, v) => t + v.palavras_novas, 0),
      melhorMinPorPalavra: velocidades.length > 0 ? Math.min(...velocidades) : null,
      loteMinimoAtingido: lotesGrandesRapidos.length > 0,
      avancoMaterialNoMes:
        pontos.length >= 2 ? pontos[pontos.length - 1].posicao - pontos[0].posicao : 0,
    };
  }

  const pendentesPorDia = new Map<DataISO, number>();
  for (const v of vocabRaw ?? []) {
    const saldo = v.palavras_novas - v.palavras_ativadas;
    if (saldo > 0) pendentesPorDia.set(v.data, (pendentesPorDia.get(v.data) ?? 0) + saldo);
  }
  let diasSemPendentes = 0;
  for (let i = 0; i < 400; i += 1) {
    const d = somaDias(hoje, -i);
    if ((pendentesPorDia.get(d) ?? 0) > 0) break;
    diasSemPendentes += 1;
  }

  const lotesOrdenados = (vocabRaw ?? [])
    .filter((v) => v.checagem_rodada)
    .sort((a, b) => b.data.localeCompare(a.data));
  let lotesLimposSeguidos = 0;
  for (const lote of lotesOrdenados) {
    if (lote.qtd_avisos_interferencia > 0) break;
    lotesLimposSeguidos += 1;
  }

  const temposPorDia = new Map<DataISO, Set<TempoDoDia>>();
  for (const s of daSemana) {
    const atual = temposPorDia.get(s.data) ?? new Set<TempoDoDia>();
    atual.add(s.tempo);
    temposPorDia.set(s.data, atual);
  }

  const retomadas = retomadasRaw ?? [];
  const concluidas = retomadas.filter((r) => r.concluida_em !== null && !r.abandonada);
  const ultimaConcluida = [...concluidas].sort((a, b) =>
    (b.concluida_em ?? "").localeCompare(a.concluida_em ?? ""),
  )[0];

  const blocoFechadoId = (blocosRaw ?? [])[0]?.id ?? null;

  const lacunaGrande = (() => {
    for (let i = 0; i < 400; i += 1) {
      const fim = somaDias(hoje, -i);
      const janela = { inicio: somaDias(fim, -7), fim };
      if (maiorLacuna(datasRegistro, janela, hoje).dias > 7) return i;
    }
    return 400;
  })();

  const ctx: ContextoConquistas = {
    hoje,
    streakRegistro: sequencia(datasRegistro, hoje),
    streakPiso: sequencia(datasPiso, hoje),
    streakFlashcards: sequencia(datasFlash, hoje),
    diasRegistroMes: [...datasRegistro].filter((d) => d >= mes.inicio && d <= mes.fim).length,
    diasFlashcardsMes: [...datasFlash].filter((d) => d >= mes.inicio && d <= mes.fim).length,
    maiorLacunaMesFechado: maiorLacuna(datasRegistro, mesFechado, hoje).dias,
    mesFechadoTemRegistro: [...datasRegistro].some(
      (d) => d >= mesFechado.inicio && d <= mesFechado.fim,
    ),
    diasSemDoisEmBranco: diasDesdeDoisEmBranco(datasRegistro, hoje, 120),
    sextasSeguidasComRegistro: diasDaSemanaSeguidos(hoje, 5, (d) => datasRegistro.has(d)),
    conversasNoMes: doMes.filter((s) => s.atividade === "conversacao" || s.atividade === "aula").length,
    falaNaSemana: daSemana.reduce((t, s) => t + s.minutosFala, 0),
    audiosAcumulados: sessoes.filter((s) => s.atividade === "audio_grupo").length,
    videosAcumulados: sessoes.filter((s) => s.atividade === "gravacao_video").length,
    aulasAcumuladas: sessoes.filter((s) => s.atividade === "aula").length,
    pctAtivoMesFechado: doMesFechado.length > 0 ? composicao(doMesFechado).pctAtivo : null,
    sessoesProducaoMes: doMes.filter((s) => s.producao).length,
    semanasFalaSeguidas60: semanasSeguidasComFala(sessoes, hoje, 60),
    semanasFalaSeguidas90: semanasSeguidasComFala(sessoes, hoje, 90),
    idiomasComFalaNaSemana: new Set(
      daSemana.filter((s) => s.minutosFala >= 1).map((s) => s.idiomaId),
    ).size,
    idiomasAtivos: (idiomasRaw ?? []).length,
    sabadosEscritaSeguidos: diasDaSemanaSeguidos(hoje, 6, (d) =>
      sessoes.some((s) => s.data === d && s.atividade === "escrita"),
    ),
    mesFechadoSemViolarRegra5:
      doMesFechado.length > 0 &&
      !doMesFechado.some((s) => s.violouRegra5) &&
      [...datasRegistro].filter((d) => d >= mesFechado.inicio && d <= mesFechado.fim).length >= 10,
    sextasPronunciaSeguidas: diasDaSemanaSeguidos(hoje, 5, (d) => {
      const min = sessoes
        .filter((s) => s.data === d && s.pilar === "pronuncia")
        .reduce((t, s) => t + s.duracaoMin, 0);
      return min >= 25;
    }),
    checagensAcumuladas: (vocabRaw ?? []).filter((v) => v.checagem_rodada).length,
    lotesLimposSeguidos,
    diasSemPendentesAtivacao: diasSemPendentes,
    diasMaosOcupadasMes: new Set(
      doMes.filter((s) => s.tempo === "maos_ocupadas").map((s) => s.data),
    ).size,
    maiorNumeroDeTemposNoDia: Math.max(0, ...[...temposPorDia.values()].map((t) => t.size)),
    pilaresDentroDaTolerancia: pilaresMesFechado.filter((p) => Math.abs(p.desvio) <= 0.05).length,
    mesTemVolumeParaAvaliarPilares: baseMesFechado >= 300,
    correcoesNoPrazo: (tarefasRaw ?? []).filter(
      (t) =>
        t.tipo === "frases_apos_erro" &&
        t.estado === "concluida" &&
        t.concluida_em !== null &&
        t.concluida_em <= t.data_prevista,
    ).length,
    autoavaliacoesDoBlocoFechado: blocoFechadoId
      ? (autoavaliacoesRaw ?? []).filter((a) => a.bloco_id === blocoFechadoId).length
      : 0,
    diasNaMarchaAtual: marchaRaw ? dias(marchaRaw.data_inicio, hoje) + 1 : 0,
    marchaAtual: marchaRaw?.numero ?? 1,
    retomadaConcluidaAgora: ultimaConcluida?.concluida_em === hoje,
    faseAtualDaRetomada: retomadas.find((r) => r.ativa)?.fase ?? 5,
    duracaoUltimaRetomada:
      ultimaConcluida?.concluida_em != null
        ? dias(ultimaConcluida.inicio, ultimaConcluida.concluida_em)
        : null,
    retomadasConcluidas: concluidas.length,
    diasDesdeLacunaGrande: lacunaGrande,
    diasSalvosPelaRegra1: sessoes.filter(
      (s) => vias.get(s.id) === "botao_regra" && s.duracaoMin === 1,
    ).length,
    porIdioma,
  };

  // ---- avaliação ---------------------------------------------------------
  const retomadaAtiva = retomadas.some((r) => r.ativa);
  const catalogo: DefinicaoConquista[] = (catalogoRaw ?? []).map((c) => ({
    codigo: c.codigo,
    nome: c.nome,
    categoria: c.categoria,
    criterioTexto: c.criterio_texto,
    criterioChave: c.criterio_chave,
    parametros: (c.parametros ?? {}) as Record<string, number | string>,
    escopo: c.escopo,
    repetivel: c.repetivel,
    janelaRepeticao: c.janela_repeticao,
    ordem: c.ordem,
  }));

  const estados = new Map(
    (estadosRaw ?? []).map((e) => [`${e.conquista_codigo}:${e.idioma_id ?? "global"}`, e]),
  );

  const janelaAtual = (janela: string | null): string => {
    if (janela === "mensal") return hoje.slice(0, 7);
    if (janela === "semanal") return chaveSemana(hoje);
    if (janela === "anual") return hoje.slice(0, 4);
    return hoje;
  };

  const atualizacoes: {
    codigo: string;
    idiomaId: string | null;
    estado: EstadoConquista;
  }[] = [];
  const novas: ResultadoConquistas["novas"] = [];
  let avaliadas = 0;

  for (const definicao of catalogo) {
    const alvos = definicao.escopo === "global" ? [null] : (idiomasRaw ?? []).map((i) => i.id);

    for (const idiomaId of alvos) {
      avaliadas += 1;
      const chave = `${definicao.codigo}:${idiomaId ?? "global"}`;
      const gravado = estados.get(chave);
      const anterior: EstadoConquista | undefined = gravado
        ? {
            codigo: gravado.conquista_codigo,
            idiomaId: gravado.idioma_id,
            conquistada: gravado.estado === "conquistada",
            progressoAtual: Number(gravado.progresso_atual),
            progressoAlvo: Number(gravado.progresso_alvo),
            conquistadaEm: gravado.conquistada_em,
            vezes: gravado.vezes,
          }
        : undefined;

      const suspensa = retomadaAtiva && definicao.categoria === "consistencia";
      const avaliacao = avaliar(definicao, ctx, idiomaId ?? undefined);
      const janelaAnterior = anterior?.conquistadaEm
        ? janelaAtual(definicao.janelaRepeticao) === hoje.slice(0, 7)
          ? anterior.conquistadaEm.slice(0, 7)
          : anterior.conquistadaEm
        : null;

      const novo = reconciliar(
        definicao,
        anterior,
        avaliacao,
        janelaAtual(definicao.janelaRepeticao),
        janelaAnterior,
        suspensa,
      );

      if (!novo) continue;
      atualizacoes.push({ codigo: definicao.codigo, idiomaId, estado: novo });
      if (novo.conquistada && !anterior?.conquistada) {
        novas.push({ codigo: definicao.codigo, nome: definicao.nome, idiomaId });
      }
    }
  }

  if (atualizacoes.length > 0) {
    for (const u of atualizacoes) {
      const filtro = supabase
        .from("conquista_estado")
        .update({
          estado: u.estado.conquistada ? "conquistada" : "bloqueada",
          progresso_atual: u.estado.progressoAtual,
          progresso_alvo: u.estado.progressoAlvo,
          conquistada_em: u.estado.conquistadaEm,
          vezes: u.estado.vezes,
          ultima_avaliacao_em: new Date().toISOString(),
        })
        .eq("conquista_codigo", u.codigo);

      await (u.idiomaId ? filtro.eq("idioma_id", u.idiomaId) : filtro.is("idioma_id", null));
    }
  }

  return { avaliadas, novas };
}
