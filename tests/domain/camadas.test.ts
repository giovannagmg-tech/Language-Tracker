import { describe, expect, it } from "vitest";
import {
  acumuladoDe,
  diasParaProximaCamada,
  mediaMovel7d,
  progressoCamada,
  reguaFrequencia,
  type Camada,
} from "@/lib/domain/camadas";
import { somaDias } from "@/lib/domain/datas";

const CAMADAS: Camada[] = [
  { numero: 1, nome: "Viajante", limiar: 1500 },
  { numero: 2, nome: "Conexão", limiar: 3000 },
  { numero: 3, nome: "Negócios", limiar: 5000 },
  { numero: 4, nome: "Acadêmico", limiar: 10000 },
  { numero: 5, nome: "Maestria", limiar: 20000 },
];

const FAIXAS = [
  { ate: 2000, rotulo: "Ainda em A1/A2 — as 2.000 mais frequentes tiram você daqui" },
  { ate: 3000, rotulo: "Saindo de A2" },
  { ate: 9000, rotulo: "Território B1/B2" },
  { ate: null, rotulo: "Faixa avançada" },
];

describe("RN-501 — camadas", () => {
  it("acumulado é a base mais as palavras registradas", () => {
    const registros = [
      { data: "2026-09-07", idiomaId: "ingles", palavrasNovas: 5 },
      { data: "2026-09-08", idiomaId: "ingles", palavrasNovas: 7 },
    ];
    expect(acumuladoDe(3000, registros)).toBe(3012);
  });

  it("3.000 palavras é Conexão, mirando Negócios", () => {
    const p = progressoCamada(3000, CAMADAS, FAIXAS);
    expect(p.camada?.nome).toBe("Conexão");
    expect(p.proxima?.nome).toBe("Negócios");
    expect(p.faltam).toBe(2000);
    expect(p.progresso).toBeCloseTo(0, 5);
  });

  it("no meio da camada o progresso é a fração do vão", () => {
    // 4.000 está na metade entre 3.000 e 5.000
    expect(progressoCamada(4000, CAMADAS).progresso).toBeCloseTo(0.5, 5);
  });

  it("zero palavras fica antes da camada 1", () => {
    const p = progressoCamada(0, CAMADAS, FAIXAS);
    expect(p.camada).toBeNull();
    expect(p.proxima?.nome).toBe("Viajante");
    expect(p.faltam).toBe(1500);
    expect(p.progresso).toBeCloseTo(0, 5);
  });

  it("acima da última camada não existe próxima", () => {
    const p = progressoCamada(25000, CAMADAS);
    expect(p.camada?.nome).toBe("Maestria");
    expect(p.proxima).toBeNull();
    expect(p.faltam).toBe(0);
    expect(p.progresso).toBe(1);
  });

  it("exatamente no limiar já conta como a camada nova", () => {
    expect(progressoCamada(1500, CAMADAS).camada?.nome).toBe("Viajante");
    expect(progressoCamada(1499, CAMADAS).camada).toBeNull();
  });
});

describe("RN-502 — régua de frequência", () => {
  it("classifica pelas faixas, na ordem", () => {
    expect(reguaFrequencia(800, FAIXAS)).toContain("A1/A2");
    expect(reguaFrequencia(2500, FAIXAS)).toBe("Saindo de A2");
    expect(reguaFrequencia(3000, FAIXAS)).toBe("Território B1/B2");
    expect(reguaFrequencia(12000, FAIXAS)).toBe("Faixa avançada");
  });
});

describe("RN-505 — projeção", () => {
  it("2.000 palavras a 5 por dia dão 400 dias", () => {
    expect(diasParaProximaCamada(2000, 5)).toBe(400);
  });

  it("arredonda para cima — dia quebrado é dia inteiro", () => {
    expect(diasParaProximaCamada(10, 3)).toBe(4);
  });

  it("sem palavra nenhuma na semana, a projeção não existe", () => {
    expect(diasParaProximaCamada(2000, 0)).toBeNull();
  });

  it("já atingida devolve zero", () => {
    expect(diasParaProximaCamada(0, 5)).toBe(0);
  });

  it("a média móvel divide por 7, não pelo número de dias com registro", () => {
    const registros = [
      { data: "2026-09-07", idiomaId: "ingles", palavrasNovas: 7 },
      { data: "2026-09-09", idiomaId: "ingles", palavrasNovas: 7 },
    ];
    expect(mediaMovel7d(registros, "2026-09-09", somaDias)).toBeCloseTo(2, 5);
  });

  it("registro fora da janela de 7 dias não entra", () => {
    const registros = [{ data: "2026-09-01", idiomaId: "ingles", palavrasNovas: 70 }];
    expect(mediaMovel7d(registros, "2026-09-10", somaDias)).toBe(0);
  });
});
