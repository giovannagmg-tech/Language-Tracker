import type { LucideIcon } from "lucide-react";

type Props = {
  icone: LucideIcon;
  titulo: string;
  subtitulo?: string;
  acoes?: React.ReactNode;
};

export function CabecalhoPagina({ icone: Icone, titulo, subtitulo, acoes }: Props) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icone className="mt-1 size-6 shrink-0 text-texto" strokeWidth={1.75} />
        <div>
          <h1 className="text-h1 text-texto">{titulo}</h1>
          {subtitulo ? <p className="mt-1 text-pequeno text-texto-2">{subtitulo}</p> : null}
        </div>
      </div>
      {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
    </header>
  );
}
