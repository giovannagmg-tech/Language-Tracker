import { redirect } from "next/navigation";
import { AtalhosGlobais } from "@/components/app/atalhos-globais";
import { Sidebar } from "@/components/app/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { carregarHoje } from "@/lib/queries/hoje";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const estado = await carregarHoje();
  const badgeHoje = estado.pendentes + estado.emRisco;

  return (
    <div className="min-h-dvh bg-fundo">
      <Sidebar
        marchaAtiva={estado.marcha}
        streakRegistro={estado.streakRegistro}
        streakPiso={estado.streakPiso}
        badges={{ hoje: badgeHoje }}
      />
      <main className="px-6 py-8 md:pl-[234px] md:pr-6">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
      <AtalhosGlobais hoje={estado.hoje} idiomaFocoId={estado.idiomaFocoId} />
      <Toaster position="bottom-right" />
    </div>
  );
}
