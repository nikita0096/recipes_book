/**
 * Upload video to Cloudflare Stream
 *
 * This service handles uploading videos to Cloudflare Stream via our API endpoint.
 * All videos are uploaded with requireSignedURLs enabled for unified security.
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
    // Create FormData for video upload
    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('recipeId', recipeId);
    formData.append('isPremium', isPremium.toString());

    // Upload to our API endpoint which handles Stream upload
    // Note: XMLHttpRequest is used for progress tracking
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
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              videoUrl: response.videoUid, // Stream video UID
              error: '',
            });
          } catch (err) {
            resolve({
              videoUrl: '',
              error: 'Invalid response from server',
            });
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            resolve({
              videoUrl: '',
              error: errorData.error || `Upload failed with status ${xhr.status}`,
            });
          } catch {
            resolve({
              videoUrl: '',
              error: `Upload failed with status ${xhr.status}`,
            });
          }
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

      // Start upload
      xhr.open('POST', '/api/stream/upload');
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