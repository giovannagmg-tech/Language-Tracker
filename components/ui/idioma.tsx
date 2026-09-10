import { cn } from "@/lib/utils";

/**
 * A identidade visual de um idioma, igual em toda tela.
 *
 * A cor do idioma **nunca** pinta texto. Medido contra o fundo claro, só o
 * inglês passa de 4,5 — espanhol dá 2,23, francês 4,27. A cor vira fundo
 * suave e ponto; o texto fica na cor de leitura. É o que liga a tela aos
 * gráficos sem tornar metade dos idiomas ilegível.
 */
export type IdiomaVisual = {
  nome: string;
  bandeira: string;
  cor: string;
};

export function PastilhaIdioma({
  idioma,
  mostrarNome = true,
  compacta = false,
  inativo = false,
  className,
}: {
  idioma: IdiomaVisual;
  mostrarNome?: boolean;
  compacta?: boolean;
  /** Idioma fora de estudo: mesma identidade, saturação baixa. */
  inativo?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full font-medium text-texto",
        compacta ? "gap-1 px-1.5 py-0.5 text-rotulo" : "gap-1.5 px-2 py-0.5 text-pequeno",
        inativo && "opacity-60",
        className,
      )}
      // 18 em hexadecimal ≈ 9% de opacidade: tinge o suficiente para ligar à
      // cor do gráfico, de leve o bastante para o texto continuar legível.
      style={{ background: `${idioma.cor}18` }}
    >
      <span aria-hidden>{idioma.bandeira}</span>
      {mostrarNome ? <span className="truncate">{idioma.nome}</span> : null}
    </span>
  );
}

/** Ponto na cor do idioma. Para linha densa, onde nome não cabe. */
export function PontoIdioma({
  idioma,
  className,
}: {
  idioma: IdiomaVisual;
  className?: string;
}) {
  return (
    <span
      aria-label={idioma.nome}
      title={idioma.nome}
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={{ background: idioma.cor }}
    />
  );
}

/**
 * Faixa fina na cor do idioma, para a borda esquerda de um cartão.
 * Aplicada como estilo, porque a cor vem do banco e não do tema.
 */
export function bordaDoIdioma(idioma: IdiomaVisual | undefined): React.CSSProperties {
  return idioma ? { borderLeft: `3px solid ${idioma.cor}` } : {};
}
