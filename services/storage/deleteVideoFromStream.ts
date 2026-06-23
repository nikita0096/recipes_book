/**
 * Delete video from Cloudflare Stream
 *
 * This service handles deleting videos from Cloudflare Stream via our API endpoint.
 * Used when recipes are deleted or videos are being replaced.
 */

interface DeleteResult {
  success: boolean;
  error: string;
}

export const deleteVideoFromStream = async (
  videoUid: string
): Promise<DeleteResult> => {
  try {
    if (!videoUid) {
      return {
        success: false,
        error: 'Missing video UID',
      };
    }

    // Check if this is a legacy R2 video (contains '/')
    const isLegacyR2Video = videoUid.includes('/');

    if (isLegacyR2Video) {
      // Use old R2 deletion endpoint for backward compatibility
      const response = await fetch('/api/video/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: videoUid }),
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          success: false,
          error: data.error || 'Failed to delete R2 video',
        };
      }

      return { success: true, error: '' };
    }

    // Delete from Cloudflare Stream
    const response = await fetch('/api/stream/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUid }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.error || 'Failed to delete video from Stream',
      };
    }

    return { success: true, error: '' };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
};