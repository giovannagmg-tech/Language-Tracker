type Props = {
  streakRegistro: number;
  streakPiso: number;
  recorde: number;
  faltamRecorde: number;
};

/** RN-705. As duas sequências lado a lado: a fácil e a que o método cobra. */
export function Sequencias({ streakRegistro, streakPiso, recorde, faltamRecorde }: Props) {
  return (
    <section
      aria-labelledby="sequencias-titulo"
      className="rounded-card border border-borda bg-superficie p-6 shadow-card"
    >
      <h2 id="sequencias-titulo" className="mb-4 text-h2 text-texto">
        Sequência
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-rotulo uppercase text-texto-3">Dias com registro</p>
          <p className="text-display text-texto tabular">{streakRegistro}</p>
        </div>
        <div>
          <p className="text-rotulo uppercase text-texto-3">Dias com o piso</p>
          <p className="text-display text-texto tabular">{streakPiso}</p>
        </div>
      </div>
      <p className="mt-4 border-t border-borda pt-4 text-pequeno text-texto-2">
        {recorde === 0
          ? "Ainda sem recorde no histórico. O primeiro dia já vira um."
          : faltamRecorde === 0
            ? `Você está no seu recorde: ${recorde} dias.`
            : `Faltam ${faltamRecorde} ${faltamRecorde === 1 ? "dia" : "dias"} para bater seu recorde de ${recorde}.`}
      </p>
    </section>
  );
}
