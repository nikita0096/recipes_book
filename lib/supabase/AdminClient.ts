import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for trusted server-only contexts (e.g. Stripe
 * webhooks) where there is no user session. Bypasses RLS — never import this
 * into client components or expose it to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}