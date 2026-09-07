import { z } from "zod";
import { DURACAO_MAX, DURACAO_MIN } from "@/lib/domain/classificacao";
import { ATIVIDADES, PILARES, TEMPOS, VIAS_REGISTRO } from "@/lib/domain/tipos";

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data precisa estar em AAAA-MM-DD.");

/**
 * Tudo que entra passa por aqui. O schema é permissivo de propósito nos campos
 * derivados: quem decide categoria, pilar e produção é `classificar()` no
 * servidor, não o formulário (RN-103).
 */
export const entradaSessao = z.object({
  idiomaId: z.string().uuid("Escolha um idioma."),
  data: dataISO,
  horaInicio: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullish(),
  duracaoMin: z.coerce
    .number()
    .int()
    .min(DURACAO_MIN, `Mínimo de ${DURACAO_MIN} minuto.`)
    .max(DURACAO_MAX, `Máximo de ${DURACAO_MAX} minutos.`),
  atividade: z.enum(ATIVIDADES),
  pilar: z.enum(PILARES).nullish(),
  tempo: z.enum(TEMPOS).optional(),
  categoria: z.enum(["ativo", "imersao"]).optional(),
  palavrasNovas: z.coerce.number().int().min(0).max(500).default(0),
  minutosFala: z.coerce.number().int().min(0).max(DURACAO_MAX).optional(),
  pontosGramaticais: z.coerce.number().int().min(0).max(50).default(0),
  frasesProduzidas: z.coerce.number().int().min(0).max(200).default(0),
  nota: z.string().max(500).nullish(),
  via: z.enum(VIAS_REGISTRO).default("formulario"),
  /** A usuária viu o aviso da regra 5 e escolheu salvar assim mesmo. */
  confirmouRegra5: z.coerce.boolean().default(false),
  /** Telemetria local: quanto tempo levou do abrir ao salvar. */
  duracaoRegistroMs: z.coerce.number().int().min(0).optional(),
});

export type EntradaSessao = z.infer<typeof entradaSessao>;

export const entradaRevisao = z.object({
  idiomaId: z.string().uuid(),
  data: dataISO,
});
