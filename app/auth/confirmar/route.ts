import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { emailPermitido } from "@/lib/auth/allowlist";
import { supabaseServidor } from "@/lib/supabase/server";

/**
 * Confirmação do magic link. Aceita as duas formas em que o Supabase pode
 * devolver a sessão, porque depende do template de e-mail do projeto:
 *   - `code`       → template padrão, fluxo PKCE
 *   - `token_hash` → template customizado com {{ .TokenHash }}
 * A allowlist é checada de novo aqui: ela é a única barreira de acesso.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await supabaseServidor();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?erro=link_expirado`);
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      return NextResponse.redirect(`${origin}/login?erro=link_expirado`);
    }
  } else {
    return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !emailPermitido(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=sem_acesso`);
  }

  return NextResponse.redirect(`${origin}/hoje`);
}
