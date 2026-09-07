import { describe, expect, it } from "vitest";
import { pisoDoDia } from "@/lib/domain/piso";
import {
  avaliarSeisRegras,
  regrasEmRisco,
  type ContextoRegras,
} from "@/lib/domain/regras";
import { revisao, sessao } from "../fixtures/dominio";

const QUARTA = "2026-09-09";
const DOMINGO = "2026-09-13";
const QUINTA = "2026-09-10";

const pisoVazio = pisoDoDia({ revisoes: [], sessoes: [], hora: 10, horaAperto: 20 });
const pisoCheio = pisoDoDia({
  revisoes: [revisao(QUARTA)],
  sessoes: [sessao(QUARTA, "fala_sozinha", 1)],
  hora: 10,
  horaAperto: 20,
});

function ctx(over: Partial<ContextoRegras> = {}): ContextoRegras {
  return {
    hoje: QUARTA,
    hora: 10,
    horaAperto: 20,
    marchaAtiva: 2,
    emBrancoOntem: false,
    emBrancoHoje: false,
    piso: pisoCheio,
    conversacaoNaSemana: true,
    clubeAgendado: true,
    audioNaSemana: true,
    violouRegra5Hoje: false,
    ...over,
  };
}

function regra(c: ContextoRegras, numero: number) {
  const r = avaliarSeisRegras(c).find((x) => x.numero === numero);
  if (!r) throw new Error(`regra ${numero} não avaliada`);
  return r;
}

describe("RN-301 — regra 1: nunca dois dias em branco", () => {
  it("dia com registro é verde", () => {
    expect(regra(ctx(), 1).estado).toBe("verde");
  });

  it("hoje em branco depois de um dia cheio é cinza de manhã", () => {
    expect(regra(ctx({ emBrancoHoje: true }), 1).estado).toBe("cinza");
  });

  it("hoje em branco depois das 20h vira amarelo", () => {
    expect(regra(ctx({ emBrancoHoje: true, hora: 21 }), 1).estado).toBe("amarelo");
  });

  it("dois dias em branco é vermelho a qualquer hora", () => {
    const r = regra(ctx({ emBrancoHoje: true, emBrancoOntem: true, hora: 8 }), 1);
    expect(r.estado).toBe("vermelho");
    expect(r.mensagem).toContain("Um minuto resolve");
  });

  it("vermelho e amarelo trazem ação de um minuto", () => {
    expect(regra(ctx({ emBrancoHoje: true, emBrancoOntem: true }), 1).acao).toBe(
      "registrar_um_minuto",
    );
    expect(regra(ctx(), 1).acao).toBeNull();
  });
});

describe("RN-302 — regra 2: o piso independe da marcha", () => {
  it("herda o estado do piso", () => {
    expect(regra(ctx({ piso: pisoCheio }), 2).estado).toBe("verde");
    expect(regra(ctx({ piso: pisoVazio }), 2).estado).toBe("cinza");
  });

  it("na marcha 1 continua sendo cobrado igual", () => {
    const pisoVazioTarde = pisoDoDia({ revisoes: [], sessoes: [], hora: 22, horaAperto: 20 });
    expect(regra(ctx({ marchaAtiva: 1, piso: pisoVazioTarde }), 2).estado).toBe("vermelho");
  });

  it("a ação aponta para o que falta", () => {
    const soFala = pisoDoDia({
      revisoes: [],
      sessoes: [sessao(QUARTA, "fala_sozinha", 2)],
      hora: 10,
      horaAperto: 20,
    });
    expect(regra(ctx({ piso: soFala }), 2).acao).toBe("marcar_revisao");

    const soFlash = pisoDoDia({ revisoes: [revisao(QUARTA)], sessoes: [], hora: 10, horaAperto: 20 });
    expect(regra(ctx({ piso: soFlash }), 2).acao).toBe("registrar_um_minuto");
  });
});

describe("RN-303 — regra 3: clube é compromisso marcado", () => {
  it("conversação feita na semana é verde", () => {
    expect(regra(ctx(), 3).estado).toBe("verde");
  });

  it("marcado mas não feito é amarelo", () => {
    expect(regra(ctx({ conversacaoNaSemana: false }), 3).estado).toBe("amarelo");
  });

  it("nada marcado na marcha 2 é vermelho, com ação de agendar", () => {
    const r = regra(ctx({ conversacaoNaSemana: false, clubeAgendado: false }), 3);
    expect(r.estado).toBe("vermelho");
    expect(r.acao).toBe("agendar_clube");
    expect(r.mensagem).toContain("Intenção não conta");
  });

  it("na marcha 1 não é cobrado", () => {
    const r = regra(ctx({ marchaAtiva: 1, conversacaoNaSemana: false, clubeAgendado: false }), 3);
    expect(r.estado).toBe("cinza");
    expect(r.acao).toBeNull();
  });
});

describe("RN-304 — regra 4: um áudio por semana", () => {
  it("áudio enviado é verde", () => {
    expect(regra(ctx(), 4).estado).toBe("verde");
  });

  it("cinza no começo da semana", () => {
    expect(regra(ctx({ audioNaSemana: false }), 4).estado).toBe("cinza");
  });

  it("amarelo a partir de quinta", () => {
    expect(regra(ctx({ audioNaSemana: false, hoje: QUINTA }), 4).estado).toBe("amarelo");
  });

  it("vermelho no domingo", () => {
    const r = regra(ctx({ audioNaSemana: false, hoje: DOMINGO }), 4);
    expect(r.estado).toBe("vermelho");
    expect(r.mensagem).toContain("Feio mesmo vale");
    expect(r.acao).toBe("registrar_audio_grupo");
  });
});

describe("RN-305 — regra 5: gramática e pronúncia", () => {
  it("sem violação é verde", () => {
    expect(regra(ctx(), 5).estado).toBe("verde");
  });

  it("violação no dia é vermelho", () => {
    expect(regra(ctx({ violouRegra5Hoje: true }), 5).estado).toBe("vermelho");
  });

  it("na sexta a mensagem lembra que o dia é de pronúncia", () => {
    expect(regra(ctx({ hoje: "2026-09-11" }), 5).mensagem).toContain("sexta");
  });

  it("não tem ação — é regra de não fazer, não de correr atrás", () => {
    expect(regra(ctx({ violouRegra5Hoje: true }), 5).acao).toBeNull();
  });
});

describe("RN-306 — regra 6: Instagram", () => {
  it("cinza fora da marcha 3, dizendo em qual marcha ela está", () => {
    const r = regra(ctx({ marchaAtiva: 1 }), 6);
    expect(r.estado).toBe("cinza");
    expect(r.mensagem).toContain("marcha 1");
  });

  it("verde na marcha 3", () => {
    expect(regra(ctx({ marchaAtiva: 3 }), 6).estado).toBe("verde");
  });
});

describe("RN-307 — ordenação do semáforo", () => {
  it("sempre devolve as seis", () => {
    expect(avaliarSeisRegras(ctx())).toHaveLength(6);
  });

  it("vermelhas primeiro, depois amarelas, ordem numérica dentro do grupo", () => {
    const regras = avaliarSeisRegras(
      ctx({
        emBrancoHoje: true,
        emBrancoOntem: true,
        piso: pisoVazio,
        audioNaSemana: false,
        hoje: DOMINGO,
        conversacaoNaSemana: false,
        clubeAgendado: false,
      }),
    );
    const vermelhas = regras.filter((r) => r.estado === "vermelho").map((r) => r.numero);
    expect(vermelhas).toEqual([1, 3, 4]);
    expect(regras[0].numero).toBe(1);
    expect(regras.at(-1)?.estado).toBe("verde");
  });

  it("conta quantas estão em risco", () => {
    expect(regrasEmRisco(avaliarSeisRegras(ctx()))).toBe(0);
    expect(
      regrasEmRisco(avaliarSeisRegras(ctx({ emBrancoHoje: true, emBrancoOntem: true }))),
    ).toBe(1);
  });
});
