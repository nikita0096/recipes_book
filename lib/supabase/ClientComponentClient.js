import { createBrowserClient } from '@supabase/ssr';

let supabaseClient = null;

export const supabase = new Proxy({}, {
  get(_, prop) {
    if (!supabaseClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) {
        throw new Error('Supabase URL and API key are required');
      }
      supabaseClient = createBrowserClient(url, key);
    }
    return supabaseClient[prop];
  }
});
