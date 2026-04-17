interface IVideoUploadProps {
  videoFile: File;
  folder: string;
  onProgress?: (percentage: number) => void;
}

interface UploadResult {
  videoUrl: string;  // This is actually R2 key, not a URL
  error: string;
}

export const uploadVideoToStorage = async ({
  videoFile,
  folder,
  onProgress
}: IVideoUploadProps): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const videoType = videoFile.type === 'mp4' ? 'video/mp4' : 'video/quicktime';

    // Get presigned upload URL from our API
    const response = await fetch('/api/video/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        contentType: videoType || 'video/quicktime',
        folder,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { videoUrl: '', error: error.error || 'Failed to get upload URL' };
    }

    const { uploadUrl, key } = await response.json();

    // Upload directly to R2 using XMLHttpRequest for progress tracking
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress?.(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ videoUrl: key, error: '' });
        } else {
          resolve({ videoUrl: '', error: `Upload failed with status ${xhr.status}` });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ videoUrl: '', error: 'Network error during upload' });
      });

      xhr.addEventListener('abort', () => {
        resolve({ videoUrl: '', error: 'Upload cancelled' });
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', videoFile.type || 'video/quicktime');
      xhr.send(videoFile);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      videoUrl: '',
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};