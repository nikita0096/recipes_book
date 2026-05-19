import {supabase} from '@/lib/supabase/ClientComponentClient';

export type ImageBucket = 'author' | 'hero-images' | 'steps' | 'images';

export async function getSignedImageUrl(
  path: string | null,
  bucket: ImageBucket,
  expiresIn = 3600
): Promise<string | null> {
  if (!path) return null;

  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const {data, error} = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Failed to create signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

export async function batchGetSignedUrls(
  paths: string[],
  bucket: ImageBucket,
  expiresIn = 3600
): Promise<Record<string, string>> {
  const validPaths = paths.filter(p => p && !p.startsWith('http://') && !p.startsWith('https://'));
  const fullUrls = paths.filter(p => p && (p.startsWith('http://') || p.startsWith('https://')));

  // Handle paths that are already full URLs
  const urlMap: Record<string, string> = {};
  fullUrls.forEach(url => {
    urlMap[url] = url;
  });

  if (validPaths.length === 0) return urlMap;

  const {data, error} = await supabase.storage
    .from(bucket)
    .createSignedUrls(validPaths, expiresIn);

  if (error || !data) return urlMap;

  data.forEach((item, i) => {
    urlMap[validPaths[i]] = item.signedUrl;
  });

  return urlMap;
}
