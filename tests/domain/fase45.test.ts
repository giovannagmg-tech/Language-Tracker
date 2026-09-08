import { describe, expect, it } from "vitest";
import {
  avaliar,
  reconciliar,
  type ContextoConquistas,
  type DefinicaoConquista,
} from "@/lib/domain/conquistas";
import {
  checarInterferencia,
  esqueletoFonetico,
  formaBase,
  levenshtein,
  normalizar,
  pareceVerbo,
  separarItens,
} from "@/lib/domain/interferencia";
import {
  avaliarProgresso,
  deveEntrarEmRetomada,
  diaCumpreFase,
  definicaoDaFase,
  mensagemDeAvanco,
  type DiaDaRetomada,
} from "@/lib/domain/retomada";
import { ordenarPorUrgencia, textoDeAtraso, type ItemRevisao } from "@/lib/domain/revisao";
import {
  calcularVelocidade,
  faixaVelocidade,
  medianaVelocidade,
  pendentesDeAtivacao,
} from "@/lib/domain/vocabulario";

// ---------------------------------------------------------------------------
// RN-406 / RN-407 — checagem de interferência
// ---------------------------------------------------------------------------

describe("preparo da lista colada", () => {
  it("aceita quebra de linha, vírgula, ponto e vírgula e tabulação", () => {
    expect(separarItens("casa\ncachorro, gato; peixe\tave")).toEqual([
      "casa",
      "cachorro",
      "gato",
      "peixe",
      "ave",
    ]);
  });

  it("normaliza acento, caixa e artigo", () => {
    expect(normalizar("  A Água ")).toBe("agua");
    expect(normalizar("to run")).toBe("run");
    expect(normalizar("le chien")).toBe("chien");
  });

  it("a forma-base ignora o que vem depois da barra ou do parêntese", () => {
    expect(formaBase("bank / margem do rio")).toBe("bank");
    expect(formaBase("bank (instituição)")).toBe("bank");
  });
});

describe("checarInterferencia", () => {
  const opcoes = { idioma: "ingles" as const };

  it("lista curta não é checada", () => {
    expect(checarInterferencia(["casa", "gato"], opcoes)).toEqual([]);
  });

  it("acusa lote em ordem alfabética", () => {
    const r = checarInterferencia(
      ["apple", "bread", "cheese", "dog", "eagle", "fish"],
      opcoes,
    );
    expect(r.map((a) => a.tipo)).toContain("ordem_alfabetica");
  });

  it("lote embaralhado não acusa ordem alfabética", () => {
    const r = checarInterferencia(
      ["zebra", "apple", "mountain", "bread", "cloud", "dog"],
      opcoes,
    );
    expect(r.map((a) => a.tipo)).not.toContain("ordem_alfabetica");
  });

  it("acusa grafia parecida", () => {
    const r = checarInterferencia(["desert", "dessert", "mountain", "cloud", "river"], opcoes);
    const aviso = r.find((a) => a.tipo === "grafia_parecida");
    expect(aviso).toBeDefined();
    expect(aviso?.itens.join()).toContain("desert");
  });

  it("acusa som parecido quando a grafia é distante o bastante para escapar da outra regra", () => {
    const r = checarInterferencia(["photo", "foto", "mountain", "cloud", "river"], opcoes);
    expect(r.map((a) => a.tipo)).toContain("som_parecido");
  });

  it("par que é parecido nas duas coisas é acusado uma vez só, pela grafia", () => {
    const r = checarInterferencia(["cite", "site", "mountain", "cloud", "river"], opcoes);
    expect(r.map((a) => a.tipo)).toEqual(["grafia_parecida"]);
  });

  it("acusa a mesma palavra com sentidos diferentes", () => {
    const r = checarInterferencia(
      ["bank / banco", "bank / margem", "cloud", "river", "mountain"],
      opcoes,
    );
    const aviso = r.find((a) => a.tipo === "mesma_palavra");
    expect(aviso?.itens[0]).toContain("bank");
  });

  it("acusa excesso de verbos em inglês", () => {
    const r = checarInterferencia(
      ["to run", "to jump", "to swim", "cloud", "river"],
      opcoes,
    );
    const aviso = r.find((a) => a.tipo === "excesso_verbos");
    expect(aviso?.mensagem).toContain("3 de 5");
  });

  it("acusa excesso de verbos em espanhol pelo sufixo", () => {
    const r = checarInterferencia(
      ["correr", "saltar", "vivir", "nube", "montaña"],
      { idioma: "espanhol" },
    );
    expect(r.map((a) => a.tipo)).toContain("excesso_verbos");
  });

  it("lote limpo não devolve aviso nenhum", () => {
    const r = checarInterferencia(
      ["mountain", "cloud", "river", "window", "bread"],
      opcoes,
    );
    expect(r).toEqual([]);
  });

  it("o esqueleto fonético colapsa o que soa igual", () => {
    expect(esqueletoFonetico("photo")).toBe(esqueletoFonetico("foto"));
    expect(levenshtein("casa", "casa")).toBe(0);
    expect(levenshtein("gato", "pato")).toBe(1);
  });

  it("reconhece verbo por idioma", () => {
    expect(pareceVerbo("to run", "ingles")).toBe(true);
    expect(pareceVerbo("run", "ingles")).toBe(false);
    expect(pareceVerbo("comer", "espanhol")).toBe(true);
    expect(pareceVerbo("parler", "frances")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// RN-405 — velocidade
// ---------------------------------------------------------------------------

describe("RN-405 — velocidade de criação", () => {
  it("as quatro faixas da régua", () => {
    expect(faixaVelocidade(2.5)).toBe("acima_de_a");
    expect(faixaVelocidade(1.8)).toBe("a");
    expect(faixaVelocidade(1.2)).toBe("entre");
    expect(faixaVelocidade(0.9)).toBe("b");
  });

  it("os limites pertencem à faixa melhor", () => {
    expect(faixaVelocidade(2)).toBe("a");
    expect(faixaVelocidade(1)).toBe("b");
  });

  it("10 palavras em 9 minutos é velocidade B", () => {
    const v = calcularVelocidade(9, 10);
    expect(v?.faixa).toBe("b");
    expect(v?.minPorPalavra).toBeCloseTo(0.9, 5);
  });

  it("sem palavras informadas não calcula", () => {
    expect(calcularVelocidade(20, 0)).toBeNull();
    expect(calcularVelocidade(0, 10)).toBeNull();
  });

  it("mediana ignora histórico vazio", () => {
    expect(medianaVelocidade([])).toBeNull();
    expect(medianaVelocidade([2, 1, 3])).toBe(2);
  });

  it("pendentes de ativação nunca ficam negativos", () => {
    expect(
      pendentesDeAtivacao([
        { palavrasNovas: 10, palavrasAtivadas: 3 },
        { palavrasNovas: 5, palavrasAtivadas: 5 },
      ]),
    ).toBe(7);
    expect(pendentesDeAtivacao([{ palavrasNovas: 2, palavrasAtivadas: 9 }])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// RN-601 a RN-604 — retomada
// ---------------------------------------------------------------------------

const DIA_VAZIO: DiaDaRetomada = {
  temBrowserMode: false,
  temCheckFlashcards: false,
  temRevisaoDeConteudo: false,
  temConteudoNovo: false,
  palavrasNovas: 0,
  metaPalavrasDia: 5,
};

describe("RN-601 — entrada no modo retomada", () => {
  it("entra com sete dias ou mais sem registro", () => {
    expect(deveEntrarEmRetomada(7, 7, false)).toBe(true);
    expect(deveEntrarEmRetomada(10, 7, false)).toBe(true);
    expect(deveEntrarEmRetomada(6, 7, false)).toBe(false);
  });

  it("não entra duas vezes", () => {
    expect(deveEntrarEmRetomada(30, 7, true)).toBe(false);
  });

  it("conta nova, sem registro nenhum, não entra em retomada por engano", () => {
    expect(deveEntrarEmRetomada(Number.POSITIVE_INFINITY, 7, false)).toBe(false);
  });

  it("o limiar vem da configuração, não do código", () => {
    expect(deveEntrarEmRetomada(5, 5, false)).toBe(true);
    expect(deveEntrarEmRetomada(5, 14, false)).toBe(false);
  });
});

describe("RN-602 — as cinco fases", () => {
  it("fase 1 quer browser mode e revisão", () => {
    expect(diaCumpreFase(1, DIA_VAZIO)).toBe(false);
    expect(diaCumpreFase(1, { ...DIA_VAZIO, temBrowserMode: true })).toBe(false);
    expect(
      diaCumpreFase(1, { ...DIA_VAZIO, temBrowserMode: true, temCheckFlashcards: true }),
    ).toBe(true);
  });

  it("fase 3 quer cinco palavras novas", () => {
    const base = { ...DIA_VAZIO, temCheckFlashcards: true };
    expect(diaCumpreFase(3, { ...base, palavrasNovas: 4 })).toBe(false);
    expect(diaCumpreFase(3, { ...base, palavrasNovas: 5 })).toBe(true);
  });

  it("fase 5 quer a meta cheia, que é do idioma", () => {
    const base = { ...DIA_VAZIO, palavrasNovas: 5, metaPalavrasDia: 10 };
    expect(diaCumpreFase(5, base)).toBe(false);
    expect(diaCumpreFase(5, { ...base, palavrasNovas: 10 })).toBe(true);
  });

  it("avança ao completar os dias exigidos e zera a contagem", () => {
    const r = avaliarProgresso(1, 1);
    expect(r.fase).toBe(2);
    expect(r.avancou).toBe(true);
    expect(r.diasCumpridos).toBe(0);
    expect(r.diasExigidos).toBe(definicaoDaFase(2).diasExigidos);
  });

  it("não avança antes da hora", () => {
    const r = avaliarProgresso(2, 1);
    expect(r.fase).toBe(2);
    expect(r.avancou).toBe(false);
    expect(mensagemDeAvanco(r)).toContain("faltam 1 dia");
  });

  it("a fase 5 completa conclui o protocolo", () => {
    const r = avaliarProgresso(5, 2);
    expect(r.concluida).toBe(true);
    expect(r.avancou).toBe(false);
    expect(mensagemDeAvanco(r)).toContain("voltou inteira");
  });

  it("as cinco fases somam nove dias no melhor caso", () => {
    const total = [1, 2, 3, 4, 5].reduce(
      (t, f) => t + definicaoDaFase(f as 1 | 2 | 3 | 4 | 5).diasExigidos,
      0,
    );
    expect(total).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// RN-1103 — fila de revisão
// ---------------------------------------------------------------------------

describe("RN-1103 — urgência da fila", () => {
  const base = { idiomaId: null, quantidadeExigida: 1, quantidadeFeita: 0 } as const;
  const itens: ItemRevisao[] = [
    { ...base, id: "1", tipo: "ponto_gramatical", titulo: "antigo", data: "2026-09-01", acao: "frases" },
    { ...base, id: "2", tipo: "frases_apos_erro", titulo: "hoje", data: "2026-09-09", acao: "frases" },
    { ...base, id: "3", tipo: "audio_grupo", titulo: "hoje", data: "2026-09-09", acao: "audio" },
  ];

  it("atraso domina o peso do tipo", () => {
    const r = ordenarPorUrgencia(itens, "2026-09-09");
    expect(r[0].id).toBe("1");
  });

  it("empatado no atraso, o peso do tipo desempata", () => {
    const r = ordenarPorUrgencia(itens.slice(1), "2026-09-09");
    expect(r.map((i) => i.id)).toEqual(["2", "3"]);
  });

  it("o texto de atraso é humano", () => {
    expect(textoDeAtraso(itens[1], "2026-09-09")).toBe("de hoje");
    expect(textoDeAtraso(itens[1], "2026-09-10")).toBe("de ontem");
    expect(textoDeAtraso(itens[1], "2026-09-12")).toBe("atrasado há 3 dias");
  });
});

// ---------------------------------------------------------------------------
// Documento 06 — conquistas
// ---------------------------------------------------------------------------

const CTX: ContextoConquistas = {
  hoje: "2026-09-09",
  streakRegistro: 0,
  streakPiso: 0,
  streakFlashcards: 0,
  diasRegistroMes: 0,
  diasFlashcardsMes: 0,
  maiorLacunaMesFechado: null,
  mesFechadoTemRegistro: false,
  diasSemDoisEmBranco: 0,
  sextasSeguidasComRegistro: 0,
  conversasNoMes: 0,
  falaNaSemana: 0,
  audiosAcumulados: 0,
  videosAcumulados: 0,
  aulasAcumuladas: 0,
  pctAtivoMesFechado: null,
  sessoesProducaoMes: 0,
  semanasFalaSeguidas60: 0,
  semanasFalaSeguidas90: 0,
  idiomasComFalaNaSemana: 0,
  idiomasAtivos: 3,
  sabadosEscritaSeguidos: 0,
  mesFechadoSemViolarRegra5: false,
  sextasPronunciaSeguidas: 0,
  checagensAcumuladas: 0,
  lotesLimposSeguidos: 0,
  diasSemPendentesAtivacao: 0,
  diasMaosOcupadasMes: 0,
  maiorNumeroDeTemposNoDia: 0,
  pilaresDentroDaTolerancia: 0,
  mesTemVolumeParaAvaliarPilares: false,
  correcoesNoPrazo: 0,
  autoavaliacoesDoBlocoFechado: 0,
  diasNaMarchaAtual: 0,
  marchaAtual: 1,
  retomadaConcluidaAgora: false,
  faseAtualDaRetomada: 1,
  duracaoUltimaRetomada: null,
  retomadasConcluidas: 0,
  diasDesdeLacunaGrande: 0,
  diasSalvosPelaRegra1: 0,
  porIdioma: {
    en: {
      idiomaId: "en",
      acumuladoPalavras: 3000,
      limiarPorCamada: { 1: 1500, 2: 3000, 3: 5000, 4: 10000, 5: 20000 },
      palavrasNoAno: 0,
      melhorMinPorPalavra: null,
      loteMinimoAtingido: false,
      avancoMaterialNoMes: 0,
    },
    fr: {
      idiomaId: "fr",
      acumuladoPalavras: 0,
      limiarPorCamada: { 1: 1500, 2: 3000, 3: 5000, 4: 10000, 5: 20000 },
      palavrasNoAno: 0,
      melhorMinPorPalavra: null,
      loteMinimoAtingido: false,
      avancoMaterialNoMes: 0,
    },
  },
};

function def(chave: string, parametros: Record<string, number | string> = {}): DefinicaoConquista {
  return {
    codigo: "X",
    nome: "x",
    categoria: "consistencia",
    criterioTexto: "",
    criterioChave: chave,
    parametros,
    escopo: "global",
    repetivel: false,
    janelaRepeticao: null,
    ordem: 0,
  };
}

describe("avaliadores de conquista", () => {
  it("sequência de registro", () => {
    expect(avaliar(def("streak_registro", { dias: 7 }), { ...CTX, streakRegistro: 7 }).conquistada).toBe(true);
    expect(avaliar(def("streak_registro", { dias: 7 }), { ...CTX, streakRegistro: 6 }).conquistada).toBe(false);
  });

  it("camada por idioma usa o limiar do próprio idioma", () => {
    expect(avaliar(def("camada_atingida", { camada: 2 }), CTX, "en").conquistada).toBe(true);
    expect(avaliar(def("camada_atingida", { camada: 3 }), CTX, "en").conquistada).toBe(false);
    expect(avaliar(def("camada_atingida", { camada: 1 }), CTX, "fr").conquistada).toBe(false);
  });

  it("três passaportes exige todos os idiomas ativos", () => {
    const r = avaliar(def("todos_idiomas_camada", { camada: 1 }), CTX);
    expect(r.atual).toBe(1);
    expect(r.alvo).toBe(3);
    expect(r.conquistada).toBe(false);
  });

  it("mês ativo só conta com mês fechado", () => {
    expect(avaliar(def("pct_ativo_mes", { pct: 0.35 }), CTX).conquistada).toBe(false);
    expect(
      avaliar(def("pct_ativo_mes", { pct: 0.35 }), { ...CTX, pctAtivoMesFechado: 0.4 }).conquistada,
    ).toBe(true);
  });

  it("mês sem buraco precisa de mês com registro", () => {
    expect(
      avaliar(def("mes_lacuna_maxima", { max: 2 }), { ...CTX, maiorLacunaMesFechado: 1 }).conquistada,
    ).toBe(false);
    expect(
      avaliar(def("mes_lacuna_maxima", { max: 2 }), {
        ...CTX,
        maiorLacunaMesFechado: 1,
        mesFechadoTemRegistro: true,
      }).conquistada,
    ).toBe(true);
  });

  it("velocidade B exige lote grande o bastante", () => {
    const ctx = {
      ...CTX,
      porIdioma: {
        ...CTX.porIdioma,
        en: { ...CTX.porIdioma.en, melhorMinPorPalavra: 0.9, loteMinimoAtingido: false },
      },
    };
    expect(avaliar(def("velocidade_lote", { min_por_palavra: 1 }), ctx, "en").conquistada).toBe(false);

    const comLote = {
      ...ctx,
      porIdioma: { ...ctx.porIdioma, en: { ...ctx.porIdioma.en, loteMinimoAtingido: true } },
    };
    expect(avaliar(def("velocidade_lote", { min_por_palavra: 1 }), comLote, "en").conquistada).toBe(true);
  });

  it("marcha seguida só conta na marcha certa", () => {
    const ctx = { ...CTX, marchaAtual: 2, diasNaMarchaAtual: 40 };
    expect(avaliar(def("marcha_seguida", { marcha: 3, dias: 30 }), ctx).conquistada).toBe(false);
    expect(
      avaliar(def("marcha_seguida", { marcha: 3, dias: 30 }), { ...ctx, marchaAtual: 3 }).conquistada,
    ).toBe(true);
  });

  it("volta rápida precisa da retomada concluída agora", () => {
    const ctx = { ...CTX, duracaoUltimaRetomada: 9 };
    expect(avaliar(def("retomada_rapida", { dias: 12 }), ctx).conquistada).toBe(false);
    expect(
      avaliar(def("retomada_rapida", { dias: 12 }), { ...ctx, retomadaConcluidaAgora: true })
        .conquistada,
    ).toBe(true);
  });

  it("chave desconhecida devolve bloqueada em vez de explodir", () => {
    expect(avaliar(def("inventada"), CTX).conquistada).toBe(false);
  });
});

describe("reconciliação de estado", () => {
  const ganha = { conquistada: true, atual: 7, alvo: 7, em: "2026-09-09" };

  it("conquista nova é gravada com a data", () => {
    const r = reconciliar(def("streak_registro"), undefined, ganha, "2026-09", null, false);
    expect(r).toMatchObject({ conquistada: true, vezes: 1, conquistadaEm: "2026-09-09" });
  });

  it("não repetível não conta duas vezes", () => {
    const anterior = {
      codigo: "X", idiomaId: null, conquistada: true,
      progressoAtual: 7, progressoAlvo: 7, conquistadaEm: "2026-08-01", vezes: 1,
    };
    expect(reconciliar(def("streak_registro"), anterior, ganha, "2026-09", "2026-08", false)).toBeNull();
  });

  it("repetível reconta ao virar a janela, preservando a primeira data", () => {
    const definicao = { ...def("dias_registro_mes"), repetivel: true };
    const anterior = {
      codigo: "X", idiomaId: null, conquistada: true,
      progressoAtual: 20, progressoAlvo: 20, conquistadaEm: "2026-08-31", vezes: 1,
    };
    const r = reconciliar(definicao, anterior, ganha, "2026-09", "2026-08", false);
    expect(r?.vezes).toBe(2);
    expect(r?.conquistadaEm).toBe("2026-08-31");
  });

  it("suspensa na retomada não grava nada", () => {
    expect(reconciliar(def("streak_registro"), undefined, ganha, "2026-09", null, true)).toBeNull();
  });

  it("progresso que não mudou não gera escrita", () => {
    const anterior = {
      codigo: "X", idiomaId: null, conquistada: false,
      progressoAtual: 3, progressoAlvo: 7, conquistadaEm: null, vezes: 0,
    };
    const igual = { conquistada: false, atual: 3, alvo: 7, em: null };
    expect(reconciliar(def("streak_registro"), anterior, igual, "2026-09", null, false)).toBeNull();
  });
});
