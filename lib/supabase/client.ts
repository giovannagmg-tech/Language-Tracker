"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_CHAVE_PUBLICA, SUPABASE_URL } from "./env";
import type { Database } from "./types";

export function supabaseNavegador() {
  return createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_CHAVE_PUBLICA());
}
