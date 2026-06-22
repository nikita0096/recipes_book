import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/ServerComponentClient';

/**
 * Guard for admin-only API routes. Verifies the caller is an authenticated
 * admin using a request-scoped Supabase client (anon key + user cookies, so
 * RLS still applies). Returns a ready-to-return NextResponse on failure, or
 * null when the caller is allowed to proceed.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return null;
}
