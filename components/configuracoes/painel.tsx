"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GrupoDeChips } from "@/components/ui/chips";
import { NovoIdioma } from "@/components/configuracoes/novo-idioma";
import {
  exportarBackup,
  exportarSessoesCSV,
  importarBackup,
  marcarBackupFeito,
} from "@/lib/actions/backup";
import type { Diagnostico } from "@/lib/backup-tipos";
import {
  salvarAlertas,
  salvarCamadas,
  salvarIdioma,
  salvarTema,
} from "@/lib/actions/configuracoes";
import { NIVEIS, type Nivel } from "@/lib/domain/tipos";
import type { EstadoConfiguracoes } from "@/lib/queries/configuracoes";
import { cn } from "@/lib/utils";

type Secao = "idiomas" | "camadas" | "alertas" | "aparencia" | "backup" | "diagnostico";

const SECOES: { chave: Secao; rotulo: string }[] = [
  { chave: "idiomas", rotulo: "Idiomas" },
  { chave: "camadas", rotulo: "Camadas" },
  { chave: "alertas", rotulo: "Alertas" },
  { chave: "aparencia", rotulo: "Aparência" },
  { chave: "backup", rotulo: "Backup" },
  { chave: "diagnostico", rotulo: "Diagnóstico" },
];

export function PainelConfiguracoes({
  estado,
  diagnostico,
}: {
  estado: EstadoConfiguracoes;
  diagnostico: Diagnostico;
}) {
  const [secao, setSecao] = useState<Secao>("idiomas");

  return (
    <div className="grid gap-6 lg:grid-cols-[180px_1fr]">
      <nav aria-label="Seções das configurações">
        <ul className="flex flex-wrap gap-1 lg:flex-col">
          {SECOES.map((s) => (
            <li key={s.chave}>
              <button
                type="button"
                onClick={() => setSecao(s.chave)}
                aria-current={secao === s.chave ? "true" : undefined}
                className={cn(
                  "w-full rounded-[10px] px-3 py-2 text-left text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500",
                  secao === s.chave
                    ? "bg-superficie-2 font-medium text-texto"
                    : "text-texto-2 hover:text-texto",
                )}
              >
                {s.rotulo}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        {secao === "idiomas" ? <SecaoIdiomas estado={estado} /> : null}
        {secao === "camadas" ? <SecaoCamadas estado={estado} /> : null}
        {secao === "alertas" ? <SecaoAlertas estado={estado} /> : null}
        {secao === "aparencia" ? <SecaoAparencia tema={estado.tema} /> : null}
        {secao === "backup" ? <SecaoBackup /> : null}
        {secao === "diagnostico" ? <SecaoDiagnostico d={diagnostico} /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Cartao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <h2 className="text-h2 text-texto">{titulo}</h2>
      {subtitulo ? <p className="mt-0.5 mb-4 text-pequeno text-texto-2">{subtitulo}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

function Campo({
  id,
  rotulo,
  valor,
  onChange,
  tipo = "text",
  sufixo,
}: {
  id: string;
  rotulo: string;
  valor: string | number;
  onChange: (v: string) => void;
  tipo?: string;
  sufixo?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-rotulo uppercase text-texto-3">
        {rotulo}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type={tipo}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo tabular outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
        />
        {sufixo ? <span className="shrink-0 text-pequeno text-texto-3">{sufixo}</span> : null}
      </div>
    </div>
  );
}

function SeletorNivel({
  id,
  rotulo,
  valor,
  onChange,
}: {
  id: string;
  rotulo: string;
  valor: Nivel;
  onChange: (v: Nivel) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-rotulo uppercase text-texto-3">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value as Nivel)}
        className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
      >
        {NIVEIS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SecaoIdiomas({ estado }: { estado: EstadoConfiguracoes }) {
  return (
    <div className="space-y-6">
      {estado.idiomas.map((i) => (
        <FormularioIdioma key={i.id} idioma={i} />
      ))}
      <NovoIdioma coresEmUso={estado.idiomas.map((i) => i.cor)} />
    </div>
  );
}

function FormularioIdioma({ idioma }: { idioma: EstadoConfiguracoes["idiomas"][number] }) {
  const [dados, setDados] = useState(idioma);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await salvarIdioma(dados);
      toast[r.ok ? "success" : "error"](r.ok ? `${dados.nome} salvo.` : (r.erro ?? "Falhou."));
    });
  }

  return (
    <Cartao titulo={`${dados.bandeira} ${dados.nome}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo id={`nome-${idioma.id}`} rotulo="Nome" valor={dados.nome} onChange={(v) => setDados({ ...dados, nome: v })} />
        <Campo id={`bandeira-${idioma.id}`} rotulo="Bandeira" valor={dados.bandeira} onChange={(v) => setDados({ ...dados, bandeira: v })} />
        <Campo
          id={`base-${idioma.id}`}
          rotulo="Palavras acumuladas"
          tipo="number"
          valor={dados.palavrasBase}
          onChange={(v) => setDados({ ...dados, palavrasBase: Math.max(0, Number(v) || 0) })}
        />
        <SeletorNivel id={`ni-${idioma.id}`} rotulo="Nível inicial" valor={dados.nivelInicial} onChange={(v) => setDados({ ...dados, nivelInicial: v })} />
        <SeletorNivel id={`na-${idioma.id}`} rotulo="Nível atual" valor={dados.nivelAtual} onChange={(v) => setDados({ ...dados, nivelAtual: v })} />
        <SeletorNivel id={`nm-${idioma.id}`} rotulo="Nível meta" valor={dados.nivelMeta} onChange={(v) => setDados({ ...dados, nivelMeta: v })} />
        <Campo
          id={`meta-${idioma.id}`}
          rotulo="Palavras por dia"
          tipo="number"
          valor={dados.metaPalavrasDia}
          onChange={(v) => setDados({ ...dados, metaPalavrasDia: Math.max(0, Number(v) || 0) })}
        />
        <Campo
          id={`data-${idioma.id}`}
          rotulo="Data-alvo do nível"
          tipo="date"
          valor={dados.dataMetaNivel ?? ""}
          onChange={(v) => setDados({ ...dados, dataMetaNivel: v || null })}
        />
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-borda pt-4">
        <Button type="button" onClick={salvar} disabled={salvando} className="h-9">
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
        <label className="flex items-center gap-2 text-pequeno text-texto-2">
          <input
            type="checkbox"
            checked={dados.ativo}
            onChange={(e) => setDados({ ...dados, ativo: e.target.checked })}
            className="size-4 accent-[var(--cor-texto)]"
          />
          idioma ativo
        </label>
      </div>
    </Cartao>
  );
}

function SecaoCamadas({ estado }: { estado: EstadoConfiguracoes }) {
  const [camadas, setCamadas] = useState(estado.camadas);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await salvarCamadas(camadas);
      toast[r.ok ? "success" : "error"](r.ok ? "Camadas salvas." : (r.erro ?? "Falhou."));
    });
  }

  return (
    <Cartao titulo="Camadas de fluência" subtitulo="Os limiares precisam ser crescentes">
      <div className="space-y-4">
        {camadas.map((c, i) => (
          <div key={c.numero} className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <Campo
              id={`camada-nome-${c.numero}`}
              rotulo={`Camada ${c.numero}`}
              valor={c.nome}
              onChange={(v) =>
                setCamadas((atual) => atual.map((x, j) => (i === j ? { ...x, nome: v } : x)))
              }
            />
            <Campo
              id={`camada-limiar-${c.numero}`}
              rotulo="Limiar"
              tipo="number"
              sufixo="palavras"
              valor={c.limiar}
              onChange={(v) =>
                setCamadas((atual) =>
                  atual.map((x, j) => (i === j ? { ...x, limiar: Math.max(1, Number(v) || 1) } : x)),
                )
              }
            />
          </div>
        ))}
      </div>
      <Button type="button" onClick={salvar} disabled={salvando} className="mt-4 h-9">
        {salvando ? "Salvando…" : "Salvar camadas"}
      </Button>
    </Cartao>
  );
}

function SecaoAlertas({ estado }: { estado: EstadoConfiguracoes }) {
  const [a, setA] = useState(estado.alertas);
  const [salvando, iniciar] = useTransition();

  function salvar() {
    iniciar(async () => {
      const r = await salvarAlertas(a);
      toast[r.ok ? "success" : "error"](r.ok ? "Alertas salvos." : (r.erro ?? "Falhou."));
    });
  }

  return (
    <div className="space-y-6">
      <Cartao titulo="Gatilhos" subtitulo="Cada valor aqui muda quando o app cobra você">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="hora-aperto" rotulo="Hora em que o dia aperta" tipo="number" sufixo="h" valor={a.horaAperto} onChange={(v) => setA({ ...a, horaAperto: Number(v) || 0 })} />
          <Campo id="dias-retomada" rotulo="Dias sem registro para retomada" tipo="number" sufixo="dias" valor={a.diasParaRetomada} onChange={(v) => setA({ ...a, diasParaRetomada: Number(v) || 1 })} />
          <Campo id="meta-ativo" rotulo="Meta de estudo ativo" tipo="number" sufixo="%" valor={Math.round(a.metaPctAtivo * 100)} onChange={(v) => setA({ ...a, metaPctAtivo: (Number(v) || 0) / 100 })} />
          <Campo id="meta-fala" rotulo="Minutos de fala por semana" tipo="number" sufixo="min" valor={a.metaMinFalaSemana} onChange={(v) => setA({ ...a, metaMinFalaSemana: Number(v) || 0 })} />
          <Campo id="meta-flash" rotulo="Dias de flashcards por semana" tipo="number" sufixo="dias" valor={a.metaDiasFlashSemana} onChange={(v) => setA({ ...a, metaDiasFlashSemana: Number(v) || 0 })} />
          <Campo id="lacuna" rotulo="Lacuna que gera alerta" tipo="number" sufixo="dias" valor={a.lacunaAlerta} onChange={(v) => setA({ ...a, lacunaAlerta: Number(v) || 1 })} />
          <Campo id="desvio" rotulo="Desvio de pilar no diagnóstico" tipo="number" sufixo="pp" valor={Math.round(a.limiarDesvioPilar * 100)} onChange={(v) => setA({ ...a, limiarDesvioPilar: (Number(v) || 0) / 100 })} />
          <Campo id="concentracao" rotulo="Concentração no diagnóstico" tipo="number" sufixo="%" valor={Math.round(a.limiarConcentracao * 100)} onChange={(v) => setA({ ...a, limiarConcentracao: (Number(v) || 0) / 100 })} />
          <Campo id="lote" rotulo="Lote mínimo para checagem" tipo="number" sufixo="palavras" valor={a.loteMinimoChecagem} onChange={(v) => setA({ ...a, loteMinimoChecagem: Number(v) || 1 })} />
        </div>
        <Button type="button" onClick={salvar} disabled={salvando} className="mt-4 h-9">
          {salvando ? "Salvando…" : "Salvar alertas"}
        </Button>
      </Cartao>

      <Cartao titulo="Mapeamento do Toggl" subtitulo="As regras que traduzem projeto e descrição">
        <Link href="/importacao" className="text-corpo text-texto underline underline-offset-2">
          Abrir a tela de importação
        </Link>
      </Cartao>
    </div>
  );
}

function SecaoAparencia({ tema }: { tema: "claro" | "escuro" | "sistema" }) {
  const [atual, setAtual] = useState(tema);
  const [, iniciar] = useTransition();

  function escolher(novo: "claro" | "escuro" | "sistema") {
    setAtual(novo);
    aplicarTema(novo);
    iniciar(async () => {
      await salvarTema(novo);
    });
  }

  return (
    <Cartao titulo="Aparência" subtitulo="A sidebar é escura nos dois temas — é a âncora visual do app">
      <GrupoDeChips
        legenda="Tema"
        valor={atual}
        onChange={escolher}
        opcoes={[
          { valor: "claro" as const, rotulo: "Claro" },
          { valor: "escuro" as const, rotulo: "Escuro" },
          { valor: "sistema" as const, rotulo: "Sistema" },
        ]}
      />
    </Cartao>
  );
}

/** Aplica na hora, sem esperar o servidor. O `next-themes` não é necessário aqui. */
export function aplicarTema(tema: "claro" | "escuro" | "sistema") {
  const raiz = document.documentElement;
  const escuroDoSistema = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const escuro = tema === "escuro" || (tema === "sistema" && escuroDoSistema);
  raiz.classList.toggle("dark", escuro);
  try {
    window.localStorage.setItem("poliglota-tema", tema);
  } catch {
    // Navegador com armazenamento bloqueado: o tema volta do servidor no próximo load.
  }
}

function SecaoBackup() {
  const [ocupado, iniciar] = useTransition();
  const [confirmacao, setConfirmacao] = useState("");
  const arquivo = useRef<HTMLInputElement>(null);

  function baixar(conteudo: string, nome: string, tipo: string) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportarJSON() {
    iniciar(async () => {
      const r = await exportarBackup();
      if (!r.ok || !r.backup) {
        toast.error(r.erro ?? "Não deu para exportar.");
        return;
      }
      const data = new Date().toISOString().slice(0, 10);
      baixar(JSON.stringify(r.backup, null, 2), `poliglota-backup-${data}.json`, "application/json");
      await marcarBackupFeito();
      toast.success("Backup baixado.");
    });
  }

  function exportarCSV() {
    iniciar(async () => {
      const r = await exportarSessoesCSV();
      if (!r.ok || !r.csv) {
        toast.error(r.erro ?? "Não deu para exportar.");
        return;
      }
      const data = new Date().toISOString().slice(0, 10);
      baixar(r.csv, `poliglota-sessoes-${data}.csv`, "text/csv;charset=utf-8");
      toast.success("CSV baixado.");
    });
  }

  function restaurar(file: File) {
    const leitor = new FileReader();
    leitor.onload = () => {
      let conteudo: unknown;
      try {
        conteudo = JSON.parse(String(leitor.result ?? ""));
      } catch {
        toast.error("O arquivo não é um JSON válido.");
        return;
      }
      iniciar(async () => {
        const r = await importarBackup(conteudo);
        if (!r.ok) {
          toast.error(r.erro ?? "Não deu para restaurar.");
          return;
        }
        toast.success(`${r.linhas} linhas restauradas. Recarregando…`);
        window.setTimeout(() => window.location.reload(), 1200);
      });
    };
    leitor.readAsText(file, "utf-8");
  }

  return (
    <div className="space-y-6">
      <Cartao titulo="Exportar" subtitulo="Seus dados saem inteiros e legíveis fora do app">
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={exportarJSON} disabled={ocupado} className="h-9">
            Exportar tudo (JSON)
          </Button>
          <Button type="button" onClick={exportarCSV} disabled={ocupado} className="h-9">
            Exportar sessões (CSV)
          </Button>
        </div>
      </Cartao>

      <Cartao
        titulo="Restaurar"
        subtitulo="Isso substitui todos os dados atuais desta conta"
      >
        <p className="mb-3 text-pequeno text-texto-2">
          Para confirmar, digite <span className="font-semibold text-texto">substituir</span>:
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            aria-label="Digite substituir para confirmar"
            className="h-10 w-40 rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
          <Button
            type="button"
            onClick={() => arquivo.current?.click()}
            disabled={ocupado || confirmacao.trim().toLowerCase() !== "substituir"}
            className="h-9"
          >
            Escolher backup
          </Button>
          <input
            ref={arquivo}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restaurar(f);
            }}
          />
        </div>
      </Cartao>
    </div>
  );
}

function SecaoDiagnostico({ d }: { d: Diagnostico }) {
  return (
    <Cartao titulo="Diagnóstico" subtitulo="Tudo local; nada disso sai da sua conta">
      <dl className="grid gap-5 sm:grid-cols-2">
        {[
          {
            rotulo: "Tempo mediano de registro",
            valor: d.medianaRegistroMs === null ? "—" : `${(d.medianaRegistroMs / 1000).toFixed(1).replace(".", ",")} s`,
            nota: "alvo: 10 s ou menos",
          },
          { rotulo: "Sessões registradas", valor: String(d.totalSessoes) },
          { rotulo: "Dias com o app aberto", valor: String(d.diasComAppAberto) },
          {
            rotulo: "Último backup",
            valor: d.ultimoBackup ? d.ultimoBackup.slice(0, 10).split("-").reverse().join("/") : "nunca",
          },
        ].map((item) => (
          <div key={item.rotulo}>
            <dt className="text-rotulo uppercase text-texto-3">{item.rotulo}</dt>
            <dd className="mt-1 text-numero-sm text-texto">{item.valor}</dd>
            {item.nota ? <dd className="text-pequeno text-texto-2">{item.nota}</dd> : null}
          </div>
        ))}
      </dl>

      {d.registrosPorOrigem.length > 0 ? (
        <div className="mt-5 border-t border-borda pt-4">
          <p className="mb-2 text-rotulo uppercase text-texto-3">Sessões por origem</p>
          <ul className="space-y-1">
            {d.registrosPorOrigem.map((o) => (
              <li key={o.origem} className="flex justify-between text-pequeno">
                <span className="text-texto-2">{o.origem}</span>
                <span className="tabular text-texto">{o.total}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Cartao>
  );
}
