import type { DataISO } from "./datas";
import type { Lacuna } from "./lacunas";
import type { Composicao, FatiaPilar } from "./metrics";
import { ROTULO_PILAR } from "./tipos";

/**
 * RN-712. O bloco de texto que diz, em português, qual é o padrão do período.
 * As condições são avaliadas em ordem; exibem-se as três primeiras que dispararem.
 * `alvo` é a âncora do link "ver" para o bloco que gerou a frase.
 */
export type Diagnostico = { chave: string; texto: string; alvo: string };

export type ContextoDiagnostico = {
  composicao: Composicao;
  minutosProducao: number;
  sessoesProducao: number;
  concentracaoTop3: number;
  lacuna: Lacuna;
  mediaFalaSemanal: number;
  mediaFlashSemanal: number;
  maiorDesvioPilar: FatiaPilar | null;
  pctCadeira: number;
  diasComRegistro: number;
  diasNoPeriodo: number;
  metaPctAtivo: number;
  metaFalaSemana: number;
  metaFlashSemana: number;
  limiarConcentracao: number;
  limiarDesvioPilar: number;
  lacunaAlerta: number;
};

const p1 = (v: number) => (v * 100).toFixed(1).replace(".", ",");
const p0 = (v: number) => Math.round(v * 100);
const n0 = (v: number) => Math.round(v);

function dataCurta(d: DataISO): string {
  const [, mes, dia] = d.split("-");
  return `${dia}/${mes}`;
}

export function diagnosticar(ctx: ContextoDiagnostico): Diagnostico[] {
  const c = ctx.composicao;
  const achados: Diagnostico[] = [];

  if (c.total > 0 && c.pctImersao >= 0.6) {
    achados.push({
      chave: "passivo",
      alvo: "composicao",
      texto: `${p1(c.pctImersao)}% do seu tempo foi consumo passivo. Estudo ativo ficou em ${p1(c.pctAtivo)}% — a meta é ${p0(ctx.metaPctAtivo)}%.`,
    });
  }

  if (c.total > 0 && ctx.minutosProducao / c.total < 0.1) {
    achados.push({
      chave: "producao",
      alvo: "composicao",
      texto: `Produção foi ${p1(ctx.minutosProducao / c.total)}% do tempo, em ${ctx.sessoesProducao} ${ctx.sessoesProducao === 1 ? "sessão" : "sessões"}. É o gargalo do método.`,
    });
  }

  if (ctx.concentracaoTop3 >= ctx.limiarConcentracao) {
    achados.push({
      chave: "concentracao",
      alvo: "serie",
      texto: `Seu período inteiro cabe em três dias: eles somam ${p0(ctx.concentracaoTop3)}% das horas.`,
    });
  }

  if (ctx.lacuna.dias >= Math.max(5, ctx.lacunaAlerta)) {
    achados.push({
      chave: "lacuna",
      alvo: "serie",
      texto: `Maior lacuna: ${ctx.lacuna.dias} dias, de ${dataCurta(ctx.lacuna.inicio)} a ${dataCurta(ctx.lacuna.fim)}.`,
    });
  }

  if (ctx.mediaFalaSemanal < ctx.metaFalaSemana / 2) {
    achados.push({
      chave: "fala",
      alvo: "fala",
      texto: `Você falou ${n0(ctx.mediaFalaSemanal)} min por semana, na média. A meta é ${ctx.metaFalaSemana}.`,
    });
  }

  if (ctx.mediaFlashSemanal < 3) {
    achados.push({
      chave: "flashcards",
      alvo: "flashcards",
      texto: `Flashcards em ${ctx.mediaFlashSemanal.toFixed(1).replace(".", ",")} dias por semana. A meta é ${ctx.metaFlashSemana}.`,
    });
  }

  const desvio = ctx.maiorDesvioPilar;
  if (desvio && Math.abs(desvio.desvio) >= ctx.limiarDesvioPilar) {
    achados.push({
      chave: "pilar",
      alvo: "pilares",
      texto: `${ROTULO_PILAR[desvio.pilar]} está em ${p0(desvio.real)}% do estudo ativo contra ${p0(desvio.alvo)}% de alvo.`,
    });
  }

  if (c.total > 0 && ctx.pctCadeira >= 0.8) {
    achados.push({
      chave: "tempos",
      alvo: "tempos",
      texto: `Quase tudo aconteceu na cadeira. Mãos livres e ocupadas somaram ${p0(1 - ctx.pctCadeira)}% — é aí que mora o tempo que você acha que não tem.`,
    });
  }

  if (ctx.diasNoPeriodo > 0 && ctx.diasComRegistro / ctx.diasNoPeriodo < 0.5) {
    achados.push({
      chave: "cobertura",
      alvo: "serie",
      texto: `Registro em ${ctx.diasComRegistro} de ${ctx.diasNoPeriodo} dias (${p0(ctx.diasComRegistro / ctx.diasNoPeriodo)}%).`,
    });
  }

  if (achados.length === 0) {
    return [
      {
        chave: "ok",
        alvo: "composicao",
        texto: `Período dentro do método: ${p1(c.pctAtivo)}% ativo, ${n0(ctx.mediaFalaSemanal)} min de fala por semana, maior lacuna de ${ctx.lacuna.dias} dias.`,
      },
    ];
  }

  return achados.slice(0, 3);
}
