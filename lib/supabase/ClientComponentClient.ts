import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase URL and API key are required');
    }
    supabaseClient = createBrowserClient(url, key);
  }
  return supabaseClient;
}

// Typed wrapper that lazily initializes the client
export const supabase = {
  get auth() { return getSupabase().auth; },
  from: <T extends string>(table: T) => getSupabase().from(table),
  get storage() { return getSupabase().storage; },
  get functions() { return getSupabase().functions; },
  get realtime() { return getSupabase().realtime; },
  rpc: <T extends string>(fn: T, args?: Record<string, unknown>) => getSupabase().rpc(fn, args),
};