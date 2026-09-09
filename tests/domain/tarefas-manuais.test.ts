import { describe, expect, it } from "vitest";
import {
  avaliarTarefa,
  LIMITE_DE_ADIAMENTOS,
  ordenarTarefas,
  paramsDoRascunho,
  rascunhoDaTarefa,
  resumirDia,
  type TarefaManual,
} from "@/lib/domain/tarefas-manuais";

const HOJE = "2026-09-09";

function tarefa(extra: Partial<TarefaManual> = {}): TarefaManual {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    titulo: "Ler 10 páginas",
    descricao: null,
    idiomaId: "en",
    data: HOJE,
    pilar: null,
    horaPrevista: null,
    duracaoPrevistaMin: null,
    estado: "aberta",
    automatica: false,
    doDia: false,
    adiadaVezes: 0,
    ...extra,
  };
}

describe("avaliação da tarefa", () => {
  it("RN-1211: aberta hoje não é atraso — o dia não acabou", () => {
    const a = avaliarTarefa(tarefa(), HOJE);
    expect(a.atrasada).toBe(false);
    expect(a.diasDeAtraso).toBe(0);
  });

  it("aberta em dia que passou é atraso, com a conta dos dias", () => {
    const a = avaliarTarefa(tarefa({ data: "2026-09-05" }), HOJE);
    expect(a.atrasada).toBe(true);
    expect(a.diasDeAtraso).toBe(4);
  });

  it("tarefa futura nunca está atrasada", () => {
    expect(avaliarTarefa(tarefa({ data: "2026-09-20" }), HOJE).atrasada).toBe(false);
  });

  it("concluída não atrasa, mesmo velha", () => {
    const a = avaliarTarefa(tarefa({ data: "2026-01-02", estado: "concluida" }), HOJE);
    expect(a.atrasada).toBe(false);
    expect(a.concluida).toBe(true);
  });

  it("dispensada não atrasa e não pode ser adiada", () => {
    const a = avaliarTarefa(tarefa({ data: "2026-01-02", estado: "dispensada" }), HOJE);
    expect(a.atrasada).toBe(false);
    expect(a.podeAdiar).toBe(false);
  });
});

describe("RN-803 — adiar uma vez só", () => {
  it("pode adiar quando ainda não adiou", () => {
    expect(avaliarTarefa(tarefa({ adiadaVezes: 0 }), HOJE).podeAdiar).toBe(true);
  });

  it("não pode adiar de novo depois do limite", () => {
    expect(
      avaliarTarefa(tarefa({ adiadaVezes: LIMITE_DE_ADIAMENTOS }), HOJE).podeAdiar,
    ).toBe(false);
  });

  it("concluída não pode ser adiada", () => {
    expect(avaliarTarefa(tarefa({ estado: "concluida" }), HOJE).podeAdiar).toBe(false);
  });
});

describe("RN-1204 — tarefa automática", () => {
  it("não é editável", () => {
    expect(avaliarTarefa(tarefa({ automatica: true }), HOJE).podeEditar).toBe(false);
  });

  it("a escrita à mão é editável", () => {
    expect(avaliarTarefa(tarefa(), HOJE).podeEditar).toBe(true);
  });
});

describe("ordenação do painel do dia", () => {
  it("a do dia primeiro, concluídas por último", () => {
    const lista = [
      tarefa({ id: "c", titulo: "C", estado: "concluida" }),
      tarefa({ id: "b", titulo: "B" }),
      tarefa({ id: "a", titulo: "A", doDia: true }),
    ].map((t) => avaliarTarefa(t, HOJE));

    expect(ordenarTarefas(lista).map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("empate resolve por hora, e sem hora vai para o fim", () => {
    const lista = [
      tarefa({ id: "tarde", titulo: "Z", horaPrevista: "18:00" }),
      tarefa({ id: "semhora", titulo: "A", horaPrevista: null }),
      tarefa({ id: "cedo", titulo: "M", horaPrevista: "07:00" }),
    ].map((t) => avaliarTarefa(t, HOJE));

    expect(ordenarTarefas(lista).map((t) => t.id)).toEqual(["cedo", "tarde", "semhora"]);
  });

  it("mesma hora desempata por título, em português", () => {
    const lista = [
      tarefa({ id: "2", titulo: "Ápice", horaPrevista: "08:00" }),
      tarefa({ id: "1", titulo: "Amanhã", horaPrevista: "08:00" }),
    ].map((t) => avaliarTarefa(t, HOJE));

    expect(ordenarTarefas(lista).map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("não altera o array recebido", () => {
    const lista = [
      avaliarTarefa(tarefa({ id: "x", estado: "concluida" }), HOJE),
      avaliarTarefa(tarefa({ id: "y" }), HOJE),
    ];
    const antes = lista.map((t) => t.id);
    ordenarTarefas(lista);
    expect(lista.map((t) => t.id)).toEqual(antes);
  });

  it("lista vazia não quebra", () => {
    expect(ordenarTarefas([])).toEqual([]);
  });
});

describe("RN-1207 — rascunho para o registro rápido", () => {
  it("leva idioma, pilar, data e duração previstos", () => {
    const r = rascunhoDaTarefa(
      tarefa({ pilar: "gramatica", duracaoPrevistaMin: 30, idiomaId: "es" }),
    );
    expect(r).toMatchObject({
      idiomaId: "es",
      pilar: "gramatica",
      data: HOJE,
      duracaoMin: 30,
    });
  });

  it("campo ausente não vira parâmetro vazio", () => {
    const params = paramsDoRascunho(
      rascunhoDaTarefa(tarefa({ idiomaId: null, pilar: null, duracaoPrevistaMin: null })),
    );
    expect(params).not.toContain("idioma=");
    expect(params).not.toContain("pilar=");
    expect(params).not.toContain("duracao=");
    expect(params).toContain("data=2026-09-09");
  });

  it("sempre carrega a tarefa, que é o que fecha o ciclo", () => {
    const params = paramsDoRascunho(rascunhoDaTarefa(tarefa()));
    expect(params).toContain("tarefa=11111111-1111-1111-1111-111111111111");
  });
});

describe("resumo do dia", () => {
  it("dia vazio devolve tudo zero", () => {
    expect(resumirDia([])).toEqual({ total: 0, abertas: 0, concluidas: 0, atrasadas: 0 });
  });

  it("conta abertas, concluídas e atrasadas sem se confundir", () => {
    const lista = [
      tarefa({ id: "1", data: "2026-09-05" }),
      tarefa({ id: "2", estado: "concluida" }),
      tarefa({ id: "3" }),
      tarefa({ id: "4", estado: "dispensada" }),
    ].map((t) => avaliarTarefa(t, HOJE));

    expect(resumirDia(lista)).toEqual({
      total: 4,
      abertas: 2,
      concluidas: 1,
      atrasadas: 1,
    });
  });
});
