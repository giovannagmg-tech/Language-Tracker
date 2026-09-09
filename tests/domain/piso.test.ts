import { describe, expect, it } from "vitest";
import {
  diasComPiso,
  diasComRegistro,
  minutosFalaDoDia,
  minutosFalaPorIdioma,
  pisoDoDia,
} from "@/lib/domain/piso";
import { sequencia } from "@/lib/domain/sequencias";
import { revisao, sessao } from "../fixtures/dominio";

const DIA = "2026-09-09";
const base = { hora: 10, horaAperto: 20 };

describe("RN-302 — piso diário", () => {
  it("cumprido com revisão e 1 minuto de fala", () => {
    const p = pisoDoDia({
      revisoes: [revisao(DIA)],
      sessoes: [sessao(DIA, "fala_sozinha", 1)],
      ...base,
    });
    expect(p).toMatchObject({ flashcards: true, fala: true, cumprido: true, estado: "verde" });
  });

  it("um minuto basta — o piso é piso, não meta", () => {
    const p = pisoDoDia({ revisoes: [revisao(DIA)], sessoes: [sessao(DIA, "fala_sozinha", 1)], ...base });
    expect(p.minutosFala).toBe(1);
    expect(p.cumprido).toBe(true);
  });

  it("só metade cumprida fica amarelo, mesmo de manhã", () => {
    expect(pisoDoDia({ revisoes: [revisao(DIA)], sessoes: [], ...base }).estado).toBe("amarelo");
    expect(
      pisoDoDia({ revisoes: [], sessoes: [sessao(DIA, "fala_sozinha", 3)], ...base }).estado,
    ).toBe("amarelo");
  });

  it("nada feito é cinza antes da hora do aperto e vermelho depois", () => {
    expect(pisoDoDia({ revisoes: [], sessoes: [], hora: 10, horaAperto: 20 }).estado).toBe("cinza");
    expect(pisoDoDia({ revisoes: [], sessoes: [], hora: 21, horaAperto: 20 }).estado).toBe("vermelho");
  });

  it("revisão desmarcada não conta", () => {
    const p = pisoDoDia({
      revisoes: [revisao(DIA, "ingles", false)],
      sessoes: [sessao(DIA, "fala_sozinha", 5)],
      ...base,
    });
    expect(p.flashcards).toBe(false);
    expect(p.cumprido).toBe(false);
  });

  it("uma hora de imersão não cumpre nada do piso", () => {
    const p = pisoDoDia({ revisoes: [], sessoes: [sessao(DIA, "podcast", 60)], hora: 22, horaAperto: 20 });
    expect(p).toMatchObject({ flashcards: false, fala: false, estado: "vermelho" });
  });

  it("fala somada de sessões diferentes conta junto", () => {
    const p = pisoDoDia({
      revisoes: [revisao(DIA)],
      sessoes: [sessao(DIA, "gramatica", 40, { minutosFala: 0 }), sessao(DIA, "fala_sozinha", 2)],
      ...base,
    });
    expect(p.minutosFala).toBe(2);
    expect(p.cumprido).toBe(true);
  });

  it("revisão de qualquer idioma serve", () => {
    const p = pisoDoDia({
      revisoes: [revisao(DIA, "frances")],
      sessoes: [sessao(DIA, "fala_sozinha", 1, { idiomaId: "ingles" })],
      ...base,
    });
    expect(p.cumprido).toBe(true);
  });
});

describe("dias com piso e dias com registro", () => {
  const sessoes = [
    sessao("2026-09-07", "fala_sozinha", 2),
    sessao("2026-09-08", "podcast", 60),
    sessao("2026-09-09", "fala_sozinha", 1),
  ];
  const revisoes = [revisao("2026-09-07"), revisao("2026-09-08"), revisao("2026-09-09")];

  it("só o dia com revisão E fala entra no piso", () => {
    const dias = diasComPiso(sessoes, revisoes);
    expect([...dias].sort()).toEqual(["2026-09-07", "2026-09-09"]);
  });

  it("dia de registro inclui imersão e inclui dia só com check", () => {
    const dias = diasComRegistro(sessoes, [...revisoes, revisao("2026-09-10")]);
    expect([...dias].sort()).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
    ]);
  });

  it("as duas sequências divergem — é esse o ponto de ter as duas", () => {
    const hoje = "2026-09-09";
    expect(sequencia(diasComRegistro(sessoes, revisoes), hoje)).toBe(3);
    expect(sequencia(diasComPiso(sessoes, revisoes), hoje)).toBe(1);
  });
});

describe("minutos de fala por idioma", () => {
  it("separa o que foi falado em cada idioma", () => {
    const porIdioma = minutosFalaPorIdioma([
      sessao(DIA, "fala_sozinha", 5, { idiomaId: "ingles" }),
      sessao(DIA, "fala_sozinha", 3, { idiomaId: "espanhol" }),
      sessao(DIA, "fala_sozinha", 2, { idiomaId: "ingles" }),
    ]);
    expect(porIdioma).toEqual({ ingles: 7, espanhol: 3 });
  });

  it("idioma sem fala fica de fora do mapa, não com zero", () => {
    const porIdioma = minutosFalaPorIdioma([
      sessao(DIA, "flashcards", 20, { idiomaId: "frances" }),
      sessao(DIA, "fala_sozinha", 1, { idiomaId: "ingles" }),
    ]);
    expect(porIdioma).toEqual({ ingles: 1 });
    expect(porIdioma.frances ?? 0).toBe(0);
  });

  it("a soma do mapa bate com o total do dia", () => {
    const sessoes = [
      sessao(DIA, "fala_sozinha", 4, { idiomaId: "ingles" }),
      sessao(DIA, "audio_grupo", 2, { idiomaId: "espanhol" }),
      sessao(DIA, "flashcards", 15, { idiomaId: "frances" }),
    ];
    const soma = Object.values(minutosFalaPorIdioma(sessoes)).reduce((a, b) => a + b, 0);
    expect(soma).toBe(minutosFalaDoDia(sessoes));
  });

  it("dia sem fala nenhuma devolve mapa vazio", () => {
    expect(minutosFalaPorIdioma([sessao(DIA, "flashcards", 10)])).toEqual({});
  });
});
