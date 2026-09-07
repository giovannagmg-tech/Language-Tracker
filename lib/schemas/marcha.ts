import { z } from "zod";
import { ATIVIDADES, PILARES, TEMPOS } from "@/lib/domain/tipos";

/** O jsonb de `marchas_def.tarefas` é dado editável — entra validado. */
const criterio = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("check_flashcards") }),
  z.object({ tipo: z.literal("minutos_fala"), min: z.number().int().positive() }),
  z.object({
    tipo: z.literal("sessao_atividade"),
    atividade: z.enum(ATIVIDADES),
    min: z.number().int().positive(),
  }),
  z.object({
    tipo: z.literal("minutos_categoria_tempo"),
    categoria: z.enum(["ativo", "imersao"]),
    tempo: z.enum(TEMPOS),
    min: z.number().int().positive(),
  }),
  z.object({
    tipo: z.literal("minutos_pilar"),
    pilar: z.enum(PILARES),
    min: z.number().int().positive(),
  }),
  z.object({ tipo: z.literal("item_revisao"), min: z.number().int().positive() }),
]);

export const tarefaDeMarcha = z.object({
  chave: z.string(),
  titulo: z.string(),
  dias_semana: z.array(z.number().int().min(1).max(7)),
  escopo: z.enum(["dia", "semana"]),
  criterio,
  opcional: z.boolean().default(false),
});

export const tarefasDeMarcha = z.array(tarefaDeMarcha);
