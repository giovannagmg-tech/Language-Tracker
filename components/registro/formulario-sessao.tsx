"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips, type OpcaoChip } from "@/components/ui/chips";
import { excluirSessao, registrarSessao } from "@/lib/actions/sessoes";
import { concluirTarefaComSessao } from "@/lib/actions/tarefas-manuais";
import { ehSexta } from "@/lib/domain/datas";
import {
  DEFAULTS,
  classificar,
  conflitoGramaticaPronuncia,
  instagramLiberado,
  normalizarDuracao,
} from "@/lib/domain/classificacao";
import {
  ROTULO_ATIVIDADE,
  ROTULO_PILAR,
  ROTULO_TEMPO,
  type Atividade,
  type Marcha,
  type Pilar,
  type TempoDoDia,
} from "@/lib/domain/tipos";
import type { IdiomaResumo } from "@/lib/queries/hoje";
import { cn } from "@/lib/utils";

const ATIVAS: Atividade[] = [
  "flashcards",
  "gramatica",
  "pronuncia",
  "fala_sozinha",
  "conversacao",
  "aula",
  "audio_grupo",
  "escrita",
  "gravacao_video",
  "conteudo_instagram",
  "outro",
];

const PASSIVAS: Atividade[] = [
  "serie_filme",
  "podcast",
  "audiobook",
  "youtube",
  "leitura",
  "browser_mode",
];

const PILARES_OPCOES: OpcaoChip<Pilar>[] = (
  ["vocabulario", "gramatica", "pronuncia", "fala"] as const
).map((p) => ({ valor: p, rotulo: ROTULO_PILAR[p] }));

const TEMPOS_OPCOES: OpcaoChip<TempoDoDia>[] = (
  ["cadeira", "maos_livres", "maos_ocupadas"] as const
).map((t) => ({ valor: t, rotulo: ROTULO_TEMPO[t] }));

const DURACOES = [15, 25, 40, 60];

type Props = {
  idiomas: IdiomaResumo[];
  idiomaFocoId: string;
  hoje: string;
  marcha: Marcha;
  /** Pilares já registrados hoje — alimenta o aviso da regra 5 sem ida ao servidor. */
  pilaresDoDia: (Pilar | null)[];
  compacto?: boolean;
  aoSalvar?: () => void;
  /** RN-1207: rascunho vindo de uma tarefa do calendário. */
  inicial?: {
    idiomaId?: string;
    pilar?: Pilar | null;
    data?: string;
    duracaoMin?: number;
    tarefaId?: string;
  };
};

export function FormularioSessao({
  idiomas,
  idiomaFocoId,
  hoje,
  marcha,
  pilaresDoDia,
  compacto = false,
  aoSalvar,
  inicial,
}: Props) {
  // Telemetria do tempo de registro: marcado no mount, nunca durante o render.
  const abertoEm = useRef(0);
  useEffect(() => {
    abertoEm.current = Date.now();
  }, []);
  const [enviando, iniciar] = useTransition();

  const [idiomaId, setIdiomaId] = useState(inicial?.idiomaId ?? idiomaFocoId);
  const [atividade, setAtividade] = useState<Atividade>("fala_sozinha");
  const [pilar, setPilar] = useState<Pilar | null>(inicial?.pilar ?? DEFAULTS.fala_sozinha.pilar);
  const [tempo, setTempo] = useState<TempoDoDia>(DEFAULTS.fala_sozinha.tempo);
  const [data, setData] = useState(inicial?.data ?? hoje);
  const [duracao, setDuracao] = useState(inicial?.duracaoMin ?? 40);
  const [expandido, setExpandido] = useState(false);
  const [palavrasNovas, setPalavrasNovas] = useState(0);
  const [minutosFala, setMinutosFala] = useState<number | "">("");
  const [pontos, setPontos] = useState(0);
  const [frases, setFrases] = useState(0);
  const [nota, setNota] = useState("");
  // A confirmação vale para um pilar específico: trocar de pilar já a invalida,
  // sem precisar de efeito para limpar.
  const [confirmadoPara, setConfirmadoPara] = useState<Pilar | null>(null);

  const classificacao = useMemo(
    () =>
      classificar({
        atividade,
        duracaoMin: duracao,
        pilar,
        tempo,
        minutosFala: minutosFala === "" ? undefined : minutosFala,
      }),
    [atividade, duracao, pilar, tempo, minutosFala],
  );

  const imersao = classificacao.categoria === "imersao";
  const conflito = imersao
    ? null
    : conflitoGramaticaPronuncia(
        classificacao.pilar,
        pilaresDoDia.map((p) => ({ pilar: p })),
      );

  const confirmouRegra5 = confirmadoPara !== null && confirmadoPara === classificacao.pilar;

  // Trocar de atividade reaplica os defaults dela (RN-101).
  function escolherAtividade(nova: Atividade) {
    setAtividade(nova);
    setPilar(DEFAULTS[nova].pilar);
    setTempo(DEFAULTS[nova].tempo);
    setConfirmadoPara(null);
  }

  const opcoesAtividade: OpcaoChip<Atividade>[] = [...ATIVAS, ...PASSIVAS].map((a) => ({
    valor: a,
    rotulo: ROTULO_ATIVIDADE[a],
    desabilitado: a === "conteudo_instagram" && !instagramLiberado(marcha),
    motivo:
      a === "conteudo_instagram" && !instagramLiberado(marcha)
        ? `Conteúdo no Instagram é da marcha 3. Você está na marcha ${marcha}.`
        : undefined,
  }));

  function salvar(forcar = false) {
    if (conflito && !confirmouRegra5 && !forcar) {
      setConfirmadoPara(classificacao.pilar);
      return;
    }

    iniciar(async () => {
      const resultado = await registrarSessao({
        idiomaId,
        data,
        duracaoMin: normalizarDuracao(duracao),
        atividade,
        pilar: imersao ? null : pilar,
        tempo,
        palavrasNovas,
        minutosFala: minutosFala === "" ? undefined : minutosFala,
        pontosGramaticais: pontos,
        frasesProduzidas: frases,
        nota: nota || null,
        via: compacto ? "atalho" : "formulario",
        confirmouRegra5,
        duracaoRegistroMs: Date.now() - abertoEm.current,
      });

      if (!resultado.ok) {
        toast.error(resultado.erro);
        return;
      }

      toast.success(
        `${ROTULO_ATIVIDADE[atividade]} · ${duracao} min${imersao ? " · imersão" : ""}`,
        {
          duration: 30_000,
          action: {
            label: "Desfazer",
            onClick: () => void excluirSessao(resultado.id),
          },
        },
      );

      // RN-1207: é o salvar da sessão que conclui a tarefa, nunca o contrário.
      // Sessão falhou, a tarefa continua aberta — que é a verdade.
      if (inicial?.tarefaId) {
        const fecho = await concluirTarefaComSessao(inicial.tarefaId, resultado.id);
        if (!fecho.ok) toast.error(fecho.erro ?? "A sessão foi salva, mas a tarefa não fechou.");
      }

      abertoEm.current = Date.now();
      setPalavrasNovas(0);
      setMinutosFala("");
      setPontos(0);
      setFrases(0);
      setNota("");
      setConfirmadoPara(null);
      aoSalvar?.();
    });
  }

  function aoTeclarNoFormulario(evento: React.KeyboardEvent) {
    if ((evento.metaKey || evento.ctrlKey) && evento.key === "Enter") {
      evento.preventDefault();
      salvar();
    }
  }

  return (
    <form
      onKeyDown={aoTeclarNoFormulario}
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      className="space-y-6"
    >
      <GrupoDeChips
        legenda="Idioma"
        valor={idiomaId}
        onChange={setIdiomaId}
        opcoes={idiomas.map((i) => ({ valor: i.id, rotulo: i.nome, prefixo: i.bandeira }))}
      />

      <GrupoDeChips
        legenda="Atividade"
        valor={atividade}
        onChange={escolherAtividade}
        opcoes={opcoesAtividade}
      />

      {imersao ? (
        <p className="text-pequeno text-texto-2">
          Escuta e consumo não são pilar. Isso entra como imersão.
        </p>
      ) : (
        <div>
          <GrupoDeChips
            legenda="Pilar"
            valor={pilar}
            onChange={(p) => setPilar(p)}
            opcoes={PILARES_OPCOES}
          />
          {conflito ? (
            <div className="mt-3 border-l-[3px] border-atencao bg-atencao-bg px-3 py-2">
              <p className="text-pequeno text-texto">
                Você já estudou {ROTULO_PILAR[conflito]} hoje. Gramática e pronúncia no mesmo
                dia se atrapalham.
                {ehSexta(data) ? " Além disso, hoje é sexta — dia de pronúncia." : ""}
              </p>
              <div className="mt-1.5 flex gap-4">
                <button
                  type="button"
                  onClick={() => salvar(true)}
                  className="text-pequeno font-semibold text-atencao underline underline-offset-2"
                >
                  Salvar assim mesmo
                </button>
                <button
                  type="button"
                  onClick={() => setPilar(conflito)}
                  className="text-pequeno text-texto-2 underline underline-offset-2"
                >
                  Trocar o pilar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <GrupoDeChips
        legenda="Tempo do dia"
        valor={tempo}
        onChange={setTempo}
        opcoes={TEMPOS_OPCOES}
      />

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label htmlFor="duracao" className="mb-2 block text-rotulo uppercase text-texto-3">
            Duração
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Menos 5 minutos"
              onClick={() => setDuracao((d) => normalizarDuracao(d - 5))}
              className="size-10 rounded-[10px] border border-borda-forte text-texto-2"
            >
              −
            </button>
            <input
              id="duracao"
              type="number"
              inputMode="numeric"
              value={duracao}
              onChange={(e) => setDuracao(Number(e.target.value))}
              onBlur={() => setDuracao((d) => normalizarDuracao(d))}
              className="h-10 w-20 rounded-[10px] border border-borda-forte bg-superficie text-center text-numero-sm tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            />
            <button
              type="button"
              aria-label="Mais 5 minutos"
              onClick={() => setDuracao((d) => normalizarDuracao(d + 5))}
              className="size-10 rounded-[10px] border border-borda-forte text-texto-2"
            >
              +
            </button>
            <span className="text-pequeno text-texto-3">min</span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {DURACOES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuracao(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-pequeno",
                  duracao === d
                    ? "border-texto bg-texto text-fundo"
                    : "border-borda-forte text-texto-2",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="data" className="mb-2 block text-rotulo uppercase text-texto-3">
            Data
          </label>
          <input
            id="data"
            type="date"
            value={data}
            max={hoje}
            onChange={(e) => setData(e.target.value)}
            className="h-10 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="text-pequeno text-texto-2 underline underline-offset-2"
        >
          {expandido ? "Menos campos" : "Mais campos"}
        </button>

        {expandido ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {!imersao && classificacao.pilar === "vocabulario" ? (
              <Numero rotulo="Palavras novas" valor={palavrasNovas} onChange={setPalavrasNovas} />
            ) : null}
            {!imersao ? (
              <Numero
                rotulo="Minutos de fala"
                valor={minutosFala === "" ? classificacao.minutosFala : minutosFala}
                onChange={(v) => setMinutosFala(v)}
              />
            ) : null}
            {classificacao.pilar === "gramatica" ? (
              <Numero rotulo="Pontos gramaticais" valor={pontos} onChange={setPontos} />
            ) : null}
            {!imersao ? (
              <Numero rotulo="Frases produzidas" valor={frases} onChange={setFrases} />
            ) : null}
            <div className="sm:col-span-2 lg:col-span-4">
              <label htmlFor="nota" className="mb-2 block text-rotulo uppercase text-texto-3">
                Nota
              </label>
              <textarea
                id="nota"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-[10px] border border-borda-forte bg-superficie px-3 py-2 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={enviando} className="h-10 px-6">
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-rotulo uppercase",
            imersao ? "bg-superficie-2 text-imersao" : "bg-sucesso-bg text-sucesso",
          )}
        >
          {imersao ? "Imersão" : "Ativo"}
        </span>
        <span className="text-pequeno text-texto-3">Ctrl+Enter salva</span>
      </div>
    </form>
  );
}

function Numero({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  const id = rotulo.toLowerCase().replace(/\s/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-rotulo uppercase text-texto-3">
        {rotulo}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={valor}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
        className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
      />
    </div>
  );
}
