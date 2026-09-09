import { describe, expect, it } from "vitest";
import {
  alturaDaBarra,
  colunaDaSemana,
  escalaVolume,
  mesVizinho,
  nomeDoMes,
  resumirMes,
  semanasDoMes,
  totaisDoMes,
  type SessaoDoCalendario,
  type TarefaDoCalendario,
} from "@/lib/domain/calendario";

const HOJE = "2026-09-09"; // quarta-feira

describe("coluna da semana — domingo primeiro", () => {
  it("domingo é a coluna 0 e sábado a 6", () => {
    expect(colunaDaSemana("2026-09-06")).toBe(0); // domingo
    expect(colunaDaSemana("2026-09-07")).toBe(1); // segunda
    expect(colunaDaSemana("2026-09-12")).toBe(6); // sábado
  });
});

describe("semanas do mês", () => {
  it("toda linha tem sete colunas", () => {
    for (const mes of ["2026-01-15", "2026-02-10", "2026-09-09", "2027-03-01"]) {
      for (const semana of semanasDoMes(mes)) expect(semana).toHaveLength(7);
    }
  });

  it("começa sempre num domingo e termina num sábado", () => {
    const semanas = semanasDoMes("2026-09-09");
    expect(colunaDaSemana(semanas[0][0])).toBe(0);
    const ultima = semanas[semanas.length - 1];
    expect(colunaDaSemana(ultima[6])).toBe(6);
  });

  it("cobre o mês inteiro, do dia 1 ao último", () => {
    const todos = semanasDoMes("2026-09-09").flat();
    expect(todos).toContain("2026-09-01");
    expect(todos).toContain("2026-09-30");
  });

  it("fevereiro bissexto entra inteiro", () => {
    const todos = semanasDoMes("2028-02-10").flat();
    expect(todos).toContain("2028-02-29");
  });

  it("fevereiro não bissexto para no 28", () => {
    const todos = semanasDoMes("2026-02-10").flat();
    expect(todos).toContain("2026-02-28");
    expect(todos).not.toContain("2026-02-29");
  });

  it("mês que começa no domingo não ganha linha vazia na frente", () => {
    // 2026-03-01 é domingo
    expect(colunaDaSemana("2026-03-01")).toBe(0);
    expect(semanasDoMes("2026-03-15")[0][0]).toBe("2026-03-01");
  });

  it("as datas são contíguas, sem buraco nem repetição", () => {
    const todos = semanasDoMes("2026-09-09").flat();
    expect(new Set(todos).size).toBe(todos.length);
    for (let i = 1; i < todos.length; i += 1) {
      const anterior = new Date(`${todos[i - 1]}T12:00:00Z`).getTime();
      const atual = new Date(`${todos[i]}T12:00:00Z`).getTime();
      expect(atual - anterior).toBe(86_400_000);
    }
  });
});

function sessao(data: string, idiomaId: string, duracaoMin: number): SessaoDoCalendario {
  return { data, idiomaId, duracaoMin };
}
function tarefa(data: string, concluida: boolean): TarefaDoCalendario {
  return { data, idiomaId: null, concluida };
}

describe("resumo do mês", () => {
  it("mês sem nada nenhum: nada quebra e tudo é zero", () => {
    const semanas = resumirMes({ mes: "2026-09-09", hoje: HOJE, sessoes: [], tarefas: [] });
    expect(semanas.flat().every((d) => d.minutos === 0 && d.idiomas.length === 0)).toBe(true);
    expect(totaisDoMes(semanas)).toMatchObject({ minutos: 0, diasComRegistro: 0, diasNoMes: 30 });
  });

  it("soma os minutos do dia e junta os idiomas sem repetir", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [
        sessao("2026-09-08", "en", 30),
        sessao("2026-09-08", "es", 20),
        sessao("2026-09-08", "en", 10),
      ],
      tarefas: [],
    });
    const dia = semanas.flat().find((d) => d.data === "2026-09-08")!;
    expect(dia.minutos).toBe(60);
    expect(dia.idiomas).toEqual(["en", "es"]);
  });

  it("marca hoje, futuro e passado corretamente", () => {
    const semanas = resumirMes({ mes: "2026-09-09", hoje: HOJE, sessoes: [], tarefas: [] });
    const porData = new Map(semanas.flat().map((d) => [d.data, d]));
    expect(porData.get(HOJE)).toMatchObject({ hoje: true, futuro: false });
    expect(porData.get("2026-09-10")).toMatchObject({ hoje: false, futuro: true });
    expect(porData.get("2026-09-08")).toMatchObject({ hoje: false, futuro: false });
  });

  it("dia das pontas é marcado fora do mês", () => {
    const semanas = resumirMes({ mes: "2026-09-09", hoje: HOJE, sessoes: [], tarefas: [] });
    const porData = new Map(semanas.flat().map((d) => [d.data, d]));
    expect(porData.get("2026-09-01")!.noMes).toBe(true);
    expect(porData.get("2026-08-31")!.noMes).toBe(false);
  });

  it("RN-1211: tarefa aberta em dia que passou fica atrasada", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [],
      tarefas: [tarefa("2026-09-07", false)],
    });
    expect(semanas.flat().find((d) => d.data === "2026-09-07")!.atrasada).toBe(true);
  });

  it("tarefa aberta hoje ainda não é atraso — o dia não acabou", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [],
      tarefas: [tarefa(HOJE, false)],
    });
    expect(semanas.flat().find((d) => d.data === HOJE)!.atrasada).toBe(false);
  });

  it("tarefa concluída num dia que passou não é atraso", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [],
      tarefas: [tarefa("2026-09-07", true)],
    });
    const dia = semanas.flat().find((d) => d.data === "2026-09-07")!;
    expect(dia.atrasada).toBe(false);
    expect(dia.tarefasConcluidas).toBe(1);
  });

  it("sessão fora do mês visível não contamina o total", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [sessao("2026-08-31", "en", 500)],
      tarefas: [],
    });
    expect(totaisDoMes(semanas).minutos).toBe(0);
  });
});

describe("escala de volume", () => {
  it("é o maior dia do próprio mês", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [sessao("2026-09-02", "en", 40), sessao("2026-09-05", "en", 120)],
      tarefas: [],
    });
    expect(escalaVolume(semanas)).toBe(120);
  });

  it("ignora os dias das pontas, que são de outro mês", () => {
    const semanas = resumirMes({
      mes: "2026-09-09",
      hoje: HOJE,
      sessoes: [sessao("2026-08-31", "en", 999), sessao("2026-09-05", "en", 60)],
      tarefas: [],
    });
    expect(escalaVolume(semanas)).toBe(60);
  });

  it("mês vazio devolve zero em vez de estourar", () => {
    const semanas = resumirMes({ mes: "2026-09-09", hoje: HOJE, sessoes: [], tarefas: [] });
    expect(escalaVolume(semanas)).toBe(0);
    expect(alturaDaBarra(0, 0)).toBe(0);
  });
});

describe("altura da barra", () => {
  it("é a fração da escala, presa em 1", () => {
    expect(alturaDaBarra(30, 60)).toBe(0.5);
    expect(alturaDaBarra(60, 60)).toBe(1);
    expect(alturaDaBarra(90, 60)).toBe(1);
  });

  it("zero minutos não desenha barra", () => {
    expect(alturaDaBarra(0, 60)).toBe(0);
  });
});

describe("navegação entre meses", () => {
  it("anda para trás e para frente", () => {
    expect(mesVizinho("2026-09-09", -1)).toBe("2026-08-01");
    expect(mesVizinho("2026-09-09", 1)).toBe("2026-10-01");
  });

  it("atravessa a virada do ano nos dois sentidos", () => {
    expect(mesVizinho("2026-01-15", -1)).toBe("2025-12-01");
    expect(mesVizinho("2026-12-15", 1)).toBe("2027-01-01");
  });

  it("de 31 de março para trás cai em fevereiro, não em março de novo", () => {
    expect(mesVizinho("2026-03-31", -1)).toBe("2026-02-01");
  });
});

describe("nome do mês", () => {
  it("vem em português e com inicial maiúscula", () => {
    expect(nomeDoMes("2026-09-01")).toBe("Setembro de 2026");
    expect(nomeDoMes("2026-01-01")).toBe("Janeiro de 2026");
  });
});
