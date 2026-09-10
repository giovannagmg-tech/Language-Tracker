import { describe, expect, it } from "vitest";
import {
  bandeiraValida,
  corValida,
  CORES_SUGERIDAS,
  proximaCor,
  slugDoIdioma,
  slugLivre,
} from "@/lib/domain/idiomas";

describe("slug do idioma", () => {
  it("tira acento, espaço e maiúscula", () => {
    expect(slugDoIdioma("Português")).toBe("portugues");
    expect(slugDoIdioma("Inglês")).toBe("ingles");
    expect(slugDoIdioma("Alemão")).toBe("alemao");
  });

  it("junta palavras com hífen", () => {
    expect(slugDoIdioma("Português do Brasil")).toBe("portugues-do-brasil");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(slugDoIdioma("  Grego!  ")).toBe("grego");
    expect(slugDoIdioma("— Sueco —")).toBe("sueco");
  });

  it("nome só de símbolos vira vazio, e quem chama trata", () => {
    expect(slugDoIdioma("!!!")).toBe("");
  });
});

describe("slug livre na conta", () => {
  it("usa o slug direto quando ninguém ocupou", () => {
    expect(slugLivre("Italiano", ["ingles", "espanhol"])).toBe("italiano");
  });

  it("colidiu, ganha sufixo", () => {
    expect(slugLivre("Inglês", ["ingles"])).toBe("ingles-2");
    expect(slugLivre("Inglês", ["ingles", "ingles-2"])).toBe("ingles-3");
  });

  it("nome impossível ainda gera slug utilizável", () => {
    expect(slugLivre("###", [])).toBe("idioma");
    expect(slugLivre("###", ["idioma"])).toBe("idioma-2");
  });
});

describe("cor", () => {
  it("aceita as duas formas de hexadecimal", () => {
    expect(corValida("#abc")).toBe(true);
    expect(corValida("#AABBCC")).toBe(true);
  });

  it("recusa o que não é cor", () => {
    expect(corValida("azul")).toBe(false);
    expect(corValida("#12")).toBe(false);
    expect(corValida("")).toBe(false);
  });
});

describe("bandeira", () => {
  it("aceita bandeira de país", () => {
    expect(bandeiraValida("🇧🇷")).toBe(true);
    expect(bandeiraValida("🇯🇵")).toBe(true);
  });

  it("aceita emoji comum, para idioma sem bandeira", () => {
    expect(bandeiraValida("🗣")).toBe(true);
  });

  it("aceita vazio — bandeira é opcional", () => {
    expect(bandeiraValida("")).toBe(true);
  });

  it("recusa texto solto se passando por bandeira", () => {
    expect(bandeiraValida("BR")).toBe(false);
    expect(bandeiraValida("inglês")).toBe(false);
  });
});

describe("próxima cor sugerida", () => {
  it("evita as já usadas", () => {
    expect(proximaCor([CORES_SUGERIDAS[0]])).toBe(CORES_SUGERIDAS[1]);
  });

  it("não se importa com maiúscula no hexadecimal", () => {
    expect(proximaCor([CORES_SUGERIDAS[0].toUpperCase()])).toBe(CORES_SUGERIDAS[1]);
  });

  it("acabaram as cores, volta para a primeira em vez de devolver nada", () => {
    expect(proximaCor([...CORES_SUGERIDAS])).toBe(CORES_SUGERIDAS[0]);
  });
});
