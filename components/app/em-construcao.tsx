export function EmConstrucao({ fase }: { fase: string }) {
  return (
    <div className="rounded-card border border-borda bg-superficie p-6 shadow-card">
      <p className="text-corpo text-texto-2">
        Esta tela chega na <span className="font-semibold text-texto">{fase}</span>.
      </p>
    </div>
  );
}
