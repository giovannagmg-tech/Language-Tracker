import { redirect } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { marchaVigente } from "@/lib/queries/marcha";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");

  const marcha = await marchaVigente();

  return (
    <div className="min-h-dvh bg-fundo">
      {/* streaks entram na Fase 1, junto das funções de domínio que os calculam */}
      <Sidebar marchaAtiva={marcha} streakRegistro={null} streakPiso={null} />
      <main className="px-6 py-8 md:pl-[234px] md:pr-6">
        <div className="mx-auto w-full max-w-[1280px]">{children}</div>
      </main>
    </div>
  );
}
