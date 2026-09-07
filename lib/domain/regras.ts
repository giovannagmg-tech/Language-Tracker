import { diaDaSemana, type DataISO } from "./datas";
import type { Piso } from "./piso";
import type { EstadoSemaforo, Marcha } from "./tipos";

/**
 * RN-301 a RN-307. As seis regras invioláveis, avaliadas todo dia.
 * Toda regra em amarelo ou vermelho traz uma ação que resolve hoje —
 * alerta sem ação é ruído (princípio 8 do doc 01).
 */

export type AcaoRegra =
  | "registrar_um_minuto"
  | "marcar_revisao"
  | "agendar_clube"
  | "registrar_audio_grupo";

export type RegraAvaliada = {
  numero: 1 | 2 | 3 | 4 | 5 | 6;
  curto: string;
  titulo: string;
  estado: EstadoSemaforo;
  mensagem: string;
  acao: AcaoRegra | null;
  rotuloAcao: string | null;
};

export type ContextoRegras = {
  hoje: DataISO;
  hora: number;
  horaAperto: number;
  marchaAtiva: Marcha;
  emBrancoOntem: boolean;
  emBrancoHoje: boolean;
  piso: Piso;
  conversacaoNaSemana: boolean;
  clubeAgendado: boolean;
  audioNaSemana: boolean;
  violouRegra5Hoje: boolean;
};

function regra1(ctx: ContextoRegras): RegraAvaliada {
  let estado: EstadoSemaforo;
  let mensagem: string;

  if (!ctx.emBrancoHoje) {
    estado = "verde";
    mensagem = "O dia tem registro.";
  } else if (ctx.emBrancoOntem) {
    estado = "vermelho";
    mensagem = "Ontem foi em branco. Hoje não pode ser. Um minuto resolve.";
  } else if (ctx.hora >= ctx.horaAperto) {
    estado = "amarelo";
    mensagem = "O dia está em branco. Um minuto de fala e ele deixa de estar.";
  } else {
    estado = "cinza";
    mensagem = "Nada registrado ainda hoje.";
  }

  const cobra = estado === "vermelho" || estado === "amarelo";
  return {
    numero: 1,
    curto: "dois dias",
    titulo: "Nunca dois dias seguidos em branco",
    estado,
    mensagem,
    acao: cobra ? "registrar_um_minuto" : null,
    rotuloAcao: cobra ? "Registrar 1 minuto agora" : null,
  };
}

function regra2(ctx: ContextoRegras): RegraAvaliada {
  const { estado } = ctx.piso;
  const mensagem = ctx.piso.cumprido
    ? "Piso cumprido."
    : estado === "vermelho"
      ? "O piso não foi cumprido hoje. Ele não depende da marcha."
      : ctx.piso.flashcards
        ? "Falta 1 minuto de fala."
        : ctx.piso.fala
          ? "Falta marcar a revisão de flashcards."
          : "Flashcards e 1 minuto de fala. Independe da marcha.";

  const acao: AcaoRegra | null = ctx.piso.cumprido
    ? null
    : ctx.piso.flashcards
      ? "registrar_um_minuto"
      : "marcar_revisao";

  return {
    numero: 2,
    curto: "piso",
    titulo: "Flashcards e 1 minuto de fala independem da marcha",
    estado,
    mensagem,
    acao,
    rotuloAcao: acao === "marcar_revisao" ? "Revisei" : acao ? "Falei 1 min" : null,
  };
}

function regra3(ctx: ContextoRegras): RegraAvaliada {
  let estado: EstadoSemaforo;
  let mensagem: string;

  if (ctx.conversacaoNaSemana) {
    estado = "verde";
    mensagem = "Conversação feita nesta semana.";
  } else if (ctx.marchaAtiva === 1) {
    estado = "cinza";
    mensagem = "Na marcha 1 o clube não é cobrado.";
  } else if (ctx.clubeAgendado) {
    estado = "amarelo";
    mensagem = "Clube marcado, ainda não aconteceu.";
  } else {
    estado = "vermelho";
    mensagem = "Nenhum clube marcado nos próximos 14 dias. Intenção não conta — marque a data.";
  }

  return {
    numero: 3,
    curto: "clube",
    titulo: "O clube de conversação é compromisso marcado",
    estado,
    mensagem,
    acao: estado === "vermelho" ? "agendar_clube" : null,
    rotuloAcao: estado === "vermelho" ? "Agendar clube" : null,
  };
}

function regra4(ctx: ContextoRegras): RegraAvaliada {
  const dia = diaDaSemana(ctx.hoje);
  let estado: EstadoSemaforo;
  let mensagem: string;

  if (ctx.audioNaSemana) {
    estado = "verde";
    mensagem = "Áudio da semana enviado.";
  } else if (dia === 7) {
    estado = "vermelho";
    mensagem = "A semana acaba hoje sem áudio no grupo. Feio mesmo vale.";
  } else if (dia >= 4) {
    estado = "amarelo";
    mensagem = "Ainda falta o áudio da semana.";
  } else {
    estado = "cinza";
    mensagem = "Um áudio no grupo por semana.";
  }

  const cobra = estado === "vermelho" || estado === "amarelo";
  return {
    numero: 4,
    curto: "áudio",
    titulo: "Um áudio no grupo por semana",
    estado,
    mensagem,
    acao: cobra ? "registrar_audio_grupo" : null,
    rotuloAcao: cobra ? "Mandei o áudio" : null,
  };
}

function regra5(ctx: ContextoRegras): RegraAvaliada {
  const estado: EstadoSemaforo = ctx.violouRegra5Hoje ? "vermelho" : "verde";
  const sexta = diaDaSemana(ctx.hoje) === 5;
  const mensagem = ctx.violouRegra5Hoje
    ? "Gramática e pronúncia no mesmo dia hoje."
    : sexta
      ? "Hoje é sexta — dia de pronúncia."
      : "Gramática e pronúncia em dias separados.";

  return {
    numero: 5,
    curto: "gram+pron",
    titulo: "Gramática e pronúncia nunca no mesmo dia",
    estado,
    mensagem,
    acao: null,
    rotuloAcao: null,
  };
}

function regra6(ctx: ContextoRegras): RegraAvaliada {
  const liberado = ctx.marchaAtiva === 3;
  return {
    numero: 6,
    curto: "instagram",
    titulo: "Conteúdo no Instagram só na marcha 3",
    estado: liberado ? "verde" : "cinza",
    mensagem: liberado
      ? "Marcha 3: conteúdo liberado."
      : `Conteúdo no Instagram é da marcha 3. Você está na marcha ${ctx.marchaAtiva}.`,
    acao: null,
    rotuloAcao: null,
  };
}

const PESO: Record<EstadoSemaforo, number> = {
  vermelho: 0,
  amarelo: 1,
  cinza: 2,
  verde: 3,
};

/** RN-307. Vermelhas primeiro, depois amarelas; ordem numérica dentro de cada grupo. */
export function avaliarSeisRegras(ctx: ContextoRegras): RegraAvaliada[] {
  const regras = [regra1(ctx), regra2(ctx), regra3(ctx), regra4(ctx), regra5(ctx), regra6(ctx)];
  return [...regras].sort((a, b) => {
    if (PESO[a.estado] !== PESO[b.estado]) return PESO[a.estado] - PESO[b.estado];
    return a.numero - b.numero;
  });
}

export function regrasEmRisco(regras: RegraAvaliada[]): number {
  return regras.filter((r) => r.estado === "vermelho" || r.estado === "amarelo").length;
}
