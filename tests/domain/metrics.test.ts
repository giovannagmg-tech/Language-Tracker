import { describe, expect, it } from "vitest";
import {
  composicao,
  cobertura,
  concentracao,
  distribuicaoPilares,
  distribuicaoPorDiaSemana,
  distribuicaoPorHora,
  distribuicaoTempos,
  falaPorSemana,
  flashcardsPorSemana,
  maiorDesvioPilar,
  medianaDiaria,
  mediaSemanal,
  minutosPorDia,
  minutosPorIdioma,
  minutosProducao,
  serieTemporal,
} from "@/lib/domain/metrics";
import { revisao, sessao } from "../fixtures/dominio";

/**
 * Amostras pequenas o suficiente para conferir na mão — é esse o critério de
 * pronto da fase. Cada teste mostra a conta no comentário.
 */

describe("RN-701 — composição", () => {
  // 60 de podcast + 40 de gramática + 20 de flashcards = 120 min
  const sessoes = [
    sessao("2026-09-07", "podcast", 60),
    sessao("2026-09-07", "gramatica", 40),
    sessao("2026-09-07", "flashcards", 20),
  ];

  it("separa as três parcelas", () => {
    const c = composicao(sessoes);
    expect(c).toMatchObject({ imersao: 60, ativo: 40, flashcards: 20, total: 120 });
  });

  it("os percentuais são 50 / 33,3 / 16,7", () => {
    const c = composicao(sessoes);
    expect(c.pctImersao).toBeCloseTo(0.5, 5);
    expect(c.pctAtivo).toBeCloseTo(1 / 3, 5);
    expect(c.pctFlashcards).toBeCloseTo(1 / 6, 5);
  });

  it("flashcards não entram em estudo ativo", () => {
    expect(composicao([sessao("2026-09-07", "flashcards", 30)])).toMatchObject({
      ativo: 0,
      flashcards: 30,
    });
  });

  it("período vazio não divide por zero", () => {
    expect(composicao([])).toMatchObject({ total: 0, pctAtivo: 0, pctImersao: 0 });
  });

  it("conversação e escrita contam como produção; podcast não", () => {
    const p = [
      sessao("2026-09-07", "conversacao", 50),
      sessao("2026-09-07", "escrita", 30),
      sessao("2026-09-07", "podcast", 90),
    ];
    expect(minutosProducao(p)).toBe(80);
  });
});

describe("RN-703 — pilares contra o alvo", () => {
  const alvo = { vocabulario: 0.25, gramatica: 0.25, pronuncia: 0.2, fala: 0.3 };
  // 25 flashcards (vocabulário) + 75 gramática = 100 min de estudo ativo
  const sessoes = [
    sessao("2026-09-07", "flashcards", 25),
    sessao("2026-09-07", "gramatica", 75),
    sessao("2026-09-07", "podcast", 200), // não entra na base
  ];

  it("a base inclui flashcards e exclui imersão", () => {
    const fatias = distribuicaoPilares(sessoes, alvo);
    const mapa = Object.fromEntries(fatias.map((f) => [f.pilar, f]));
    expect(mapa.vocabulario.real).toBeCloseTo(0.25, 5);
    expect(mapa.gramatica.real).toBeCloseTo(0.75, 5);
  });

  it("o desvio é real menos alvo, com sinal", () => {
    const mapa = Object.fromEntries(
      distribuicaoPilares(sessoes, alvo).map((f) => [f.pilar, f]),
    );
    expect(mapa.vocabulario.desvio).toBeCloseTo(0, 5);
    expect(mapa.gramatica.desvio).toBeCloseTo(0.5, 5);
    expect(mapa.fala.desvio).toBeCloseTo(-0.3, 5);
  });

  it("o maior desvio é o de maior módulo, não o maior positivo", () => {
    const pior = maiorDesvioPilar(distribuicaoPilares(sessoes, alvo));
    expect(pior?.pilar).toBe("gramatica");
  });

  it("sempre devolve os quatro pilares, mesmo zerados", () => {
    expect(distribuicaoPilares([], alvo)).toHaveLength(4);
  });
});

describe("RN-709 / RN-710 — tempos, horas e dias", () => {
  it("os três tempos somam 100%", () => {
    const sessoes = [
      sessao("2026-09-07", "gramatica", 40, { tempo: "cadeira" }),
      sessao("2026-09-07", "flashcards", 20, { tempo: "maos_livres" }),
      sessao("2026-09-07", "podcast", 40, { tempo: "maos_ocupadas" }),
    ];
    const t = distribuicaoTempos(sessoes);
    expect(t.reduce((s, x) => s + x.pct, 0)).toBeCloseTo(1, 5);
    expect(t.find((x) => x.tempo === "cadeira")?.pct).toBeCloseTo(0.4, 5);
  });

  it("hora do dia acumula minutos e acha o pico", () => {
    const comHora = [
      { ...sessao("2026-09-07", "gramatica", 40), horaInicio: "08:00" },
      { ...sessao("2026-09-08", "gramatica", 30), horaInicio: "08:30" },
      { ...sessao("2026-09-08", "podcast", 20), horaInicio: "19:00" },
    ];
    const r = distribuicaoPorHora(comHora);
    expect(r.horas[8]).toBe(70);
    expect(r.horas[19]).toBe(20);
    expect(r.pico).toBe(8);
    expect(r.semHora).toBe(0);
  });

  it("sessão sem hora vai para o balde de rodapé, não para as 0h", () => {
    const r = distribuicaoPorHora([{ ...sessao("2026-09-07", "gramatica", 45), horaInicio: null }]);
    expect(r.semHora).toBe(45);
    expect(r.horas[0]).toBe(0);
    expect(r.pico).toBeNull();
  });

  it("dia da semana: segunda mais forte, sexta mais fraca", () => {
    const r = distribuicaoPorDiaSemana([
      sessao("2026-09-07", "gramatica", 90), // segunda
      sessao("2026-09-11", "gramatica", 10), // sexta
    ]);
    expect(r.dias[0]).toBe(90);
    expect(r.dias[4]).toBe(10);
    expect(r.maisForte).toBe(1);
    expect(r.maisFraco).toBe(5);
  });

  it("sem dado nenhum não inventa pico", () => {
    const r = distribuicaoPorDiaSemana([]);
    expect(r.maisForte).toBeNull();
    expect(r.maisFraco).toBeNull();
  });
});

describe("RN-706 / RN-707 — semanas", () => {
  const periodo = { inicio: "2026-09-07", fim: "2026-09-20" }; // duas semanas ISO cheias

  it("soma os minutos de fala por semana ISO", () => {
    const sessoes = [
      sessao("2026-09-07", "conversacao", 30),
      sessao("2026-09-13", "fala_sozinha", 20), // ainda semana 1 (domingo)
      sessao("2026-09-14", "conversacao", 45), // semana 2 (segunda)
    ];
    const semanas = falaPorSemana(sessoes, periodo);
    expect(semanas).toHaveLength(2);
    expect(semanas[0]).toMatchObject({ semana: "2026-09-07", valor: 50 });
    expect(semanas[1]).toMatchObject({ semana: "2026-09-14", valor: 45 });
  });

  it("a média de duas semanas de 50 e 45 é 47,5", () => {
    const sessoes = [
      sessao("2026-09-07", "conversacao", 50),
      sessao("2026-09-14", "conversacao", 45),
    ];
    expect(mediaSemanal(falaPorSemana(sessoes, periodo))).toBeCloseTo(47.5, 5);
  });

  it("semana parcial na borda entra proporcional aos dias que caem no período", () => {
    // período de 3 dias: a semana rende valor × 7/3
    const parcial = { inicio: "2026-09-07", fim: "2026-09-09" };
    const sessoes = [sessao("2026-09-07", "conversacao", 30)];
    expect(mediaSemanal(falaPorSemana(sessoes, parcial))).toBeCloseTo(70, 5);
  });

  it("dias com flashcards contam check e sessão, sem contar o dia duas vezes", () => {
    const sessoes = [sessao("2026-09-07", "flashcards", 10)];
    const revisoes = [revisao("2026-09-07"), revisao("2026-09-08", "espanhol")];
    const semanas = flashcardsPorSemana(sessoes, revisoes, periodo);
    expect(semanas[0].valor).toBe(2);
  });

  it("revisão desmarcada não conta o dia", () => {
    const semanas = flashcardsPorSemana([], [revisao("2026-09-07", "ingles", false)], periodo);
    expect(semanas[0].valor).toBe(0);
  });
});

describe("RN-708 — cobertura e concentração", () => {
  const periodo = { inicio: "2026-09-01", fim: "2026-09-10" };

  it("conta dias distintos com sessão ou check", () => {
    const c = cobertura(
      [sessao("2026-09-01", "podcast", 30), sessao("2026-09-01", "gramatica", 30)],
      [revisao("2026-09-05")],
      periodo,
      "2026-09-10",
    );
    expect(c.diasComRegistro).toBe(2);
    expect(c.diasNoPeriodo).toBe(10);
  });

  it("os três maiores dias somam a concentração", () => {
    // 100 + 50 + 30 + 20 = 200; os três maiores somam 180 = 90%
    const sessoes = [
      sessao("2026-09-01", "podcast", 100),
      sessao("2026-09-02", "podcast", 50),
      sessao("2026-09-03", "podcast", 30),
      sessao("2026-09-04", "podcast", 20),
    ];
    const c = concentracao(sessoes, 3);
    expect(c.minutos).toBe(180);
    expect(c.pct).toBeCloseTo(0.9, 5);
    expect(c.dias[0].data).toBe("2026-09-01");
  });

  it("minutos por dia soma várias sessões do mesmo dia", () => {
    const r = minutosPorDia([
      sessao("2026-09-01", "podcast", 30),
      sessao("2026-09-01", "gramatica", 15),
    ]);
    expect(r).toEqual([{ data: "2026-09-01", minutos: 45 }]);
  });

  it("mediana de 20, 40 e 90 é 40", () => {
    const sessoes = [
      sessao("2026-09-01", "podcast", 20),
      sessao("2026-09-02", "podcast", 40),
      sessao("2026-09-03", "podcast", 90),
    ];
    expect(medianaDiaria(sessoes)).toBe(40);
  });
});

describe("série temporal", () => {
  const periodo = { inicio: "2026-09-07", fim: "2026-09-09" };

  it("um ponto por dia do período, inclusive os vazios", () => {
    const serie = serieTemporal([sessao("2026-09-08", "gramatica", 40)], periodo, "dia");
    expect(serie).toHaveLength(3);
    expect(serie[0]).toMatchObject({ rotulo: "2026-09-07", total: 0 });
    expect(serie[1]).toMatchObject({ rotulo: "2026-09-08", ativo: 40, total: 40 });
  });

  it("empilha as três parcelas separadas", () => {
    const serie = serieTemporal(
      [
        sessao("2026-09-07", "gramatica", 40),
        sessao("2026-09-07", "flashcards", 10),
        sessao("2026-09-07", "podcast", 50),
      ],
      periodo,
      "dia",
    );
    expect(serie[0]).toMatchObject({ ativo: 40, flashcards: 10, imersao: 50, total: 100 });
  });

  it("agrupa por semana ISO no recorte anual", () => {
    const ano = { inicio: "2026-09-07", fim: "2026-09-20" };
    const serie = serieTemporal(
      [sessao("2026-09-08", "gramatica", 40), sessao("2026-09-15", "gramatica", 20)],
      ano,
      "semana",
    );
    expect(serie).toHaveLength(2);
    expect(serie[0]).toMatchObject({ rotulo: "2026-09-07", ativo: 40 });
    expect(serie[1]).toMatchObject({ rotulo: "2026-09-14", ativo: 20 });
  });

  it("sessão fora do período não entra", () => {
    const serie = serieTemporal([sessao("2026-10-01", "gramatica", 40)], periodo, "dia");
    expect(serie.every((p) => p.total === 0)).toBe(true);
  });
});

describe("por idioma", () => {
  it("ordena por minutos, decrescente", () => {
    const r = minutosPorIdioma([
      sessao("2026-09-07", "podcast", 30, { idiomaId: "frances" }),
      sessao("2026-09-07", "podcast", 90, { idiomaId: "ingles" }),
    ]);
    expect(r[0].idiomaId).toBe("ingles");
    expect(r[0].pct).toBeCloseTo(0.75, 5);
  });
});
