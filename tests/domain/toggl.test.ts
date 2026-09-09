import { describe, expect, it } from "vitest";
import {
  aplicarRegras,
  chaveDaColuna,
  chaveToggl,
  classificarLinhas,
  colunasObrigatoriasFaltando,
  detectarSeparador,
  duracaoParaMinutos,
  lerLinhas,
  limparBOM,
  mapear,
  normalizarData,
  normalizarHora,
  resumir,
  type LinhaToggl,
  type RegraMapeamento,
  type SessaoExistente,
} from "@/lib/domain/toggl";
import { TOTAIS_POR_PROJETO, TOTAL_MINUTOS } from "../fixtures/linha-de-base-2026";

// ---------------------------------------------------------------------------
// Leitura tolerante
// ---------------------------------------------------------------------------

describe("o CSV é dado hostil", () => {
  it("tira o BOM sem estragar o resto", () => {
    expect(limparBOM("﻿Project,Duration")).toBe("Project,Duration");
    expect(limparBOM("Project,Duration")).toBe("Project,Duration");
  });

  it("descobre o separador pelo cabeçalho", () => {
    expect(detectarSeparador("Project,Description,Duration\na,b,c")).toBe(",");
    expect(detectarSeparador("Project;Description;Duration\na;b;c")).toBe(";");
    expect(detectarSeparador("Project\tDescription\tDuration")).toBe("\t");
  });

  it("reconhece o nome da coluna em inglês e em português, com acento ou sem", () => {
    expect(chaveDaColuna("Start date")).toBe("data");
    expect(chaveDaColuna("  DATA DE INÍCIO ")).toBe("data");
    expect(chaveDaColuna("Duration")).toBe("duracaoMin");
    expect(chaveDaColuna("Billable")).toBe("ignorar");
  });

  it("exige data e duração, e diz qual falta", () => {
    expect(colunasObrigatoriasFaltando(["Project", "Duration"])).toEqual(["Start date"]);
    expect(colunasObrigatoriasFaltando(["Start date"])).toEqual(["Duration"]);
    expect(colunasObrigatoriasFaltando(["Start date", "Duration", "Project"])).toEqual([]);
  });
});

describe("duração", () => {
  it("converte HH:MM:SS arredondando para o minuto", () => {
    expect(duracaoParaMinutos("32:20:45")).toBe(1941);
    expect(duracaoParaMinutos("0:53:19")).toBe(53);
    expect(duracaoParaMinutos("1:30:00")).toBe(90);
  });

  it("aceita HH:MM e segundos puros", () => {
    expect(duracaoParaMinutos("1:30")).toBe(90);
    expect(duracaoParaMinutos("3600")).toBe(60);
  });

  it("sessão de poucos segundos vira 1 minuto, não zero", () => {
    expect(duracaoParaMinutos("0:00:20")).toBe(1);
  });

  it("duração zerada ou ilegível devolve null", () => {
    expect(duracaoParaMinutos("0:00:00")).toBeNull();
    expect(duracaoParaMinutos("")).toBeNull();
    expect(duracaoParaMinutos("abc")).toBeNull();
  });
});

describe("data e hora", () => {
  it("aceita ISO e o formato brasileiro", () => {
    expect(normalizarData("2026-09-07")).toBe("2026-09-07");
    expect(normalizarData("07/09/2026")).toBe("2026-09-07");
    expect(normalizarData("sete de setembro")).toBeNull();
  });

  it("normaliza a hora e recusa hora impossível", () => {
    expect(normalizarHora("08:30:00")).toBe("08:30");
    expect(normalizarHora("8:05")).toBe("08:05");
    expect(normalizarHora("99:00")).toBeNull();
    expect(normalizarHora("")).toBeNull();
  });
});

describe("lerLinhas", () => {
  const registro = {
    Project: "Imersão Inglês",
    Description: "Netflix",
    Tags: "trânsito",
    "Start date": "2026-09-07",
    "Start time": "08:00:00",
    Duration: "1:00:00",
    Billable: "No",
  };

  it("mapeia as colunas conhecidas e ignora as outras", () => {
    const [linha] = lerLinhas([registro]);
    expect(linha).toMatchObject({
      project: "Imersão Inglês",
      description: "Netflix",
      data: "2026-09-07",
      horaInicio: "08:00",
      duracaoMin: 60,
      erro: null,
    });
  });

  it("numera a linha como a usuária vê no arquivo", () => {
    const linhas = lerLinhas([registro, registro]);
    expect(linhas.map((l) => l.numero)).toEqual([2, 3]);
  });

  it("linha sem data é marcada, não descartada nem lançada", () => {
    const [linha] = lerLinhas([{ ...registro, "Start date": "" }]);
    expect(linha.erro).toContain("Data");
  });

  it("linha sem duração é marcada", () => {
    const [linha] = lerLinhas([{ ...registro, Duration: "0:00:00" }]);
    expect(linha.erro).toContain("Duração");
  });

  it("coluna ausente não quebra: vira string vazia", () => {
    const [linha] = lerLinhas([{ "Start date": "2026-09-07", Duration: "0:30:00" }]);
    expect(linha.project).toBe("");
    expect(linha.erro).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Mapeamento
// ---------------------------------------------------------------------------

function regra(over: Partial<RegraMapeamento>): RegraMapeamento {
  return {
    id: Math.random().toString(36),
    ordem: 0,
    campo: "project",
    operador: "contem",
    valor: "",
    saidaIdioma: null,
    saidaAtividade: null,
    saidaPilar: null,
    saidaTempo: null,
    ativa: true,
    ...over,
  };
}

function linha(over: Partial<LinhaToggl> = {}): LinhaToggl {
  return {
    numero: 2,
    project: "Imersão Inglês",
    description: "Netflix",
    tags: "",
    client: "",
    task: "",
    data: "2026-09-07",
    horaInicio: "08:00",
    duracaoMin: 60,
    erro: null,
    ...over,
  };
}

describe("RN-1002 — motor de mapeamento", () => {
  it("casa sem acento e sem caixa", () => {
    const r = [regra({ campo: "project", valor: "ingles", saidaIdioma: "en" })];
    expect(aplicarRegras(linha(), r).idiomaId).toBe("en");
  });

  it("a última regra que casa vence", () => {
    const r = [
      regra({ ordem: 1, valor: "Imersão", saidaAtividade: "serie_filme" }),
      regra({ ordem: 2, campo: "description", valor: "podcast", saidaAtividade: "podcast" }),
    ];
    expect(aplicarRegras(linha({ description: "podcast da manhã" }), r).atividade).toBe("podcast");
  });

  it("regra desativada não conta", () => {
    const r = [regra({ valor: "ingles", saidaIdioma: "en", ativa: false })];
    expect(aplicarRegras(linha(), r).idiomaId).toBeNull();
  });

  it("saída vazia não sobrescreve o que já foi decidido", () => {
    const r = [
      regra({ ordem: 1, valor: "Imersão", saidaIdioma: "en", saidaAtividade: "serie_filme" }),
      regra({ ordem: 2, campo: "description", valor: "Netflix" }),
    ];
    const saida = aplicarRegras(linha(), r);
    expect(saida.idiomaId).toBe("en");
    expect(saida.atividade).toBe("serie_filme");
  });

  it("regex inválida não derruba a importação", () => {
    const r = [regra({ operador: "regex", valor: "[", saidaIdioma: "en" })];
    expect(aplicarRegras(linha(), r).idiomaId).toBeNull();
  });

  it("regex válida funciona", () => {
    const r = [regra({ operador: "regex", valor: "^Imers", saidaIdioma: "en" })];
    expect(aplicarRegras(linha(), r).idiomaId).toBe("en");
  });

  it("sem regra de idioma ou atividade, a linha pede revisão", () => {
    expect(mapear(linha(), []).precisaRevisao).toBe(true);
  });

  it("a classificação do domínio vale também no import: imersão não vira ativo", () => {
    const r = [
      regra({ valor: "Imersão", saidaAtividade: "serie_filme", saidaIdioma: "en" }),
      regra({ ordem: 2, valor: "Imersão", saidaPilar: "fala" }),
    ];
    const m = mapear(linha(), r);
    expect(m.categoria).toBe("imersao");
    expect(m.pilar).toBeNull();
    expect(m.producao).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RN-1004 — deduplicação
// ---------------------------------------------------------------------------

describe("RN-1004 — deduplicação", () => {
  const regras = [
    regra({ ordem: 1, valor: "Inglês", saidaIdioma: "en" }),
    regra({ ordem: 2, valor: "Imersão", saidaAtividade: "serie_filme" }),
  ];

  it("a chave é estável e distingue linhas diferentes", () => {
    expect(chaveToggl(linha())).toBe(chaveToggl(linha()));
    expect(chaveToggl(linha())).not.toBe(chaveToggl(linha({ duracaoMin: 61 })));
    expect(chaveToggl(linha())).not.toBe(chaveToggl(linha({ description: "outro" })));
  });

  it("linha já importada antes é duplicada", () => {
    const existente: SessaoExistente = {
      id: "s1",
      data: "2026-09-07",
      idiomaId: "en",
      atividade: "serie_filme",
      duracaoMin: 60,
      origem: "toggl",
      chaveToggl: chaveToggl(linha()),
    };
    const r = classificarLinhas([linha()], regras, [existente]);
    expect(r[0].classificacao).toBe("duplicada");
  });

  it("linha repetida dentro do próprio arquivo entra uma vez só", () => {
    const r = classificarLinhas([linha(), linha()], regras, []);
    expect(r.map((l) => l.classificacao)).toEqual(["nova", "duplicada"]);
  });

  it("sessão manual parecida vira conflito, não duplicata", () => {
    const manual: SessaoExistente = {
      id: "m1",
      data: "2026-09-07",
      idiomaId: "en",
      atividade: "serie_filme",
      duracaoMin: 58,
      origem: "manual",
      chaveToggl: null,
    };
    const r = classificarLinhas([linha()], regras, [manual]);
    expect(r[0].classificacao).toBe("conflito");
    expect(r[0].conflitoCom).toBe("m1");
  });

  it("diferença maior que cinco minutos não é conflito", () => {
    const manual: SessaoExistente = {
      id: "m1",
      data: "2026-09-07",
      idiomaId: "en",
      atividade: "serie_filme",
      duracaoMin: 40,
      origem: "manual",
      chaveToggl: null,
    };
    expect(classificarLinhas([linha()], regras, [manual])[0].classificacao).toBe("nova");
  });

  it("linha inválida é classificada como inválida antes de qualquer outra coisa", () => {
    const r = classificarLinhas([linha({ data: null, erro: "Data ausente." })], regras, []);
    expect(r[0].classificacao).toBe("invalida");
  });

  it("sem regra de idioma, a linha pede revisão em vez de entrar torta", () => {
    const r = classificarLinhas([linha()], [regras[1]], []);
    expect(r[0].classificacao).toBe("revisar");
  });
});

describe("resumo da importação", () => {
  it("conta cada estado e mede o intervalo", () => {
    const regras = [
      regra({ ordem: 1, valor: "Inglês", saidaIdioma: "en" }),
      regra({ ordem: 2, valor: "Imersão", saidaAtividade: "serie_filme" }),
    ];
    const linhas = classificarLinhas(
      [
        linha({ data: "2026-01-05" }),
        linha({ data: "2026-09-30", duracaoMin: 30 }),
        linha({ data: null, erro: "Data ausente." }),
      ],
      regras,
      [],
    );
    const r = resumir(linhas);
    expect(r).toMatchObject({ total: 3, novas: 2, invalidas: 1 });
    expect(r.minutos).toBe(90);
    expect(r.intervalo).toEqual({ inicio: "2026-01-05", fim: "2026-09-30" });
  });

  it("arquivo sem nenhuma data válida não inventa intervalo", () => {
    const r = resumir(classificarLinhas([linha({ data: null, erro: "x" })], [], []));
    expect(r.intervalo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Critério de pronto da fase: o export real de 2026
// ---------------------------------------------------------------------------

describe("o CSV de 2026 reproduz o diagnóstico conhecido", () => {
  const IDIOMAS: Record<string, string> = { ingles: "en", espanhol: "es", frances: "fr" };

  const REGRAS: RegraMapeamento[] = [
    regra({ ordem: 10, valor: "Inglês", saidaIdioma: "en" }),
    regra({ ordem: 11, valor: "Espanhol", saidaIdioma: "es" }),
    regra({ ordem: 12, valor: "Francês", saidaIdioma: "fr" }),
    regra({ ordem: 20, valor: "Imersão", saidaAtividade: "serie_filme" }),
    regra({ ordem: 21, valor: "Flashcards", saidaAtividade: "flashcards" }),
    regra({ ordem: 22, valor: "Estudo ativo", saidaAtividade: "gramatica" }),
  ];

  const NOMES: Record<string, string> = {
    serie_filme: "Imersão",
    flashcards: "Flashcards",
    gramatica: "Estudo ativo",
  };

  /** Monta um CSV com uma linha por projeto, como o relatório detalhado. */
  const registros = TOTAIS_POR_PROJETO.map((p, i) => {
    const idioma = p.idiomaId === "ingles" ? "Inglês" : p.idiomaId === "espanhol" ? "Espanhol" : "Francês";
    const h = Math.floor(p.minutos / 60);
    const m = p.minutos % 60;
    return {
      Project: `${NOMES[p.atividade]} ${idioma}`,
      Description: `sessão ${i}`,
      Tags: "",
      "Start date": "2026-01-05",
      "Start time": "08:00:00",
      Duration: `${h}:${String(m).padStart(2, "0")}:00`,
    };
  });

  it("as nove linhas do relatório são todas classificadas como novas", () => {
    const linhas = classificarLinhas(lerLinhas(registros), REGRAS, []);
    expect(linhas.every((l) => l.classificacao === "nova")).toBe(true);
  });

  it("o total importado bate com 86h26 arredondado por projeto", () => {
    const linhas = classificarLinhas(lerLinhas(registros), REGRAS, []);
    expect(resumir(linhas).minutos).toBe(TOTAL_MINUTOS);
  });

  it("cada projeto cai no idioma e na categoria certos", () => {
    const linhas = classificarLinhas(lerLinhas(registros), REGRAS, []);
    const imersao = linhas.filter((l) => l.categoria === "imersao");
    const flashcards = linhas.filter((l) => l.atividade === "flashcards");

    expect(imersao).toHaveLength(3);
    expect(flashcards).toHaveLength(3);
    expect(linhas.filter((l) => l.idiomaId === IDIOMAS.ingles)).toHaveLength(3);
    expect(linhas.every((l) => l.idiomaId !== null)).toBe(true);
  });

  it("reimportar o mesmo arquivo não cria nada", () => {
    const primeira = classificarLinhas(lerLinhas(registros), REGRAS, []);
    const existentes: SessaoExistente[] = primeira.map((l, i) => ({
      id: `s${i}`,
      data: l.linha.data as string,
      idiomaId: l.idiomaId as string,
      atividade: l.atividade,
      duracaoMin: l.linha.duracaoMin,
      origem: "toggl" as const,
      chaveToggl: l.chave,
    }));

    const segunda = classificarLinhas(lerLinhas(registros), REGRAS, existentes);
    expect(segunda.every((l) => l.classificacao === "duplicada")).toBe(true);
    expect(resumir(segunda).novas).toBe(0);
  });
});
