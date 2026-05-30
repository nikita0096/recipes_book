import {supabase} from "@/lib/supabase/ClientComponentClient";

export const extractPathFromUrl = (url: string, bucket: string): string | null => {
  if (!url) return null;

  const pattern = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(pattern);

  if (index === -1) return null;

  return url.slice(index + pattern.length);
};


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


export const deleteImage = async (imageUrl: string): Promise<{success: boolean; error?: string}> => {
  return deleteFile(imageUrl, 'images');
};

export const deleteFileByPath = async (
  path: string,
  bucket: string
): Promise<{success: boolean; error?: string}> => {
  if (!path) {
    return {success: false, error: 'Invalid path'};
  }

  // If it's a full URL, extract the path first
  let filePath = path;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const extracted = extractPathFromUrl(path, bucket);
    if (!extracted) {
      return {success: false, error: 'Could not extract path from URL'};
    }
    filePath = extracted;
  }

  const {error} = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`Failed to delete file from ${bucket}:`, error.message);
    return {success: false, error: error.message};
  }

  return {success: true};
};

