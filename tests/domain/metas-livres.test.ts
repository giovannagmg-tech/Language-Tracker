import { describe, expect, it } from "vitest";
import {
  avaliarMetaLivre,
  fracaoDoPrazoGasta,
  ordenarMetasLivres,
  plural,
  progressoDaMeta,
  resumoDaLista,
  type MetaLivre,
} from "@/lib/domain/metas-livres";

const HOJE = "2026-09-09";

function meta(extra: Partial<MetaLivre> = {}): MetaLivre {
  return {
    id: "m1",
    idiomaId: null,
    titulo: "Ler 1 livro em inglês",
    unidade: "livro",
    alvo: 1,
    feito: 0,
    prazo: null,
    concluidaEm: null,
    criadaEm: "2026-09-01",
    ativa: true,
    ...extra,
  };
}

describe("progresso", () => {
  it("é a fração do alvo, presa entre 0 e 1", () => {
    expect(progressoDaMeta(0, 4)).toBe(0);
    expect(progressoDaMeta(2, 4)).toBe(0.5);
    expect(progressoDaMeta(9, 4)).toBe(1);
    expect(progressoDaMeta(-3, 4)).toBe(0);
  });

  it("alvo zero não divide por zero", () => {
    expect(progressoDaMeta(5, 0)).toBe(0);
  });
});

describe("estado da meta", () => {
  it("sem prazo fica cinza — não existe atraso sem data", () => {
    const a = avaliarMetaLivre(meta({ alvo: 8, feito: 1 }), HOJE);
    expect(a.estado).toBe("cinza");
    expect(a.diasRestantes).toBeNull();
    expect(a.ritmoNecessario).toBeNull();
  });

  it("concluída fica verde mesmo com o prazo vencido", () => {
    const a = avaliarMetaLivre(
      meta({ alvo: 3, feito: 3, prazo: "2026-08-01" }),
      HOJE,
    );
    expect(a.estado).toBe("verde");
    expect(a.concluida).toBe(true);
    expect(a.resumo).toBe("concluída");
  });

  it("prazo vencido sem concluir fica vermelho", () => {
    const a = avaliarMetaLivre(meta({ alvo: 3, feito: 1, prazo: "2026-09-04" }), HOJE);
    expect(a.estado).toBe("vermelho");
    expect(a.diasRestantes).toBe(-5);
    expect(a.resumo).toContain("prazo vencido há 5 dias");
  });

  it("no meio do prazo com metade feita está no ritmo", () => {
    // criada 01/09, prazo 11/09 → 10 dias; hoje 09/09 → 80% do tempo gasto
    const a = avaliarMetaLivre(
      meta({ alvo: 10, feito: 8, prazo: "2026-09-11", criadaEm: "2026-09-01" }),
      HOJE,
    );
    expect(a.estado).toBe("verde");
  });

  it("atrás do ritmo, mas com prazo aberto, fica amarelo", () => {
    const a = avaliarMetaLivre(
      meta({ alvo: 10, feito: 1, prazo: "2026-09-11", criadaEm: "2026-09-01" }),
      HOJE,
    );
    expect(a.estado).toBe("amarelo");
  });

  it("vencendo hoje ainda dá o dia inteiro para o ritmo", () => {
    const a = avaliarMetaLivre(meta({ alvo: 3, feito: 1, prazo: HOJE }), HOJE);
    expect(a.diasRestantes).toBe(0);
    expect(a.ritmoNecessario).toBe(2); // 2 faltando / (0 + 1) dia
    expect(a.resumo).toContain("vence hoje");
  });
});

describe("fração do prazo gasta", () => {
  it("prazo criado no mesmo dia conta como corrida inteira", () => {
    const m = meta({ prazo: "2026-09-01", criadaEm: "2026-09-01" });
    expect(fracaoDoPrazoGasta(m, HOJE)).toBe(1);
  });

  it("sem prazo não há tempo gasto", () => {
    expect(fracaoDoPrazoGasta(meta(), HOJE)).toBe(0);
  });

  it("no meio da janela dá meio", () => {
    const m = meta({ criadaEm: "2026-09-01", prazo: "2026-09-17" });
    expect(fracaoDoPrazoGasta(m, "2026-09-09")).toBe(0.5);
  });
});

describe("plural da unidade", () => {
  it("respeita o singular", () => {
    expect(plural("livro", 1)).toBe("livro");
    expect(plural("episódio", 1)).toBe("episódio");
  });

  it("pluraliza os casos que aparecem de verdade", () => {
    expect(plural("livro", 2)).toBe("livros");
    expect(plural("aula", 3)).toBe("aulas");
    expect(plural("episódio", 8)).toBe("episódios");
    expect(plural("redação", 2)).toBe("redações");
    expect(plural("capítulo", 12)).toBe("capítulos");
  });

  it("não pluraliza o que já está no plural", () => {
    expect(plural("aulas", 4)).toBe("aulas");
  });

  it("palavra terminada em s fica como está — o limite conhecido da regra", () => {
    // "mês" viraria "mêss"; deixar intacto erra menos e a unidade é escrita
    // por ela, então sempre dá para digitar "meses" direto.
    expect(plural("mês", 2)).toBe("mês");
  });
});

describe("ordenação", () => {
  it("atrasada antes de em risco, em risco antes de em dia, concluída por último", () => {
    const metas = [
      meta({ id: "ok", titulo: "Concluída", alvo: 1, feito: 1 }),
      meta({ id: "sem", titulo: "Sem prazo", alvo: 5, feito: 0 }),
      meta({ id: "atras", titulo: "Vencida", alvo: 5, feito: 1, prazo: "2026-09-01" }),
      meta({
        id: "risco",
        titulo: "Em risco",
        alvo: 10,
        feito: 1,
        prazo: "2026-09-11",
        criadaEm: "2026-09-01",
      }),
    ].map((m) => avaliarMetaLivre(m, HOJE));

    expect(ordenarMetasLivres(metas).map((m) => m.id)).toEqual([
      "atras",
      "risco",
      "sem",
      "ok",
    ]);
  });

  it("não altera o array recebido", () => {
    const metas = [
      avaliarMetaLivre(meta({ id: "a", titulo: "A", alvo: 1, feito: 1 }), HOJE),
      avaliarMetaLivre(meta({ id: "b", titulo: "B", alvo: 5 }), HOJE),
    ];
    const antes = metas.map((m) => m.id);
    ordenarMetasLivres(metas);
    expect(metas.map((m) => m.id)).toEqual(antes);
  });
});

describe("resumo da lista", () => {
  it("lista vazia não quebra", () => {
    expect(resumoDaLista([])).toEqual({ total: 0, concluidas: 0, atrasadas: 0 });
  });

  it("conta concluídas e atrasadas separadamente", () => {
    const metas = [
      meta({ id: "1", alvo: 1, feito: 1 }),
      meta({ id: "2", alvo: 5, feito: 1, prazo: "2026-08-01" }),
      meta({ id: "3", alvo: 5, feito: 1 }),
    ].map((m) => avaliarMetaLivre(m, HOJE));
    expect(resumoDaLista(metas)).toEqual({ total: 3, concluidas: 1, atrasadas: 1 });
  });
});
