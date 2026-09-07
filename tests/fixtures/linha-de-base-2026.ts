import { somaDias } from "@/lib/domain/datas";
import type { SessaoDominio } from "@/lib/domain/modelos";
import type { Atividade } from "@/lib/domain/tipos";
import { sessao } from "./dominio";

/**
 * O diagnóstico real do Toggl, jan–set/2026 (docs/09-linha-de-base-2026.md).
 * Se os indicadores não reproduzirem estes números, o dashboard está mentindo.
 *
 * As durações estão em minutos inteiros, arredondadas do relatório em segundos.
 * O erro de arredondamento é de até 30 s por projeto e não move nenhum
 * percentual na primeira casa decimal.
 */
export const TOTAIS_POR_PROJETO = [
  { idiomaId: "espanhol", atividade: "serie_filme" as Atividade, minutos: 1941 },
  { idiomaId: "ingles", atividade: "serie_filme" as Atividade, minutos: 1939 },
  { idiomaId: "ingles", atividade: "gramatica" as Atividade, minutos: 630 },
  { idiomaId: "ingles", atividade: "flashcards" as Atividade, minutos: 214 },
  { idiomaId: "frances", atividade: "gramatica" as Atividade, minutos: 132 },
  { idiomaId: "espanhol", atividade: "flashcards" as Atividade, minutos: 121 },
  { idiomaId: "frances", atividade: "serie_filme" as Atividade, minutos: 100 },
  { idiomaId: "espanhol", atividade: "gramatica" as Atividade, minutos: 54 },
  { idiomaId: "frances", atividade: "flashcards" as Atividade, minutos: 53 },
];

export const PERIODO_2026 = { inicio: "2026-01-01", fim: "2026-09-30" };
export const TOTAL_MINUTOS = 5184; // 86:23:14 arredondado por projeto
export const DIAS_COM_REGISTRO = 97;
export const MAIOR_LACUNA = 22;

/**
 * 97 datas entre 01/01 e 30/09, com uma lacuna de exatamente 22 dias em branco
 * e nenhuma outra maior que 2 — como no ano real.
 */
export function datasDeRegistro(): string[] {
  const intervalos: number[] = [];
  let tres = 59;
  let dois = 36;
  while (tres > 0 || dois > 0) {
    if (tres > 0) {
      intervalos.push(3);
      tres -= 1;
    }
    if (dois > 0) {
      intervalos.push(2);
      dois -= 1;
    }
  }
  intervalos.splice(40, 0, 23); // a lacuna de 22 dias em branco

  const datas = [PERIODO_2026.inicio];
  for (const passo of intervalos) {
    datas.push(somaDias(datas[datas.length - 1], passo));
  }
  return datas;
}

/** Distribui os minutos de um projeto pelas datas, em blocos inteiros. */
function distribuir(total: number, datas: string[]): number[] {
  const base = Math.floor(total / datas.length);
  const resto = total - base * datas.length;
  return datas.map((_, i) => base + (i < resto ? 1 : 0));
}

export function sessoesLinhaDeBase(): SessaoDominio[] {
  const datas = datasDeRegistro();
  const sessoes: SessaoDominio[] = [];

  for (const projeto of TOTAIS_POR_PROJETO) {
    const pedacos = distribuir(projeto.minutos, datas);
    pedacos.forEach((minutos, i) => {
      if (minutos <= 0) return;
      sessoes.push(
        sessao(datas[i], projeto.atividade, minutos, { idiomaId: projeto.idiomaId }),
      );
    });
  }

  return sessoes;
}
