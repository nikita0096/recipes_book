'use client';

import { useState, useEffect, useRef } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface SecureVideoPlayerProps {
  videoKey: string;  // R2 key stored in videoUrl field
  recipeId: string;
  className?: string;
}

export const SecureVideoPlayer = ({ videoKey, recipeId, className = '' }: SecureVideoPlayerProps) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/video/view-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoKey, recipeId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load video');
        }

        const { viewUrl } = await response.json();
        setVideoSrc(viewUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    if (videoKey) {
      fetchVideoUrl();
    }
  }, [videoKey, recipeId]);

  // Refresh URL before it expires (every 1.5 hours)
  useEffect(() => {
    if (!videoKey) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/video/view-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoKey, recipeId }),
        });

        if (response.ok) {
          const { viewUrl } = await response.json();
          setVideoSrc(viewUrl);
        }
      } catch(err) {
        setError(err instanceof Error ? err.message : 'Please reload the page');
      }
    }, 90 * 60 * 1000); // 90 minutes

    return () => clearInterval(refreshInterval);
  }, [videoKey, recipeId]);


  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4 ${className}`}>
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!videoSrc) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      className={`rounded-xl ${className}`}
      src={videoSrc}
      controls
      playsInline
    />
  );
};