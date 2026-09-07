import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { emailPermitido } from "@/lib/auth/allowlist";
import { supabaseServidor } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
  }

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error || !data.user?.email || !emailPermitido(data.user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?erro=sem_acesso`);
  }

  return NextResponse.redirect(`${origin}/hoje`);
}
