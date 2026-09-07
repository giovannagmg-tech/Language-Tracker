"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { enviarLink, type EstadoLogin } from "./actions";

export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(
    enviarLink,
    null,
  );

  return (
    <main className="grid min-h-dvh place-items-center bg-fundo px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-[10px] bg-lime-500 text-h3 font-bold text-texto">
            P
          </div>
          <div>
            <p className="text-h2 leading-none">Poliglota</p>
            <p className="text-pequeno text-texto-2">estudos de idiomas</p>
          </div>
        </div>

        <form action={acao} className="space-y-3">
          <label htmlFor="email" className="block text-rotulo uppercase text-texto-3">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="voce@exemplo.com"
            className="h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-corpo outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
          />
          <Button type="submit" disabled={enviando} className="h-10 w-full">
            {enviando ? "Enviando…" : "Entrar com link no e-mail"}
          </Button>
        </form>

        {estado === null && erroInicial ? (
          <p role="alert" className="mt-4 rounded-[10px] bg-perigo-bg px-3 py-2 text-pequeno text-perigo">
            {erroInicial}
          </p>
        ) : null}

        {estado ? (
          <p
            role="status"
            className={`mt-4 rounded-[10px] px-3 py-2 text-pequeno ${
              estado.ok
                ? "bg-sucesso-bg text-sucesso"
                : "bg-perigo-bg text-perigo"
            }`}
          >
            {estado.mensagem}
          </p>
        ) : null}

        <p className="mt-8 text-pequeno text-texto-3">
          Sem senha e sem cadastro. Só e-mails autorizados entram.
        </p>
      </div>
    </main>
  );
}
