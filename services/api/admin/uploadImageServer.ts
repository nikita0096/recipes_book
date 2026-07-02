import {supabase} from "@/lib/supabase/ClientComponentClient";

async function postJson(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });

  // Vercel-level failures (413, 502, ...) return non-JSON bodies.
  const data = await res.json().catch(() => null);

  if (!res.ok || !data) {
    throw new Error(data?.error || `Request to ${url} failed (${res.status})`);
  }

  return data;
}

/**
 * Client-side helper that uploads an image to Supabase Storage and has the
 * admin API compress it with sharp. The image bytes go from the browser
 * straight to Supabase via a signed upload URL, so uploads are not subject to
 * Vercel's ~4.5 MB request body limit. Returns the stored path or an error.
 */
export async function uploadImageServer(file: File, bucket: string, filePath: string) {
  try {
    const {token, path} = await postJson('/api/admin/upload_image/sign', {bucket, filePath});

    const {error: uploadError} = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file, {contentType: file.type});

    if (uploadError) {
      console.error('Direct image upload failed:', uploadError);
      return {imagePath: '', error: 'Failed to upload image'};
    }

    const {imagePath, error} = await postJson('/api/admin/upload_image/process', {bucket, filePath});

    return {imagePath, error};
  } catch (error) {
    return {imagePath: '', error: error instanceof Error ? error.message : 'Failed to upload image'};
  }
}