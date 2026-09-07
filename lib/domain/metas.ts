/**
 * RN-505 a RN-507. Uma meta é sempre a mesma coisa: um valor de partida, um
 * alvo, uma direção e o valor de agora. O resto é apresentação.
 */

export type DirecaoMeta = "maior_melhor" | "menor_melhor";
export type CorMeta = "longo_prazo" | "mensal" | "semanal";

export type ProgressoMeta = {
  atual: number;
  base: number;
  alvo: number;
  direcao: DirecaoMeta;
  /** 0 a 1: quanto do caminho entre a base e o alvo já foi andado. */
  progresso: number;
  atingida: boolean;
  faltam: number;
  estado: "atingida" | "perto" | "longe";
};

export function progressoMeta(entrada: {
  atual: number;
  base: number;
  alvo: number;
  direcao?: DirecaoMeta;
}): ProgressoMeta {
  const direcao = entrada.direcao ?? "maior_melhor";
  const { atual, base, alvo } = entrada;

  const atingida = direcao === "maior_melhor" ? atual >= alvo : atual <= alvo;

  const vao = alvo - base;
  const andado = atual - base;
  const progresso = vao === 0 ? (atingida ? 1 : 0) : Math.min(1, Math.max(0, andado / vao));

  const faltam = atingida ? 0 : Math.abs(alvo - atual);

  return {
    atual,
    base,
    alvo,
    direcao,
    progresso,
    atingida,
    faltam,
    estado: atingida ? "atingida" : progresso >= 0.6 ? "perto" : "longe",
  };
}

/** RN-507. Verde ao atingir, amarelo a partir de 60% do caminho, laranja abaixo. */
export function corDoEstado(estado: ProgressoMeta["estado"]): string {
  if (estado === "atingida") return "var(--sucesso)";
  if (estado === "perto") return "var(--atencao)";
  return "var(--meta-longo)";
}

export function corDaMeta(cor: CorMeta): { forte: string; fraca: string } {
  if (cor === "mensal") return { forte: "var(--meta-mensal)", fraca: "var(--meta-mensal-fraco)" };
  if (cor === "semanal") return { forte: "var(--meta-semanal)", fraca: "var(--meta-semanal-fraco)" };
  return { forte: "var(--meta-longo)", fraca: "var(--meta-longo-fraco)" };
}

/**
 * Meta de palavras no estilo Caiz: a do dia é só o degrau; o que interessa é
 * o acumulado rumo à próxima camada e o ritmo que ele implica.
 */
export function progressoPalavrasDoDia(feitoHoje: number, metaDia: number): ProgressoMeta {
  return progressoMeta({ atual: feitoHoje, base: 0, alvo: Math.max(1, metaDia) });
}
