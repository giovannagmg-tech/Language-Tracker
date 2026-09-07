import { describe, expect, it } from "vitest";
import { diasSemRegistro, maiorLacuna } from "@/lib/domain/lacunas";

const SETEMBRO = { inicio: "2026-09-01", fim: "2026-09-30" };

describe("RN-704 — maior lacuna", () => {
  it("mede o vão entre dois registros", () => {
    // 05 e 10: os dias 06, 07, 08 e 09 estão em branco
    const r = maiorLacuna(["2026-09-05", "2026-09-10"], SETEMBRO, "2026-09-10");
    expect(r.dias).toBe(4);
    expect(r.inicio).toBe("2026-09-05");
    expect(r.fim).toBe("2026-09-10");
  });

  it("conta a borda inicial do período", () => {
    const r = maiorLacuna(["2026-09-08"], SETEMBRO, "2026-09-08");
    expect(r.dias).toBe(7); // 01 a 07
    expect(r.inicio).toBe("2026-09-01");
  });

  it("conta a borda final até hoje, não até o fim do período", () => {
    const r = maiorLacuna(["2026-09-01", "2026-09-02"], SETEMBRO, "2026-09-09");
    expect(r.dias).toBe(7); // 03 a 09
  });

  it("mês inteiro sem nenhum registro devolve o mês inteiro", () => {
    const r = maiorLacuna([], SETEMBRO, "2026-09-30");
    expect(r.dias).toBe(30);
    expect(r.inicio).toBe("2026-09-01");
    expect(r.fim).toBe("2026-09-30");
  });

  it("mês inteiro sem registro, no meio do mês, para em hoje", () => {
    expect(maiorLacuna([], SETEMBRO, "2026-09-10").dias).toBe(10);
  });

  it("todos os dias registrados devolve lacuna zero", () => {
    const todos = Array.from({ length: 9 }, (_, i) => `2026-09-0${i + 1}`);
    expect(maiorLacuna(todos, SETEMBRO, "2026-09-09").dias).toBe(0);
  });

  it("ignora registros fora do período", () => {
    const r = maiorLacuna(["2026-08-15", "2026-09-20"], SETEMBRO, "2026-09-20");
    expect(r.dias).toBe(19); // 01 a 19 de setembro
  });

  it("devolve a maior entre várias lacunas", () => {
    const r = maiorLacuna(
      ["2026-09-01", "2026-09-04", "2026-09-15", "2026-09-16"],
      SETEMBRO,
      "2026-09-16",
    );
    expect(r.dias).toBe(10); // 05 a 14
    expect(r.inicio).toBe("2026-09-04");
  });

  it("reproduz a maior lacuna de 2026: 22 dias", () => {
    const abril = { inicio: "2026-04-01", fim: "2026-04-30" };
    const r = maiorLacuna(["2026-04-01", "2026-04-24"], abril, "2026-04-24");
    expect(r.dias).toBe(22);
    expect(r.inicio).toBe("2026-04-01");
    expect(r.fim).toBe("2026-04-24");
  });
});

describe("RN-601 — dias sem registro", () => {
  it("conta do último registro até hoje", () => {
    expect(diasSemRegistro(["2026-09-01"], "2026-09-09")).toBe(8);
  });

  it("registro hoje devolve zero", () => {
    expect(diasSemRegistro(["2026-09-09"], "2026-09-09")).toBe(0);
  });

  it("sem nenhum registro devolve infinito — conta nova não entra em retomada por engano", () => {
    expect(diasSemRegistro([], "2026-09-09")).toBe(Number.POSITIVE_INFINITY);
  });
});
