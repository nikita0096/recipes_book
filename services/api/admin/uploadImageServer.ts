/**
 * Client-side helper that uploads an image through the admin API route, where it
 * is compressed with sharp and stored in the given Supabase bucket. Runs in the
 * browser (the "Server" suffix means the heavy lifting is delegated to the
 * server, not that this function runs there). Returns the stored path or an error.
 */
export async function uploadImageServer(file: File, bucket: string, filePath: string) {
  const form = new FormData();

  form.append("filePath", filePath);
  form.set("file", file);
  form.append('bucket', bucket);

  const res = await fetch('/api/admin/upload_image', {
    method: 'POST',
    body: form,
  });

  const {imagePath, error} = await res.json();

  return {imagePath, error};
}