import {supabase} from "@/lib/supabase/ClientComponentClient";

/**
 * Извлекает путь файла из полного URL Supabase Storage
 * URL формат: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
 */
export const extractPathFromUrl = (url: string, bucket: string): string | null => {
  if (!url) return null;

  const pattern = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(pattern);

  if (index === -1) return null;

  return url.slice(index + pattern.length);
};

/**
 * Удаляет файл из Supabase Storage
 */
export const deleteFile = async (url: string, bucket: string): Promise<{success: boolean; error?: string}> => {
  const path = extractPathFromUrl(url, bucket);

  if (!path) {
    return {success: false, error: 'Invalid URL or path'};
  }

  const {error} = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error(`Failed to delete file from ${bucket}:`, error.message);
    return {success: false, error: error.message};
  }

  return {success: true};
};

/**
 * Удаляет изображение из storage
 */
export const deleteImage = async (imageUrl: string): Promise<{success: boolean; error?: string}> => {
  return deleteFile(imageUrl, 'images');
};

/**
 * Удаляет видео из storage
 */
export const deleteVideo = async (videoUrl: string): Promise<{success: boolean; error?: string}> => {
  return deleteFile(videoUrl, 'videos');
};

/**
 * Удаляет несколько файлов из storage
 */
export const deleteFiles = async (urls: string[], bucket: string): Promise<{success: boolean; errors: string[]}> => {
  const paths = urls
    .map(url => extractPathFromUrl(url, bucket))
    .filter((path): path is string => path !== null);

  if (paths.length === 0) {
    return {success: true, errors: []};
  }

  const {error} = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error(`Failed to delete files from ${bucket}:`, error.message);
    return {success: false, errors: [error.message]};
  }

  return {success: true, errors: []};
};