import { describe, expect, it } from "vitest";
import {
  faltamParaRecorde,
  maiorSequencia,
  sequencia,
} from "@/lib/domain/sequencias";

const HOJE = "2026-09-09"; // quarta

describe("RN-705 — sequência atual", () => {
  it("conta os dias consecutivos terminando em hoje", () => {
    expect(sequencia(["2026-09-07", "2026-09-08", "2026-09-09"], HOJE)).toBe(3);
  });

  it("hoje ainda sem registro não quebra a sequência — o dia só conta às 23:59", () => {
    expect(sequencia(["2026-09-07", "2026-09-08"], HOJE)).toBe(2);
  });

  it("um dia pulado zera a partir dali", () => {
    // 05 e 06 seguidos, 07 em branco, 08 e 09 seguidos
    expect(sequencia(["2026-09-05", "2026-09-06", "2026-09-08", "2026-09-09"], HOJE)).toBe(2);
  });

  it("sem registro ontem nem hoje, a sequência é zero", () => {
    expect(sequencia(["2026-09-05", "2026-09-06"], HOJE)).toBe(0);
  });

  it("conjunto vazio devolve zero", () => {
    expect(sequencia([], HOJE)).toBe(0);
  });

  it("datas repetidas não inflam a contagem", () => {
    expect(sequencia(["2026-09-09", "2026-09-09", "2026-09-08"], HOJE)).toBe(2);
  });

  it("atravessa a virada do mês", () => {
    expect(sequencia(["2026-08-30", "2026-08-31", "2026-09-01"], "2026-09-01")).toBe(3);
  });

  it("registro no futuro não conta para a sequência de hoje", () => {
    expect(sequencia(["2026-09-11", "2026-09-08", "2026-09-09"], HOJE)).toBe(2);
  });
});

describe("RN-705 — recorde", () => {
  it("acha a maior sequência do histórico", () => {
    const datas = [
      "2026-01-01", "2026-01-02", "2026-01-03", // 3
      "2026-02-01", "2026-02-02", "2026-02-03", "2026-02-04", "2026-02-05", // 5
      "2026-03-01",
    ];
    expect(maiorSequencia(datas)).toBe(5);
  });

  it("um dia só é recorde de 1", () => {
    expect(maiorSequencia(["2026-09-09"])).toBe(1);
  });

  it("histórico vazio é recorde zero", () => {
    expect(maiorSequencia([])).toBe(0);
  });

  it("não depende da ordem de entrada", () => {
    expect(maiorSequencia(["2026-01-03", "2026-01-01", "2026-01-02"])).toBe(3);
  });
});

describe("faltamParaRecorde", () => {
  it("empatar não basta: precisa de um dia a mais", () => {
    expect(faltamParaRecorde(10, 12)).toBe(3);
    expect(faltamParaRecorde(12, 12)).toBe(1);
  });

  it("já sendo o recorde, não falta nada", () => {
    expect(faltamParaRecorde(13, 12)).toBe(0);
  });
});
