import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICONE_POR_CODIGO, iconeDaConquista } from "@/components/conquistas/icones";

/**
 * O catálogo de conquistas mora no seed, não no código. Sem esta amarra,
 * conquista nova nasce com o troféu genérico e ninguém percebe.
 */
const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8");
const codigos = [...seed.matchAll(/^\('([A-Z]{3}-\d{2})'/gm)].map((m) => m[1]);

describe("ícone por conquista", () => {
  it("o seed foi lido de verdade", () => {
    expect(codigos.length).toBeGreaterThan(40);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("toda conquista do catálogo tem ícone próprio", () => {
    const semIcone = codigos.filter((c) => !(c in ICONE_POR_CODIGO));
    expect(semIcone).toEqual([]);
  });

  it("nenhum ícone sobrando apontando para conquista que não existe", () => {
    const doCatalogo = new Set(codigos);
    expect(Object.keys(ICONE_POR_CODIGO).filter((c) => !doCatalogo.has(c))).toEqual([]);
  });

  it("os ícones são distintos — repetir derrota o propósito", () => {
    const usados = Object.values(ICONE_POR_CODIGO);
    expect(new Set(usados).size).toBe(usados.length);
  });

  it("código desconhecido cai no troféu em vez de quebrar a tela", () => {
    expect(iconeDaConquista("XXX-99")).toBeDefined();
  });
});
