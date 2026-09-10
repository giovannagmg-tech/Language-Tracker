import { redirect } from "next/navigation";
import { AtalhosGlobais } from "@/components/app/atalhos-globais";
import { BarraInferior } from "@/components/app/barra-inferior";
import { Sidebar } from "@/components/app/sidebar";
import { SincronizarTema } from "@/components/app/tema";
import { Toaster } from "@/components/ui/sonner";
import { carregarHoje } from "@/lib/queries/hoje";
import { carregarConfiguracoes } from "@/lib/queries/configuracoes";
import { carregarTarefas } from "@/lib/queries/tarefas";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const [estado, tarefas, config] = await Promise.all([
    carregarHoje(),
    carregarTarefas(),
    carregarConfiguracoes(),
  ]);
  const badgeHoje = estado.pendentes + estado.emRisco;

  return (
    <div className="min-h-dvh bg-fundo">
      <Sidebar
        marchaAtiva={estado.marcha}
        streakRegistro={estado.streakRegistro}
        streakPiso={estado.streakPiso}
        badges={{ hoje: badgeHoje, tarefas: tarefas.abertasHoje }}
      />
      <main className="px-4 pb-24 pt-6 sm:px-6 sm:py-8 md:pb-8 md:pl-[calc(var(--largura-sidebar)+24px)] md:pr-6 transition-[padding] duration-200">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
      <BarraInferior badgeHoje={badgeHoje} />
      <SincronizarTema tema={config.tema} />
      <AtalhosGlobais hoje={estado.hoje} idiomaFocoId={estado.idiomaFocoId} />
      <Toaster position="bottom-right" />
    </div>
  );
}
