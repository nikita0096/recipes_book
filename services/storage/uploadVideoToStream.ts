/**
 * Upload video to Cloudflare Stream using tus protocol (chunked upload)
 *
 * Flow:
 * 1. Get upload URL from our API (which creates it via Cloudflare)
 * 2. Upload video using tus protocol for resumable chunked uploads
 * 3. Return video UID to store in database
 */

import * as tus from 'tus-js-client';

interface IVideoUploadProps {
  videoFile: File;
  recipeId: string;
  isPremium: boolean;
  name: string;
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
  name,
  onProgress,
}: IVideoUploadProps): Promise<UploadResult> => {
  try {
    // Step 1: Get Direct Upload URL from our API
    const urlResponse = await fetch('/api/stream/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId, isPremium, size: videoFile.size, name: name }),
    });

    if (!urlResponse.ok) {
      const errorData = await urlResponse.json();
      return {
        videoUrl: '',
        error: errorData.error || 'Failed to get upload URL',
      };
    }

    const { uploadUrl, videoUid } = await urlResponse.json();

    // Step 2: Upload video using tus protocol (chunked, resumable)
    // For Cloudflare Direct Creator Upload with tus:
    // - The uploadUrl IS the tus endpoint (upload already created by API)
    // - Don't send metadata (already set via API)
    return new Promise( async (resolve) => {
      const upload = new tus.Upload(videoFile, {
        endpoint: uploadUrl,
        uploadSize: videoFile.size,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        chunkSize: 50 * 1024 * 1024, // 50MB chunks
        metadata: {
          filename: videoFile.name,
          filetype: videoFile.type,
        },
        onError: (error) => {
          console.error('Tus upload error:', error);
          resolve({
            videoUrl: '',
            error: error.message || 'Upload failed',
          });
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          onProgress?.(percentage);
        },
        onSuccess: () => {
          resolve({
            videoUrl: videoUid,
            error: '',
          });
        },
      });

      const previousUploads = await upload.findPreviousUploads();

      if (previousUploads.length) {
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      upload.start();
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      videoUrl: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};