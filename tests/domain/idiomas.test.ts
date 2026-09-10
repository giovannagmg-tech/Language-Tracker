import { describe, expect, it } from "vitest";
import {
  bandeiraValida,
  corConflitante,
  corValida,
  CORES_SUGERIDAS,
  DISTANCIA_MINIMA,
  distanciaDeCores,
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

// ---------------------------------------------------------------------------
// A paleta não pode degradar sem alguém perceber
// ---------------------------------------------------------------------------

function luminancia(hex: string): number {
  const c = hex.replace("#", "");
  const v = [0, 2, 4]
    .map((i) => parseInt(c.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

function contraste(a: string, b: string): number {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (maior + 0.05) / (menor + 0.05);
}

const CLARO = "#FFFFFF";
const ESCURO = "#0d0f0b";

describe("distância entre cores", () => {
  it("cor consigo mesma é zero, e maiúscula não importa", () => {
    expect(distanciaDeCores("#2F6FED", "#2f6fed")).toBe(0);
  });

  it("dois azuis vizinhos ficam abaixo do limiar", () => {
    expect(distanciaDeCores("#2F6FED", "#3A76F0")).toBeLessThan(DISTANCIA_MINIMA);
  });

  it("azul e vermelho ficam bem acima", () => {
    expect(distanciaDeCores("#2F6FED", "#D14D5A")).toBeGreaterThan(DISTANCIA_MINIMA);
  });

  it("aceita hexadecimal de três dígitos", () => {
    expect(distanciaDeCores("#fff", "#ffffff")).toBe(0);
  });
});

describe("paleta sugerida", () => {
  it("toda cor é vista nos dois temas — forma precisa de 3:1", () => {
    for (const cor of CORES_SUGERIDAS) {
      expect(contraste(cor, CLARO), `${cor} no tema claro`).toBeGreaterThanOrEqual(3);
      expect(contraste(cor, ESCURO), `${cor} no tema escuro`).toBeGreaterThanOrEqual(3);
    }
  });

  it("nenhum par se confunde", () => {
    for (let i = 0; i < CORES_SUGERIDAS.length; i += 1) {
      for (let j = i + 1; j < CORES_SUGERIDAS.length; j += 1) {
        expect(
          distanciaDeCores(CORES_SUGERIDAS[i], CORES_SUGERIDAS[j]),
          `${CORES_SUGERIDAS[i]} × ${CORES_SUGERIDAS[j]}`,
        ).toBeGreaterThanOrEqual(DISTANCIA_MINIMA);
      }
    }
  });

  it("as três primeiras são as dos idiomas dela, como manda o docs/07", () => {
    expect(CORES_SUGERIDAS.slice(0, 3)).toEqual(["#2F6FED", "#C08A12", "#D14D5A"]);
  });
});

describe("cor conflitante", () => {
  const existentes = [
    { nome: "Inglês", cor: "#2F6FED" },
    { nome: "Francês", cor: "#D14D5A" },
  ];

  it("acusa a cor parecida, dizendo com quem", () => {
    expect(corConflitante("#3A76F0", existentes)?.nome).toBe("Inglês");
  });

  it("deixa passar cor distinguível", () => {
    expect(corConflitante("#3AA63A", existentes)).toBeNull();
  });

  it("primeiro idioma da conta nunca conflita", () => {
    expect(corConflitante("#2F6FED", [])).toBeNull();
  });
});
