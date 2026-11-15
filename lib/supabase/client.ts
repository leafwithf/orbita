"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser client for interactive widgets only. Feature code should call
 * server actions/repositories; direct table access stays behind RLS as a
 * second line of defence.
 */
export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase não configurado no cliente.");
  }

  client ??= createBrowserClient(config.url, config.anonKey);
  return client;
}
