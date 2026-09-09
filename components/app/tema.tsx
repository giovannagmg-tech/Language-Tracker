"use client";

import { useEffect } from "react";
import { aplicarTema } from "@/components/configuracoes/painel";

/**
 * O script inline no `layout` já pintou a página com o que estava no
 * localStorage. Aqui só sincronizamos com o que o servidor diz — importante
 * quando ela troca o tema em outro dispositivo.
 */
export function SincronizarTema({ tema }: { tema: "claro" | "escuro" | "sistema" }) {
  useEffect(() => {
    aplicarTema(tema);

    if (tema !== "sistema") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => aplicarTema("sistema");
    media.addEventListener("change", aoMudar);
    return () => media.removeEventListener("change", aoMudar);
  }, [tema]);

  return null;
}
