import { describe, expect, it } from "vitest";
import { pendentesDoDia, tarefasDoDia, type ContextoMarcha } from "@/lib/domain/marchas";
import { MARCHAS, revisao, sessao } from "../fixtures/dominio";

const SEGUNDA = "2026-09-07";
const SEXTA = "2026-09-11";
const SABADO = "2026-09-12";

function ctx(over: Partial<ContextoMarcha> = {}): ContextoMarcha {
  return {
    definicoes: MARCHAS,
    marchaAtiva: 1,
    data: SEGUNDA,
    sessoesDoDia: [],
    revisoesDoDia: [],
    sessoesDaSemana: [],
    itensRevisaoResolvidosNoDia: 0,
    ...over,
  };
}

describe("RN-203 e RN-206 — tarefas da marcha", () => {
  it("marcha 1 exige três coisas, todo dia", () => {
    const t = tarefasDoDia(ctx());
    expect(t.map((x) => x.chave)).toEqual([
      "flashcards",
      "fala_1min",
      "imersao_maos_ocupadas",
    ]);
  });

  it("as marchas são cumulativas", () => {
    const chaves = tarefasDoDia(ctx({ marchaAtiva: 2 })).map((x) => x.chave);
    expect(chaves).toContain("flashcards");
    expect(chaves).toContain("bloco_manha");
  });

  it("o bloco da marcha 1 vem sempre primeiro", () => {
    const t = tarefasDoDia(ctx({ marchaAtiva: 3 }));
    expect(t[0].marcha).toBe(1);
    expect(t.filter((x) => x.marcha === 1)).toHaveLength(3);
  });

  it("cumpridas descem dentro do próprio bloco", () => {
    const t = tarefasDoDia(
      ctx({ revisoesDoDia: [revisao(SEGUNDA)], sessoesDoDia: [] }),
    );
    expect(t[t.length - 1].chave).toBe("flashcards");
    expect(t.find((x) => x.chave === "flashcards")?.cumprida).toBe(true);
  });
});

describe("RN-204 — sexta é pronúncia, não gramática", () => {
  it("na sexta o bloco matinal de segunda a quinta não aparece", () => {
    const chaves = tarefasDoDia(ctx({ marchaAtiva: 2, data: SEXTA })).map((x) => x.chave);
    expect(chaves).not.toContain("bloco_manha");
    expect(chaves).toContain("sexta_pronuncia");
  });

  it("na segunda a sexta de pronúncia não aparece", () => {
    const chaves = tarefasDoDia(ctx({ marchaAtiva: 2, data: SEGUNDA })).map((x) => x.chave);
    expect(chaves).toContain("bloco_manha");
    expect(chaves).not.toContain("sexta_pronuncia");
  });

  it("nenhuma tarefa de gramática é oferecida na sexta", () => {
    const t = tarefasDoDia(ctx({ marchaAtiva: 3, data: SEXTA }));
    expect(t.some((x) => x.titulo.toLowerCase().includes("gramática"))).toBe(false);
  });

  it("25 minutos de pronúncia cumprem a sexta", () => {
    const t = tarefasDoDia(
      ctx({
        marchaAtiva: 2,
        data: SEXTA,
        sessoesDoDia: [sessao(SEXTA, "pronuncia", 25)],
      }),
    );
    expect(t.find((x) => x.chave === "sexta_pronuncia")).toMatchObject({
      cumprida: true,
      atual: 25,
      alvo: 25,
      unidade: "min",
    });
  });
});

describe("avaliação dos critérios", () => {
  it("bloco matinal soma só o que é ativo e na cadeira", () => {
    const t = tarefasDoDia(
      ctx({
        marchaAtiva: 2,
        sessoesDoDia: [
          sessao(SEGUNDA, "gramatica", 30),
          sessao(SEGUNDA, "podcast", 60),
          sessao(SEGUNDA, "flashcards", 15, { tempo: "cadeira" }),
        ],
      }),
    );
    const bloco = t.find((x) => x.chave === "bloco_manha");
    expect(bloco).toMatchObject({ atual: 45, alvo: 40, cumprida: true });
  });

  it("imersão de mãos ocupadas não aceita imersão na cadeira", () => {
    const t = tarefasDoDia(
      ctx({ sessoesDoDia: [sessao(SEGUNDA, "serie_filme", 60, { tempo: "cadeira" })] }),
    );
    expect(t.find((x) => x.chave === "imersao_maos_ocupadas")?.cumprida).toBe(false);
  });

  it("tarefa semanal olha a semana inteira, não o dia", () => {
    const t = tarefasDoDia(
      ctx({
        marchaAtiva: 2,
        sessoesDoDia: [],
        sessoesDaSemana: [sessao("2026-09-08", "conversacao", 50)],
      }),
    );
    expect(t.find((x) => x.chave === "clube")).toMatchObject({ cumprida: true, escopo: "semana" });
  });

  it("tarefa semanal aparece todo dia enquanto pendente", () => {
    const t = tarefasDoDia(ctx({ marchaAtiva: 2, data: SABADO }));
    expect(t.map((x) => x.chave)).toContain("audio_grupo");
  });
});

describe("RN-306 — Instagram é opcional e só na marcha 3", () => {
  it("não aparece nas marchas 1 e 2", () => {
    expect(tarefasDoDia(ctx({ marchaAtiva: 2 })).map((x) => x.chave)).not.toContain("instagram");
  });

  it("na marcha 3 aparece, mas não conta como pendência", () => {
    const t = tarefasDoDia(ctx({ marchaAtiva: 3 }));
    const instagram = t.find((x) => x.chave === "instagram");
    expect(instagram?.opcional).toBe(true);
    expect(pendentesDoDia(t)).toBe(t.filter((x) => !x.cumprida).length - 1);
  });
});

describe("dia sem nada", () => {
  it("nenhuma tarefa cumprida, nenhuma explosão", () => {
    const t = tarefasDoDia(ctx({ marchaAtiva: 3, data: SABADO }));
    expect(t.every((x) => !x.cumprida)).toBe(true);
    expect(t.every((x) => x.atual === 0)).toBe(true);
  });
});
