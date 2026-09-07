import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "./env";

const ROTAS_PUBLICAS = ["/login", "/auth"];

export async function renovarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL(), SUPABASE_CHAVE_PUBLICA(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        for (const { name, value } of cookiesParaGravar) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaGravar) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publica = ROTAS_PUBLICAS.some((rota) =>
    request.nextUrl.pathname.startsWith(rota),
  );

  if (!user && !publica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/hoje";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}
