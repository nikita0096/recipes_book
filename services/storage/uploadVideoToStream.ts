/**
 * Upload video to Cloudflare Stream using Direct Creator Upload
 *
 * Flow:
 * 1. Get upload URL from our API (which creates it via Cloudflare)
 * 2. Upload video directly to Cloudflare Stream
 * 3. Return video UID to store in database
 */

interface IVideoUploadProps {
  videoFile: File;
  recipeId: string;
  isPremium: boolean;
  onProgress?: (percentage: number) => void;
}

interface UploadResult {
  videoUrl: string; // This is Stream video UID
  error: string;
}

export const uploadVideoToStream = async ({
  videoFile,
  recipeId,
  isPremium,
  onProgress,
}: IVideoUploadProps): Promise<UploadResult> => {
  try {
    // Step 1: Get Direct Upload URL from our API
    const urlResponse = await fetch('/api/stream/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, isPremium }),
    });

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      return {
        videoUrl: '',
        error: errorData.error || 'Failed to get upload URL',
      };
    }

    const { uploadUrl, videoUid } = await urlResponse.json();

    // Step 2: Upload video directly to Cloudflare Stream
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percentage);
        }
      });

      // Upload complete
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            videoUrl: videoUid, // Return the video UID
            error: '',
          });
        } else {
          resolve({
            videoUrl: '',
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      });

      // Network error
      xhr.addEventListener('error', () => {
        resolve({ videoUrl: '', error: 'Network error during upload' });
      });

      // Upload cancelled
      xhr.addEventListener('abort', () => {
        resolve({ videoUrl: '', error: 'Upload cancelled' });
      });

      // Create FormData for direct upload
      const formData = new FormData();
      formData.append('file', videoFile);

      // Start upload directly to Cloudflare
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      videoUrl: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};