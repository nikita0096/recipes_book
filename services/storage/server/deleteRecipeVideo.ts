import { deleteStreamVideo } from '@/lib/cloudflare-stream/client';

export interface DeleteVideoResult {
  success: boolean;
  error: string;
}

/**
 * Server-only video deletion. Mirrors the client `deleteVideoFromStream`
 * helper but calls Cloudflare Stream directly instead of round-tripping
 * through an API route.
 */
export const deleteRecipeVideo = async (
  videoUid: string
): Promise<DeleteVideoResult> => {
  if (!videoUid) {
    return { success: false, error: 'Missing video UID' };
  }

  try {
    await deleteStreamVideo(videoUid);
    return { success: true, error: '' };
  } catch (error) {
    console.error('Delete video error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};
