import { describe, expect, it } from "vitest";
import {
  anoDe,
  chaveSemana,
  dataLocal,
  diaDaSemana,
  dias,
  ehSexta,
  fimDoDia,
  hoje,
  horaLocal,
  inicioDoDia,
  intervalo,
  mesDe,
  semanaDe,
  somaDias,
} from "@/lib/domain/datas";

/**
 * Regra 3 do CLAUDE.md. Este arquivo roda com TZ=UTC (ver vitest.config.ts),
 * exatamente como o servidor da Vercel.
 */
describe("fuso de São Paulo", () => {
  it("21h em São Paulo ainda é o mesmo dia civil, mesmo com o relógio em UTC", () => {
    // 2026-09-08T00:30:00Z = 2026-09-07 21:30 em São Paulo (UTC-3)
    const instante = new Date("2026-09-08T00:30:00.000Z");
    expect(process.env.TZ).toBe("UTC");
    expect(instante.getUTCDate()).toBe(8); // o servidor já virou o dia
    expect(dataLocal(instante)).toBe("2026-09-07"); // São Paulo, não
    expect(horaLocal(instante)).toBe(21);
  });

  it("00:30 em São Paulo já é o dia novo (sem corte de madrugada, doc 01 D5)", () => {
    const instante = new Date("2026-09-08T03:30:00.000Z"); // 00:30 em SP
    expect(dataLocal(instante)).toBe("2026-09-08");
    expect(horaLocal(instante)).toBe(0);
  });

  it("hoje() usa o relógio de São Paulo", () => {
    expect(hoje(new Date("2026-09-08T02:00:00.000Z"))).toBe("2026-09-07");
  });

  it("início e fim do dia civil viram os instantes UTC corretos", () => {
    expect(inicioDoDia("2026-09-07").toISOString()).toBe("2026-09-07T03:00:00.000Z");
    expect(fimDoDia("2026-09-07").toISOString()).toBe("2026-09-08T02:59:59.999Z");
  });

  it("uma sessão que cruza a meia-noite pertence ao dia em que começou", () => {
    const inicio = new Date("2026-09-08T02:30:00.000Z"); // 23:30 de 07/09 em SP
    const fim = new Date("2026-09-08T03:30:00.000Z"); // 00:30 de 08/09 em SP
    expect(dataLocal(inicio)).toBe("2026-09-07");
    expect(dataLocal(fim)).toBe("2026-09-08");
    // o app grava a sessão na data de início — o dia dela é 07/09
    expect(dataLocal(inicio)).not.toBe(dataLocal(fim));
  });
});

describe("dias da semana", () => {
  it("usa base ISO: segunda = 1, domingo = 7", () => {
    expect(diaDaSemana("2026-09-07")).toBe(1); // segunda
    expect(diaDaSemana("2026-09-11")).toBe(5); // sexta
    expect(diaDaSemana("2026-09-13")).toBe(7); // domingo
  });

  it("reconhece a sexta de pronúncia (RN-204)", () => {
    expect(ehSexta("2026-09-11")).toBe(true);
    expect(ehSexta("2026-09-07")).toBe(false);
  });
});

describe("aritmética de datas", () => {
  it("conta dias civis entre duas datas", () => {
    expect(dias("2026-09-07", "2026-09-09")).toBe(2);
    expect(dias("2026-09-09", "2026-09-07")).toBe(-2);
    expect(dias("2026-09-07", "2026-09-07")).toBe(0);
  });

  it("atravessa a virada do mês e do ano", () => {
    expect(somaDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(dias("2026-12-28", "2027-01-04")).toBe(7);
  });

  it("soma negativa anda para trás", () => {
    expect(somaDias("2026-09-07", -7)).toBe("2026-08-31");
  });
});

describe("recortes de período", () => {
  it("semana ISO vai de segunda a domingo", () => {
    expect(semanaDe("2026-09-09")).toEqual({ inicio: "2026-09-07", fim: "2026-09-13" });
    expect(semanaDe("2026-09-13")).toEqual({ inicio: "2026-09-07", fim: "2026-09-13" });
    expect(semanaDe("2026-09-14")).toEqual({ inicio: "2026-09-14", fim: "2026-09-20" });
  });

  it("a chave de semana é a mesma para qualquer dia da semana (RN-802)", () => {
    expect(chaveSemana("2026-09-07")).toBe(chaveSemana("2026-09-13"));
    expect(chaveSemana("2026-09-13")).not.toBe(chaveSemana("2026-09-14"));
  });

  it("mês respeita o número de dias, inclusive fevereiro bissexto", () => {
    expect(mesDe("2026-09-07")).toEqual({ inicio: "2026-09-01", fim: "2026-09-30" });
    expect(mesDe("2027-02-10")).toEqual({ inicio: "2027-02-01", fim: "2027-02-28" });
    expect(mesDe("2028-02-10")).toEqual({ inicio: "2028-02-01", fim: "2028-02-29" });
  });

  it("ano vai de 1º de janeiro a 31 de dezembro", () => {
    expect(anoDe("2026-09-07")).toEqual({ inicio: "2026-01-01", fim: "2026-12-31" });
  });
});

describe("intervalo", () => {
  it("inclui as duas pontas", () => {
    expect(intervalo("2026-09-07", "2026-09-10")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
    ]);
  });

  it("um único dia devolve um item", () => {
    expect(intervalo("2026-09-07", "2026-09-07")).toEqual(["2026-09-07"]);
  });

  it("intervalo invertido devolve vazio em vez de estourar", () => {
    expect(intervalo("2026-09-10", "2026-09-07")).toEqual([]);
  });
});
