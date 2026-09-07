import { describe, expect, it } from "vitest";
import {
  compararAlvoRealizado,
  conflitoDeBlocos,
  blocoVigente,
  faixaDoDesvio,
  normalizarPara100,
  soma,
  somaValida,
  sugerirFocoDoMes,
  type Bloco,
} from "@/lib/domain/distribuicao";
import { corDoEstado, progressoMeta, progressoPalavrasDoDia } from "@/lib/domain/metas";
import {
  degrausAte,
  degrausRestantes,
  indiceNivel,
  nivelValido,
  progressoNivel,
  variacaoNivel,
} from "@/lib/domain/niveis";
import {
  chaveIdempotencia,
  estaAtrasada,
  fimDoMes,
  novaDataAoAdiar,
  ordenarTarefas,
  podeAdiar,
  proximaQuarta,
  tarefasAGerar,
  type ContextoTarefas,
  type TarefaLista,
} from "@/lib/domain/tarefas";

// ---------------------------------------------------------------------------

describe("RN-503 — níveis", () => {
  it("a escala é ordinal e conhece a ordem do MCER", () => {
    expect(indiceNivel("A0")).toBe(0);
    expect(indiceNivel("B1.2")).toBeLessThan(indiceNivel("B2.2"));
    expect(indiceNivel("C2")).toBe(11);
  });

  it("o inglês parte de B1.2 rumo a B2.2: dois degraus de quatro", () => {
    // B1.2 → B2.1 → B2.2 são 2 degraus
    expect(progressoNivel("B1.2", "B1.2", "B2.2")).toBe(0);
    expect(progressoNivel("B1.2", "B2.1", "B2.2")).toBeCloseTo(0.5, 5);
    expect(progressoNivel("B1.2", "B2.2", "B2.2")).toBe(1);
  });

  it("passar da meta não estoura de 100%", () => {
    expect(progressoNivel("B1.2", "C1.1", "B2.2")).toBe(1);
  });

  it("a barra de degraus inclui as duas pontas", () => {
    expect(degrausAte("B1.2", "B2.2")).toEqual(["B1.2", "B2.1", "B2.2"]);
    expect(degrausRestantes("B1.2", "B2.2")).toBe(2);
    expect(degrausRestantes("C2", "B2.2")).toBe(0);
  });

  it("o francês parte do zero: A0 até B2.1 são sete degraus", () => {
    expect(degrausRestantes("A0", "B2.1")).toBe(7);
    expect(progressoNivel("A0", "A2.1", "B2.1")).toBeCloseTo(3 / 7, 5);
  });

  it("a variação entre autoavaliações tem sinal", () => {
    expect(variacaoNivel("B1.2", "B2.1")).toBe(1);
    expect(variacaoNivel("B2.1", "B1.2")).toBe(-1);
  });

  it("valida a string antes de confiar nela", () => {
    expect(nivelValido("B2.2")).toBe(true);
    expect(nivelValido("B3")).toBe(false);
  });
});

// ---------------------------------------------------------------------------

describe("RN-507 — progresso de meta", () => {
  it("mede o caminho andado entre a base e o alvo", () => {
    // dias com registro: base 12, alvo 20, hoje 16 → metade do caminho
    const p = progressoMeta({ atual: 16, base: 12, alvo: 20 });
    expect(p.progresso).toBeCloseTo(0.5, 5);
    expect(p.atingida).toBe(false);
    expect(p.faltam).toBe(4);
    expect(p.estado).toBe("longe");
  });

  it("60% do caminho já é 'perto'", () => {
    expect(progressoMeta({ atual: 17, base: 12, alvo: 20 }).estado).toBe("perto");
  });

  it("atingir trava em 100%, mesmo passando muito", () => {
    const p = progressoMeta({ atual: 30, base: 12, alvo: 20 });
    expect(p.progresso).toBe(1);
    expect(p.atingida).toBe(true);
    expect(p.faltam).toBe(0);
    expect(corDoEstado(p.estado)).toBe("var(--sucesso)");
  });

  it("maior lacuna inverte: menor é melhor", () => {
    // base 14 dias, alvo 2, hoje 8 → metade do caminho, ainda não atingida
    const p = progressoMeta({ atual: 8, base: 14, alvo: 2, direcao: "menor_melhor" });
    expect(p.progresso).toBeCloseTo(0.5, 5);
    expect(p.atingida).toBe(false);
    expect(progressoMeta({ atual: 1, base: 14, alvo: 2, direcao: "menor_melhor" }).atingida).toBe(true);
  });

  it("regredir abaixo da base não vira progresso negativo", () => {
    expect(progressoMeta({ atual: 5, base: 12, alvo: 20 }).progresso).toBe(0);
  });

  it("base igual ao alvo não divide por zero", () => {
    expect(progressoMeta({ atual: 5, base: 5, alvo: 5 }).progresso).toBe(1);
    expect(progressoMeta({ atual: 3, base: 5, alvo: 5 }).progresso).toBe(0);
  });

  it("meta de palavras do dia parte sempre do zero", () => {
    expect(progressoPalavrasDoDia(0, 5).progresso).toBe(0);
    expect(progressoPalavrasDoDia(5, 5).atingida).toBe(true);
    expect(progressoPalavrasDoDia(3, 5).progresso).toBeCloseTo(0.6, 5);
  });
});

// ---------------------------------------------------------------------------

describe("RN-904 — normalização dos percentuais", () => {
  const pilares = [
    { chave: "vocabulario", percentual: 25 },
    { chave: "gramatica", percentual: 25 },
    { chave: "pronuncia", percentual: 20 },
    { chave: "fala", percentual: 30 },
  ];

  it("a divisão-alvo padrão já soma 100", () => {
    expect(soma(pilares)).toBe(100);
    expect(somaValida(pilares)).toBe(true);
  });

  it("diferença de até 1 ponto é arredondamento, não erro", () => {
    expect(somaValida([{ chave: "a", percentual: 99 }])).toBe(true);
    expect(somaValida([{ chave: "a", percentual: 97 }])).toBe(false);
  });

  it("normalizar preserva o campo que ela acabou de editar", () => {
    const editado = [
      { chave: "vocabulario", percentual: 40 },
      { chave: "gramatica", percentual: 25 },
      { chave: "pronuncia", percentual: 20 },
      { chave: "fala", percentual: 30 },
    ];
    const r = normalizarPara100(editado, "vocabulario");
    expect(r.find((i) => i.chave === "vocabulario")?.percentual).toBe(40);
    expect(soma(r)).toBe(100);
  });

  it("sem campo fixo, redistribui tudo proporcionalmente", () => {
    const r = normalizarPara100([
      { chave: "a", percentual: 50 },
      { chave: "b", percentual: 50 },
      { chave: "c", percentual: 50 },
    ]);
    expect(soma(r)).toBe(100);
  });

  it("todos em zero não trava: divide igual", () => {
    const r = normalizarPara100([
      { chave: "a", percentual: 0 },
      { chave: "b", percentual: 0 },
      { chave: "c", percentual: 0 },
    ]);
    expect(soma(r)).toBe(100);
  });

  it("lista vazia devolve lista vazia", () => {
    expect(normalizarPara100([])).toEqual([]);
  });
});

describe("RN-902 — alvo contra realizado", () => {
  it("até 5 pontos está no alvo, até 15 é atenção, acima é fora", () => {
    expect(faixaDoDesvio(3)).toBe("no_alvo");
    expect(faixaDoDesvio(-5)).toBe("no_alvo");
    expect(faixaDoDesvio(12)).toBe("atencao");
    expect(faixaDoDesvio(-30)).toBe("fora");
  });

  it("compara alvo em pontos com realizado em fração", () => {
    const r = compararAlvoRealizado(
      [
        { chave: "fala", percentual: 30 },
        { chave: "gramatica", percentual: 25 },
      ],
      { fala: 0, gramatica: 0.75 },
    );
    expect(r[0]).toMatchObject({ realizado: 0, delta: -30, faixa: "fora" });
    expect(r[1]).toMatchObject({ realizado: 75, delta: 50, faixa: "fora" });
  });
});

describe("RN-903 — foco do mês", () => {
  const fatias = [
    { pilar: "vocabulario" as const, minutos: 0, real: 0.25, alvo: 0.25, desvio: 0 },
    { pilar: "gramatica" as const, minutos: 0, real: 0.75, alvo: 0.25, desvio: 0.5 },
    { pilar: "pronuncia" as const, minutos: 0, real: 0, alvo: 0.2, desvio: -0.2 },
    { pilar: "fala" as const, minutos: 0, real: 0, alvo: 0.3, desvio: -0.3 },
  ];

  it("sugere o pilar que ficou mais abaixo do alvo, não o que está bem", () => {
    expect(sugerirFocoDoMes("fr", fatias)).toEqual({ idiomaId: "fr", pilar: "fala" });
  });

  it("mês inteiro no alvo não sugere pilar nenhum", () => {
    const noAlvo = fatias.map((f) => ({ ...f, desvio: 0 }));
    expect(sugerirFocoDoMes("fr", noAlvo).pilar).toBeNull();
  });
});

describe("blocos do plano", () => {
  const blocos: Bloco[] = [
    { id: "b1", nome: "B1", dataInicio: "2026-09-07", dataFim: "2026-12-31", idiomaFoco: "fr" },
    { id: "b2", nome: "B2", dataInicio: "2027-01-01", dataFim: "2027-04-30", idiomaFoco: "es" },
  ];

  it("acha o bloco que contém hoje", () => {
    expect(blocoVigente(blocos, "2026-10-01")?.id).toBe("b1");
    expect(blocoVigente(blocos, "2027-02-01")?.id).toBe("b2");
    expect(blocoVigente(blocos, "2026-01-01")).toBeNull();
  });

  it("sobreposição é o único bloqueio de gravação da tela", () => {
    const conflito = conflitoDeBlocos(
      { dataInicio: "2026-12-01", dataFim: "2027-02-01" },
      blocos,
    );
    expect(conflito?.id).toBe("b1");
  });

  it("editar o próprio bloco não conflita consigo mesmo", () => {
    const r = conflitoDeBlocos(
      { dataInicio: "2026-09-07", dataFim: "2026-12-31" },
      blocos,
      "b1",
    );
    expect(r).toBeNull();
  });

  it("blocos encostados não se sobrepõem", () => {
    const r = conflitoDeBlocos({ dataInicio: "2027-05-01", dataFim: "2027-08-31" }, blocos);
    expect(r).toBeNull();
  });
});

// ---------------------------------------------------------------------------

const CTX_VAZIO: ContextoTarefas = {
  hoje: "2026-09-07", // segunda
  marchaAtiva: 1,
  pendentesAtivacao: [],
  pontosComErro: [],
  audioNaSemana: false,
  clubeAgendado: false,
  conversacaoNaSemana: false,
  videoNoMes: false,
  autoavaliacoesPendentes: [],
};

describe("RN-801 / RN-802 — geração de tarefas", () => {
  it("marcha 1 só cobra o áudio da semana", () => {
    const r = tarefasAGerar(CTX_VAZIO);
    expect(r.map((t) => t.tipo)).toEqual(["audio_grupo"]);
    expect(r[0].dataPrevista).toBe("2026-09-13"); // domingo da semana
  });

  it("marcha 2 sem clube marcado cobra o clube", () => {
    const r = tarefasAGerar({ ...CTX_VAZIO, marchaAtiva: 2 });
    expect(r.map((t) => t.tipo)).toContain("clube_conversacao");
  });

  it("clube já feito na semana não gera cobrança", () => {
    const r = tarefasAGerar({ ...CTX_VAZIO, marchaAtiva: 2, conversacaoNaSemana: true });
    expect(r.map((t) => t.tipo)).not.toContain("clube_conversacao");
  });

  it("áudio já enviado não gera tarefa", () => {
    const r = tarefasAGerar({ ...CTX_VAZIO, audioNaSemana: true });
    expect(r).toHaveLength(0);
  });

  it("o vídeo do mês é só da marcha 3", () => {
    expect(tarefasAGerar({ ...CTX_VAZIO, marchaAtiva: 2 }).map((t) => t.tipo)).not.toContain("gravar_video");
    const r = tarefasAGerar({ ...CTX_VAZIO, marchaAtiva: 3 });
    expect(r.find((t) => t.tipo === "gravar_video")?.dataPrevista).toBe("2026-09-30");
  });

  it("erro em ponto gramatical vira duas frases para amanhã", () => {
    const r = tarefasAGerar({
      ...CTX_VAZIO,
      pontosComErro: [{ id: "p1", idiomaId: "en", titulo: "subjuntivo", frasesExigidas: 2 }],
    });
    const tarefa = r.find((t) => t.tipo === "frases_apos_erro");
    expect(tarefa).toMatchObject({
      dataPrevista: "2026-09-08",
      quantidadeExigida: 2,
      pontoGramaticalId: "p1",
    });
    expect(tarefa?.titulo).toContain("subjuntivo");
  });

  it("palavras pendentes viram tarefa de ativação, com a quantidade", () => {
    const r = tarefasAGerar({
      ...CTX_VAZIO,
      pendentesAtivacao: [{ idiomaId: "fr", quantidade: 12 }],
    });
    const tarefa = r.find((t) => t.tipo === "ativar_palavras");
    expect(tarefa?.quantidadeExigida).toBe(12);
    expect(tarefa?.titulo).toContain("12 palavras");
  });

  it("zero pendentes não gera nada", () => {
    const r = tarefasAGerar({
      ...CTX_VAZIO,
      audioNaSemana: true,
      pendentesAtivacao: [{ idiomaId: "fr", quantidade: 0 }],
    });
    expect(r).toHaveLength(0);
  });

  it("uma autoavaliação por idioma do bloco fechado", () => {
    const r = tarefasAGerar({
      ...CTX_VAZIO,
      audioNaSemana: true,
      autoavaliacoesPendentes: [
        { blocoId: "b1", idiomaId: "en", nomeIdioma: "Inglês" },
        { blocoId: "b1", idiomaId: "fr", nomeIdioma: "Francês" },
      ],
    });
    expect(r).toHaveLength(2);
    expect(r[0].chaveIdempotencia).not.toBe(r[1].chaveIdempotencia);
  });

  it("a chave de idempotência é estável dentro da mesma janela", () => {
    const segunda = tarefasAGerar({ ...CTX_VAZIO, hoje: "2026-09-07" })[0];
    const domingo = tarefasAGerar({ ...CTX_VAZIO, hoje: "2026-09-13" })[0];
    expect(segunda.chaveIdempotencia).toBe(domingo.chaveIdempotencia);
  });

  it("e muda quando a semana vira", () => {
    const semana1 = tarefasAGerar({ ...CTX_VAZIO, hoje: "2026-09-13" })[0];
    const semana2 = tarefasAGerar({ ...CTX_VAZIO, hoje: "2026-09-14" })[0];
    expect(semana1.chaveIdempotencia).not.toBe(semana2.chaveIdempotencia);
  });

  it("a chave separa idiomas", () => {
    expect(chaveIdempotencia("ativar_palavras", "en", "dia", "2026-09-07")).not.toBe(
      chaveIdempotencia("ativar_palavras", "fr", "dia", "2026-09-07"),
    );
  });
});

describe("datas auxiliares das tarefas", () => {
  it("a próxima quarta pula para a semana seguinte se já passou", () => {
    expect(proximaQuarta("2026-09-07")).toBe("2026-09-09"); // segunda → quarta
    expect(proximaQuarta("2026-09-09")).toBe("2026-09-16"); // quarta → a próxima
    expect(proximaQuarta("2026-09-11")).toBe("2026-09-16"); // sexta → quarta seguinte
  });

  it("fim do mês respeita fevereiro", () => {
    expect(fimDoMes("2026-09-07")).toBe("2026-09-30");
    expect(fimDoMes("2027-02-10")).toBe("2027-02-28");
    expect(fimDoMes("2028-02-10")).toBe("2028-02-29");
  });
});

describe("RN-803 — adiar e ordenar", () => {
  it("automática adia uma vez só; manual não tem limite", () => {
    expect(podeAdiar({ automatica: true, adiadaVezes: 0 })).toBe(true);
    expect(podeAdiar({ automatica: true, adiadaVezes: 1 })).toBe(false);
    expect(podeAdiar({ automatica: false, adiadaVezes: 5 })).toBe(true);
  });

  it("adiar joga um dia à frente, ou uma semana se a janela é semanal", () => {
    expect(novaDataAoAdiar("2026-09-07", "dia")).toBe("2026-09-08");
    expect(novaDataAoAdiar("2026-09-07", "semana")).toBe("2026-09-14");
  });

  it("atrasadas sobem; concluídas descem", () => {
    const base = { quantidadeExigida: 1, quantidadeFeita: 0, adiadaVezes: 0, automatica: true, idiomaId: null };
    const lista: TarefaLista[] = [
      { ...base, id: "1", tipo: "audio_grupo", titulo: "hoje", dataPrevista: "2026-09-09", estado: "aberta" },
      { ...base, id: "2", tipo: "audio_grupo", titulo: "concluída", dataPrevista: "2026-09-01", estado: "concluida" },
      { ...base, id: "3", tipo: "audio_grupo", titulo: "atrasada", dataPrevista: "2026-09-05", estado: "aberta" },
    ];
    const r = ordenarTarefas(lista, "2026-09-09");
    expect(r.map((t) => t.id)).toEqual(["3", "1", "2"]);
  });

  it("a tarefa de hoje não está atrasada", () => {
    const t: TarefaLista = {
      id: "1", tipo: "audio_grupo", automatica: true, titulo: "x", idiomaId: null,
      dataPrevista: "2026-09-09", quantidadeExigida: 1, quantidadeFeita: 0,
      estado: "aberta", adiadaVezes: 0,
    };
    expect(estaAtrasada(t, "2026-09-09")).toBe(false);
    expect(estaAtrasada(t, "2026-09-10")).toBe(true);
  });
});
