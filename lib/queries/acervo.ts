import "server-only";
import { cache } from "react";
import {
  CORES_CATEGORIA,
  ROTULO_CATEGORIA,
  type DefinicaoConquista,
} from "@/lib/domain/conquistas";
import { dias, hoje as hojeLocal } from "@/lib/domain/datas";
import type { CategoriaConquista, Pilar, TipoMaterial } from "@/lib/domain/tipos";
import { supabaseServidor } from "@/lib/supabase/server";
import type { IdiomaResumo } from "./hoje";

// ---------------------------------------------------------------------------
// Conquistas
// ---------------------------------------------------------------------------

export type ConquistaNaTela = {
  chave: string;
  definicao: DefinicaoConquista;
  idioma: IdiomaResumo | null;
  conquistada: boolean;
  progressoAtual: number;
  progressoAlvo: number;
  conquistadaEm: string | null;
  vezes: number;
  cores: { bg: string; forte: string };
  rotuloCategoria: string;
};

export type EstadoConquistas = {
  itens: ConquistaNaTela[];
  total: number;
  conquistadas: number;
  porCategoria: { categoria: CategoriaConquista; rotulo: string; total: number; ganhas: number }[];
};

export const carregarConquistas = cache(async function carregarConquistas(): Promise<EstadoConquistas> {
  const supabase = await supabaseServidor();

  const [{ data: catalogoRaw }, { data: estadosRaw }, { data: idiomasRaw }] = await Promise.all([
    supabase.from("conquistas").select("*").order("ordem"),
    supabase.from("conquista_estado").select("*"),
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
  ]);

  const idiomas = idiomasRaw ?? [];
  const porChave = new Map(
    (estadosRaw ?? []).map((e) => [`${e.conquista_codigo}:${e.idioma_id ?? "global"}`, e]),
  );

  const itens: ConquistaNaTela[] = [];

  for (const c of catalogoRaw ?? []) {
    const definicao: DefinicaoConquista = {
      codigo: c.codigo,
      nome: c.nome,
      categoria: c.categoria,
      criterioTexto: c.criterio_texto,
      criterioChave: c.criterio_chave,
      parametros: (c.parametros ?? {}) as Record<string, number | string>,
      escopo: c.escopo,
      repetivel: c.repetivel,
      janelaRepeticao: c.janela_repeticao,
      ordem: c.ordem,
    };

    const alvos = definicao.escopo === "global" ? [null] : idiomas;

    for (const alvo of alvos) {
      const idiomaId = alvo?.id ?? null;
      const estado = porChave.get(`${c.codigo}:${idiomaId ?? "global"}`);
      itens.push({
        chave: `${c.codigo}:${idiomaId ?? "global"}`,
        definicao,
        idioma: alvo,
        conquistada: estado?.estado === "conquistada",
        progressoAtual: Number(estado?.progresso_atual ?? 0),
        progressoAlvo: Number(estado?.progresso_alvo ?? 1),
        conquistadaEm: estado?.conquistada_em ?? null,
        vezes: estado?.vezes ?? 0,
        cores: CORES_CATEGORIA[c.categoria as CategoriaConquista],
        rotuloCategoria: ROTULO_CATEGORIA[c.categoria as CategoriaConquista],
      });
    }
  }

  const categorias: CategoriaConquista[] = [
    "producao",
    "recuperacao",
    "metodo",
    "camada",
    "consistencia",
  ];

  return {
    itens,
    total: itens.length,
    conquistadas: itens.filter((i) => i.conquistada).length,
    porCategoria: categorias.map((categoria) => {
      const doTipo = itens.filter((i) => i.definicao.categoria === categoria);
      return {
        categoria,
        rotulo: ROTULO_CATEGORIA[categoria],
        total: doTipo.length,
        ganhas: doTipo.filter((i) => i.conquistada).length,
      };
    }),
  };
});

// ---------------------------------------------------------------------------
// Materiais
// ---------------------------------------------------------------------------

export type MaterialNaTela = {
  id: string;
  idioma: IdiomaResumo;
  tipo: TipoMaterial;
  titulo: string;
  principal: boolean;
  unidade: string;
  posicaoAtual: number;
  total: number | null;
  pct: number | null;
  ultimaSessaoEm: string | null;
  diasParado: number | null;
  url: string | null;
};

export type EstadoMateriais = {
  hoje: string;
  idiomas: IdiomaResumo[];
  principais: (MaterialNaTela | { idioma: IdiomaResumo; vazio: true })[];
  secundarios: MaterialNaTela[];
};

export const carregarMateriais = cache(async function carregarMateriais(): Promise<EstadoMateriais> {
  const supabase = await supabaseServidor();
  const hoje = hojeLocal();

  const [{ data: idiomasRaw }, { data: materiaisRaw }] = await Promise.all([
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    supabase
      .from("materiais")
      .select("id, idioma_id, tipo, titulo, principal, unidade, posicao_atual, total, ultima_sessao_em, url")
      .eq("ativo", true)
      .order("titulo"),
  ]);

  const idiomas = idiomasRaw ?? [];
  const mapear = (m: NonNullable<typeof materiaisRaw>[number]): MaterialNaTela => {
    const idioma = idiomas.find((i) => i.id === m.idioma_id);
    return {
      id: m.id,
      idioma: idioma ?? { id: m.idioma_id, slug: "", nome: "—", bandeira: "", cor: "" },
      tipo: m.tipo as TipoMaterial,
      titulo: m.titulo,
      principal: m.principal,
      unidade: m.unidade,
      posicaoAtual: m.posicao_atual,
      total: m.total,
      pct: m.total ? Math.min(1, m.posicao_atual / m.total) : null,
      ultimaSessaoEm: m.ultima_sessao_em,
      diasParado: m.ultima_sessao_em ? dias(m.ultima_sessao_em, hoje) : null,
      url: m.url,
    };
  };

  const todos = (materiaisRaw ?? []).map(mapear);

  return {
    hoje,
    idiomas,
    principais: idiomas.map((idioma) => {
      const principal = todos.find((m) => m.principal && m.idioma.id === idioma.id);
      return principal ?? { idioma, vazio: true as const };
    }),
    secundarios: todos.filter((m) => !m.principal),
  };
});

// ---------------------------------------------------------------------------
// Recursos
// ---------------------------------------------------------------------------

export type RecursoNaTela = {
  id: string;
  titulo: string;
  url: string;
  dominio: string;
  tipo: string;
  idiomas: string[];
  pilares: Pilar[];
  favorito: boolean;
  nota: string | null;
};

export type EstadoRecursos = {
  idiomas: IdiomaResumo[];
  recursos: RecursoNaTela[];
};

export const carregarRecursos = cache(async function carregarRecursos(): Promise<EstadoRecursos> {
  const supabase = await supabaseServidor();

  const [{ data: idiomasRaw }, { data: recursosRaw }] = await Promise.all([
    supabase.from("idiomas").select("id, slug, nome, bandeira, cor").eq("ativo", true).order("ordem"),
    supabase
      .from("recursos")
      .select("id, titulo, url, tipo, idiomas, pilares, favorito, nota")
      .order("favorito", { ascending: false })
      .order("titulo"),
  ]);

  return {
    idiomas: idiomasRaw ?? [],
    recursos: (recursosRaw ?? []).map((r) => {
      let dominio = r.url;
      try {
        dominio = new URL(r.url).hostname.replace(/^www\./, "");
      } catch {
        // URL malformada não derruba a tela: mostra a string como está.
      }
      return {
        id: r.id,
        titulo: r.titulo,
        url: r.url,
        dominio,
        tipo: r.tipo,
        idiomas: r.idiomas ?? [],
        pilares: (r.pilares ?? []) as Pilar[],
        favorito: r.favorito,
        nota: r.nota,
      };
    }),
  };
});
