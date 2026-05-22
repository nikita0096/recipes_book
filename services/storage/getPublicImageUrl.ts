export type ImageBucket = 'author' | 'hero-images' | 'steps' | 'images';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getPublicImageUrl(
  path: string | null,
  bucket: ImageBucket
): string | null {
  if (!path) return null;

  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function batchGetPublicUrls(
  paths: string[],
  bucket: ImageBucket
): Record<string, string> {
  const urlMap: Record<string, string> = {};

  paths.forEach(path => {
    if (!path) return;

    // If it's already a full URL, use as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      urlMap[path] = path;
    } else {
      urlMap[path] = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }
  });

  return urlMap;
}