'use client';

import { useState, useEffect } from 'react';
import { Stream } from '@cloudflare/stream-react';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

interface SecureVideoPlayerProps {
  videoKey: string; // Cloudflare Stream video UID (or R2 key for backward compatibility)
  recipeId: string;
  className?: string;
  thumbnail: string;
}

/**
 * Secure video player using Cloudflare Stream with signed tokens
 *
 * Works for both public and premium recipes:
 * - Public: generates token without purchase check
 * - Premium: verifies user purchase before issuing token
 *
 * All videos use signed URLs for unified security and analytics
 */
export const SecureVideoPlayer = ({
  videoKey,
  recipeId,
  className = '',
  thumbnail,
}: SecureVideoPlayerProps) => {
  const t = useTranslations('common.video');
  const [signedToken, setSignedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if this is a legacy R2 video (contains '/' in the key)
  const isLegacyR2Video = videoKey?.includes('/') ?? false;

  useEffect(() => {
    // Skip if no videoKey
    if (!videoKey) {
      setIsLoading(false);
      return;
    }
    const fetchSignedToken = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // For legacy R2 videos, use old API
        if (isLegacyR2Video) {
          const response = await fetch('/api/video/view-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoKey: videoKey, recipeId }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to load video');
          }

          const { viewUrl } = await response.json();
          setSignedToken(viewUrl); // For R2, this is the presigned URL
        } else {
          // For Stream videos, get signed token
          const response = await fetch('/api/stream/view-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoKey, recipeId }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to load video');
          }

          const { token } = await response.json();
          setSignedToken(token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedToken();
  }, [videoKey, recipeId, isLegacyR2Video]);

  // Auto-refresh token before it expires (every 90 minutes for 2-hour tokens)
  useEffect(() => {
    if (!videoKey || isLegacyR2Video) return;

    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/stream/view-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoKey, recipeId }),
        });

        if (response.ok) {
          const { token } = await response.json();
          setSignedToken(token);
        }
      } catch (err) {
        console.error('Failed to refresh token:', err);
        // Don't show error to user, just log it
        // Video will continue playing with old token until it expires
      }
    }, 90 * 60 * 1000); // 90 minutes

    return () => clearInterval(refreshInterval);
  }, [videoKey, recipeId, isLegacyR2Video]);

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl aspect-video ${className}`}
      >
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-4 ${className}`}
      >
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!videoKey || !signedToken) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-8 ${className}`}
      >
        <p className="text-gray-600 dark:text-gray-300 text-center font-medium">
          {t('comingSoon')}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-center text-sm mt-2">
          {t('tryReload')}
        </p>
      </div>
    );
  }

  // Legacy R2 video: use regular video element
  if (isLegacyR2Video) {
    return (
      <video
        className={`rounded-xl ${className}`}
        src={signedToken}
        controls
        playsInline
      />
    );
  }

  // Stream video: use Cloudflare Stream React component
  return (
    <div className={`overflow-hidden ${className}`}>
      <Stream
        controls
        src={signedToken}
        responsive={true}
        // Additional Stream player options
        preload="metadata"
        poster={thumbnail}
        // Disable ads (if you have Stream Pro)
        // ad-url=""
      />
    </div>
  );
};