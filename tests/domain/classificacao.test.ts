import { describe, expect, it } from "vitest";
import {
  atividadeDisponivel,
  categoriaTravada,
  classificar,
  conflitoGramaticaPronuncia,
  ehProducao,
  faltaPilar,
  normalizarDuracao,
} from "@/lib/domain/classificacao";
import { sessao } from "../fixtures/dominio";

describe("RN-102 — escuta não é pilar", () => {
  it("série, podcast, audiobook, youtube e browser mode são imersão travada", () => {
    for (const a of ["serie_filme", "podcast", "audiobook", "youtube", "browser_mode"] as const) {
      expect(categoriaTravada(a)).toBe(true);
      const c = classificar({ atividade: a, duracaoMin: 60, categoria: "ativo", pilar: "fala" });
      expect(c.categoria).toBe("imersao");
      expect(c.pilar).toBeNull();
      expect(c.producao).toBe(false);
    }
  });

  it("nem escolhendo 'ativo' na mão o podcast vira estudo ativo", () => {
    const c = classificar({ atividade: "podcast", duracaoMin: 45, categoria: "ativo" });
    expect(c.categoria).toBe("imersao");
  });

  it("leitura é a única imersão que aceita virar ativo", () => {
    expect(categoriaTravada("leitura")).toBe(false);
    expect(classificar({ atividade: "leitura", duracaoMin: 30 }).categoria).toBe("imersao");
    const ativo = classificar({
      atividade: "leitura",
      duracaoMin: 30,
      categoria: "ativo",
      pilar: "vocabulario",
    });
    expect(ativo.categoria).toBe("ativo");
    expect(ativo.pilar).toBe("vocabulario");
  });
});

describe("RN-101 — defaults por atividade", () => {
  it("cada atividade traz pilar e tempo próprios", () => {
    expect(classificar({ atividade: "flashcards", duracaoMin: 10 })).toMatchObject({
      pilar: "vocabulario",
      tempo: "maos_livres",
    });
    expect(classificar({ atividade: "fala_sozinha", duracaoMin: 5 })).toMatchObject({
      pilar: "fala",
      tempo: "maos_ocupadas",
    });
    expect(classificar({ atividade: "gramatica", duracaoMin: 40 })).toMatchObject({
      pilar: "gramatica",
      tempo: "cadeira",
    });
  });

  it("escrita tem pilar gramática e conta como produção", () => {
    const c = classificar({ atividade: "escrita", duracaoMin: 30 });
    expect(c.pilar).toBe("gramatica");
    expect(c.producao).toBe(true);
    expect(ehProducao("escrita")).toBe(true);
  });

  it("'outro' exige que a usuária escolha o pilar", () => {
    const c = classificar({ atividade: "outro", duracaoMin: 20 });
    expect(faltaPilar(c)).toBe(true);
    expect(faltaPilar(classificar({ atividade: "outro", duracaoMin: 20, pilar: "fala" }))).toBe(false);
  });
});

describe("RN-105 — minutos de fala", () => {
  it("atividade de fala assume a duração inteira", () => {
    expect(classificar({ atividade: "conversacao", duracaoMin: 50 }).minutosFala).toBe(50);
    expect(classificar({ atividade: "audio_grupo", duracaoMin: 2 }).minutosFala).toBe(2);
  });

  it("escrita é produção mas não é fala", () => {
    expect(classificar({ atividade: "escrita", duracaoMin: 30 }).minutosFala).toBe(0);
  });

  it("gramática pode ter fala se ela produziu frases em voz alta", () => {
    expect(classificar({ atividade: "gramatica", duracaoMin: 40, minutosFala: 6 }).minutosFala).toBe(6);
  });

  it("nunca passa da duração da sessão", () => {
    expect(classificar({ atividade: "gramatica", duracaoMin: 10, minutosFala: 99 }).minutosFala).toBe(10);
    expect(classificar({ atividade: "gramatica", duracaoMin: 10, minutosFala: -5 }).minutosFala).toBe(0);
  });

  it("imersão não gera minutos de fala", () => {
    expect(classificar({ atividade: "podcast", duracaoMin: 60 }).minutosFala).toBe(0);
  });
});

describe("RN-106 — duração", () => {
  it("arredonda e respeita os limites", () => {
    expect(normalizarDuracao(39.6)).toBe(40);
    expect(normalizarDuracao(0)).toBe(1);
    expect(normalizarDuracao(0.2)).toBe(1);
    expect(normalizarDuracao(9999)).toBe(480);
  });
});

describe("RN-305 — gramática e pronúncia no mesmo dia", () => {
  const dia = "2026-09-08";

  it("avisa quando o oposto já está no dia", () => {
    const doDia = [sessao(dia, "gramatica")];
    expect(conflitoGramaticaPronuncia("pronuncia", doDia)).toBe("gramatica");
    expect(conflitoGramaticaPronuncia("gramatica", [sessao(dia, "pronuncia")])).toBe("pronuncia");
  });

  it("não avisa para o mesmo pilar duas vezes", () => {
    expect(conflitoGramaticaPronuncia("gramatica", [sessao(dia, "gramatica")])).toBeNull();
  });

  it("não avisa para pilares que não são gramática nem pronúncia", () => {
    expect(conflitoGramaticaPronuncia("fala", [sessao(dia, "gramatica")])).toBeNull();
    expect(conflitoGramaticaPronuncia(null, [sessao(dia, "gramatica")])).toBeNull();
  });

  it("imersão no dia não gera conflito nenhum", () => {
    expect(conflitoGramaticaPronuncia("pronuncia", [sessao(dia, "podcast")])).toBeNull();
  });

  it("conflito entre idiomas diferentes ainda é conflito — a regra é do dia, não do idioma", () => {
    const doDia = [sessao(dia, "gramatica", 30, { idiomaId: "espanhol" })];
    expect(conflitoGramaticaPronuncia("pronuncia", doDia)).toBe("gramatica");
  });
});

describe("RN-306 — Instagram só na marcha 3", () => {
  it("bloqueia nas marchas 1 e 2", () => {
    expect(atividadeDisponivel("conteudo_instagram", 1)).toBe(false);
    expect(atividadeDisponivel("conteudo_instagram", 2)).toBe(false);
    expect(atividadeDisponivel("conteudo_instagram", 3)).toBe(true);
  });

  it("não interfere nas outras atividades", () => {
    expect(atividadeDisponivel("gramatica", 1)).toBe(true);
  });
});
