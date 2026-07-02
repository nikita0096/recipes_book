import {NextRequest, NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/ServerComponentClient";
import {requireAdmin} from "@/lib/auth/requireAdmin";

/**
 * Issues a one-time signed upload token so the browser can send the original
 * (possibly very large) image straight to Supabase Storage, bypassing Vercel's
 * ~4.5 MB request body limit. The original lands at `${filePath}.orig` and is
 * replaced by the compressed version in the companion process route.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const bucket = body?.bucket;
  const filePath = body?.filePath;

  if (typeof bucket !== "string" || !bucket || typeof filePath !== "string" || !filePath) {
    return NextResponse.json({ error: 'Invalid bucket or path' }, { status: 400 });
  }

  const supabase = await createClient();

  const {data, error} = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(`${filePath}.orig`);

  if (error) {
    console.error('Creating signed upload URL failed:', error);
    return NextResponse.json({ error: 'Failed to authorize upload' }, { status: 500 });
  }

  return NextResponse.json({ token: data.token, path: data.path });
}