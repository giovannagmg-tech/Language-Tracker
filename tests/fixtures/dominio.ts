import { classificar } from "@/lib/domain/classificacao";
import type { DefinicaoMarcha, RevisaoDominio, SessaoDominio } from "@/lib/domain/modelos";
import type { Atividade } from "@/lib/domain/tipos";

let contador = 0;

/** Sessão coerente com a classificação real, para não escrever fixture inválida. */
export function sessao(
  data: string,
  atividade: Atividade,
  duracaoMin = 30,
  extra: Partial<SessaoDominio> = {},
): SessaoDominio {
  contador += 1;
  const c = classificar({ atividade, duracaoMin, minutosFala: extra.minutosFala });
  return {
    id: `s${contador}`,
    data,
    idiomaId: extra.idiomaId ?? "ingles",
    duracaoMin,
    categoria: c.categoria,
    pilar: extra.pilar !== undefined ? extra.pilar : c.pilar,
    atividade,
    tempo: extra.tempo ?? c.tempo,
    minutosFala: c.minutosFala,
    producao: c.producao,
    violouRegra5: extra.violouRegra5 ?? false,
  };
}

export function revisao(data: string, idiomaId = "ingles", revisou = true): RevisaoDominio {
  return { data, idiomaId, revisou };
}

/** As três marchas como o bootstrap as cria no banco. */
export const MARCHAS: DefinicaoMarcha[] = [
  {
    numero: 1,
    nome: "Sobrevivência",
    descricao: "~15 min/dia",
    tarefas: [
      {
        chave: "flashcards",
        titulo: "Revisar flashcards",
        dias_semana: [1, 2, 3, 4, 5, 6, 7],
        escopo: "dia",
        criterio: { tipo: "check_flashcards" },
        opcional: false,
      },
      {
        chave: "fala_1min",
        titulo: "1 minuto de fala",
        dias_semana: [1, 2, 3, 4, 5, 6, 7],
        escopo: "dia",
        criterio: { tipo: "minutos_fala", min: 1 },
        opcional: false,
      },
      {
        chave: "imersao_maos_ocupadas",
        titulo: "Imersão de mãos ocupadas",
        dias_semana: [1, 2, 3, 4, 5, 6, 7],
        escopo: "dia",
        criterio: {
          tipo: "minutos_categoria_tempo",
          categoria: "imersao",
          tempo: "maos_ocupadas",
          min: 1,
        },
        opcional: false,
      },
    ],
  },
  {
    numero: 2,
    nome: "Cruzeiro",
    descricao: "~5 h/semana",
    tarefas: [
      {
        chave: "bloco_manha",
        titulo: "Bloco de 40 min pela manhã",
        dias_semana: [1, 2, 3, 4],
        escopo: "dia",
        criterio: {
          tipo: "minutos_categoria_tempo",
          categoria: "ativo",
          tempo: "cadeira",
          min: 40,
        },
        opcional: false,
      },
      {
        chave: "clube",
        titulo: "Clube de conversação",
        dias_semana: [],
        escopo: "semana",
        criterio: { tipo: "sessao_atividade", atividade: "conversacao", min: 1 },
        opcional: false,
      },
      {
        chave: "audio_grupo",
        titulo: "1 áudio no grupo",
        dias_semana: [],
        escopo: "semana",
        criterio: { tipo: "sessao_atividade", atividade: "audio_grupo", min: 1 },
        opcional: false,
      },
      {
        chave: "sexta_pronuncia",
        titulo: "Sexta de pronúncia (25 min)",
        dias_semana: [5],
        escopo: "dia",
        criterio: { tipo: "minutos_pilar", pilar: "pronuncia", min: 25 },
        opcional: false,
      },
    ],
  },
  {
    numero: 3,
    nome: "Turbo",
    descricao: "8–10 h/semana",
    tarefas: [
      {
        chave: "aula_extra",
        titulo: "Aula particular ou conversação extra",
        dias_semana: [],
        escopo: "semana",
        criterio: { tipo: "sessao_atividade", atividade: "aula", min: 1 },
        opcional: false,
      },
      {
        chave: "sabado_escrita",
        titulo: "Bloco de sábado: revisão + escrita",
        dias_semana: [6],
        escopo: "dia",
        criterio: { tipo: "sessao_atividade", atividade: "escrita", min: 1 },
        opcional: false,
      },
      {
        chave: "instagram",
        titulo: "Conteúdo no Instagram",
        dias_semana: [],
        escopo: "semana",
        criterio: { tipo: "sessao_atividade", atividade: "conteudo_instagram", min: 1 },
        opcional: true,
      },
    ],
  },
];
