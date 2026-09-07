import { describe, expect, it } from "vitest";
import { diagnosticar } from "@/lib/domain/diagnostico";
import {
  composicao,
  cobertura,
  concentracao,
  distribuicaoPilares,
  falaPorSemana,
  mediaSemanal,
  minutosPorIdioma,
  minutosProducao,
  medianaDiaria,
} from "@/lib/domain/metrics";
import {
  DIAS_COM_REGISTRO,
  MAIOR_LACUNA,
  PERIODO_2026,
  TOTAL_MINUTOS,
  datasDeRegistro,
  sessoesLinhaDeBase,
} from "../fixtures/linha-de-base-2026";

const sessoes = sessoesLinhaDeBase();
const HOJE = "2026-09-30";

/** Percentual com uma casa, como o dashboard mostra. */
const p1 = (v: number) => Number((v * 100).toFixed(1));

describe("linha de base 2026 — o dashboard tem que reproduzir o Toggl", () => {
  it("o total bate com 86:23:14 arredondado", () => {
    expect(composicao(sessoes).total).toBe(TOTAL_MINUTOS);
  });

  it("composição: 76,8% imersão · 15,7% ativo · 7,5% flashcards", () => {
    const c = composicao(sessoes);
    expect(p1(c.pctImersao)).toBe(76.8);
    expect(p1(c.pctAtivo)).toBe(15.7);
    expect(p1(c.pctFlashcards)).toBe(7.5);
  });

  it("as três parcelas somam exatamente o total", () => {
    const c = composicao(sessoes);
    expect(c.ativo + c.flashcards + c.imersao).toBe(c.total);
  });

  it("horas por idioma: inglês 53,7% · espanhol 40,8% · francês 5,5%", () => {
    const porIdioma = minutosPorIdioma(sessoes);
    const mapa = Object.fromEntries(porIdioma.map((i) => [i.idiomaId, i]));
    expect(mapa.ingles.minutos).toBe(2783);
    expect(mapa.espanhol.minutos).toBe(2116);
    expect(mapa.frances.minutos).toBe(285);
    expect(p1(mapa.ingles.pct)).toBe(53.7);
    expect(p1(mapa.espanhol.pct)).toBe(40.8);
    expect(p1(mapa.frances.pct)).toBe(5.5);
  });

  it("97 dias com registro em 273", () => {
    const c = cobertura(sessoes, [], PERIODO_2026, HOJE);
    expect(c.diasComRegistro).toBe(DIAS_COM_REGISTRO);
    expect(c.diasNoPeriodo).toBe(273);
    expect(Math.round(c.pct * 100)).toBe(36);
  });

  it("maior lacuna de 22 dias", () => {
    expect(cobertura(sessoes, [], PERIODO_2026, HOJE).lacuna.dias).toBe(MAIOR_LACUNA);
  });

  it("o francês é o único idioma em que o ativo supera a imersão", () => {
    const porIdioma = (id: string) => sessoes.filter((s) => s.idiomaId === id);
    const cFr = composicao(porIdioma("frances"));
    const cEs = composicao(porIdioma("espanhol"));
    expect(cFr.ativo).toBeGreaterThan(cFr.imersao);
    expect(cEs.ativo).toBeLessThan(cEs.imersao);
  });

  it("o espanhol tem 36 vezes mais imersão que estudo ativo", () => {
    const c = composicao(sessoes.filter((s) => s.idiomaId === "espanhol"));
    expect(Math.round(c.imersao / c.ativo)).toBe(36);
  });

  it("nenhuma produção no ano — é o gargalo do método", () => {
    expect(minutosProducao(sessoes)).toBe(0);
  });

  it("o diagnóstico abre com a frase de consumo passivo", () => {
    const c = composicao(sessoes);
    const cob = cobertura(sessoes, [], PERIODO_2026, HOJE);
    const fala = mediaSemanal(falaPorSemana(sessoes, PERIODO_2026));

    const linhas = diagnosticar({
      composicao: c,
      minutosProducao: minutosProducao(sessoes),
      sessoesProducao: 0,
      concentracaoTop3: concentracao(sessoes, 3).pct,
      lacuna: cob.lacuna,
      mediaFalaSemanal: fala,
      mediaFlashSemanal: 0.9,
      maiorDesvioPilar: null,
      pctCadeira: 0.2,
      diasComRegistro: cob.diasComRegistro,
      diasNoPeriodo: cob.diasNoPeriodo,
      metaPctAtivo: 0.35,
      metaFalaSemana: 60,
      metaFlashSemana: 5,
      limiarConcentracao: 0.4,
      limiarDesvioPilar: 0.15,
      lacunaAlerta: 3,
    });

    expect(linhas).toHaveLength(3);
    expect(linhas[0].chave).toBe("passivo");
    expect(linhas[0].texto).toContain("76,8%");
    expect(linhas[0].texto).toContain("15,7%");
    expect(linhas[1].chave).toBe("producao");
  });

  it("as datas têm a lacuna de 22 e nenhuma outra maior que 2", () => {
    const datas = datasDeRegistro();
    expect(datas).toHaveLength(DIAS_COM_REGISTRO);
    expect(datas[0]).toBe("2026-01-01");
    expect(datas.at(-1)).toBe("2026-09-30");
  });

  it("a mediana diária fica na faixa de um dia ativo real", () => {
    expect(medianaDiaria(sessoes)).toBeGreaterThan(30);
    expect(medianaDiaria(sessoes)).toBeLessThan(80);
  });

  it("a divisão por pilar mostra o buraco: fala e pronúncia zeradas", () => {
    const alvo = { vocabulario: 0.25, gramatica: 0.25, pronuncia: 0.2, fala: 0.3 };
    const fatias = distribuicaoPilares(sessoes, alvo);
    const mapa = Object.fromEntries(fatias.map((f) => [f.pilar, f]));
    expect(mapa.fala.minutos).toBe(0);
    expect(mapa.pronuncia.minutos).toBe(0);
    expect(mapa.fala.desvio).toBeCloseTo(-0.3, 5);
    // vocabulário e gramática dividem todo o estudo ativo
    expect(p1(mapa.vocabulario.real + mapa.gramatica.real)).toBe(100);
  });
});
