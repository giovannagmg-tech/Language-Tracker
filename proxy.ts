import type { NextRequest } from "next/server";
import { renovarSessao } from "@/lib/supabase/middleware";

/**
 * Next 16 substituiu a convenção `middleware.ts` por `proxy.ts`. O arquivo
 * antigo ainda roda em dev e passa no build, mas chega ao runtime da Vercel
 * sem ser compilado — com o alias `@/` cru — e derruba todas as rotas com
 * MIDDLEWARE_INVOCATION_FAILED.
 */
export async function proxy(request: NextRequest) {
  return renovarSessao(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
