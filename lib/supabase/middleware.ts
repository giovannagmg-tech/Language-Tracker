import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configuracaoSupabase, nomesFaltando } from "./env";
import type { Database } from "./types";

const ROTAS_PUBLICAS = ["/login", "/auth"];

function ehPublica(pathname: string): boolean {
  return ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));
}

function paraLogin(request: NextRequest, motivo?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = motivo ? `?erro=${motivo}` : "";
  return NextResponse.redirect(url);
}

/**
 * O middleware roda em toda requisição: se ele lança, o site inteiro devolve
 * 500 — inclusive a tela de login, que é justamente por onde se sai do
 * problema. Por isso aqui nada lança: falta de configuração ou falha de rede
 * degradam para "não autenticada", nunca para erro.
 */
export async function renovarSessao(request: NextRequest) {
  const config = configuracaoSupabase();

  if (!config) {
    console.error(
      `[middleware] Supabase não configurado: ${nomesFaltando().join(", ")}. ` +
        "Variáveis NEXT_PUBLIC_ são embutidas no build — configure e faça um novo deploy.",
    );
    return ehPublica(request.nextUrl.pathname)
      ? NextResponse.next({ request })
      : paraLogin(request, "sem_configuracao");
  }

  let resposta = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(config.url, config.chave, {
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

    const publica = ehPublica(request.nextUrl.pathname);

    if (!user && !publica) return paraLogin(request);

    if (user && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/hoje";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return resposta;
  } catch (erro) {
    console.error("[middleware] falha ao renovar a sessão:", erro);
    // Sem saber quem é, o mais seguro é tratar como deslogada.
    return ehPublica(request.nextUrl.pathname) ? resposta : paraLogin(request, "sessao_indisponivel");
  }
}
