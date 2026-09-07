"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "./env";

export function supabaseNavegador() {
  return createBrowserClient(SUPABASE_URL(), SUPABASE_CHAVE_PUBLICA());
}
