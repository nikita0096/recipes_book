/**
 * Cloudflare Stream API Client Configuration
 *
 * This module provides configuration and helper functions for interacting
 * with the Cloudflare Stream API for video uploads, management, and deletion.
 */

// Environment variables
export const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
export const CLOUDFLARE_STREAM_API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;
export const CLOUDFLARE_STREAM_CUSTOMER_CODE = process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE;

// Validate required environment variables
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_STREAM_API_TOKEN || !CLOUDFLARE_STREAM_CUSTOMER_CODE) {
  console.warn(
    'Missing Cloudflare Stream environment variables. Please check .env.local:\n' +
    '- CLOUDFLARE_ACCOUNT_ID\n' +
    '- CLOUDFLARE_STREAM_API_TOKEN\n' +
    '- CLOUDFLARE_STREAM_CUSTOMER_CODE\n' +
    'See CLOUDFLARE_STREAM_SETUP.md for setup instructions.'
  );
}

// Base API URL
export const STREAM_API_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream`;

/**
 * Get default headers for Cloudflare Stream API requests
 */
export function getStreamHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${CLOUDFLARE_STREAM_API_TOKEN}`,
  };
}

/**
 * Get headers for JSON requests
 */
export function getStreamJsonHeaders(): HeadersInit {
  return {
    ...getStreamHeaders(),
    'Content-Type': 'application/json',
  };
}

/**
 * Create a Direct Creator Upload URL
 * Client will upload directly to this URL
 *
 * @param metadata - Video metadata (recipeId, isPremium, etc.)
 * @param maxDurationSeconds - Maximum video duration (default 3600 = 1 hour)
 * @returns Upload URL and video UID
 */
export async function createDirectUploadUrl(
  metadata: Record<string, string>,
  maxDurationSeconds: number = 3600
): Promise<{ uploadUrl: string; uid: string }> {
  const response = await fetch(`${STREAM_API_BASE_URL}/direct_upload`, {
    method: 'POST',
    headers: getStreamJsonHeaders(),
    body: JSON.stringify({
      maxDurationSeconds,
      meta: metadata,
      requireSignedURLs: true, // Enable signed URLs by default
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ errors: [{ message: 'Upload failed' }] }));
    const errorMessage = error.errors?.[0]?.message || 'Failed to create upload URL';
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return {
    uploadUrl: data.result.uploadURL,
    uid: data.result.uid,
  };
}

/**
 * Update video settings (enable signed URLs, update metadata, etc.)
 *
 * @param videoUid - Cloudflare Stream video UID
 * @param settings - Settings to update
 */
export async function updateStreamVideo(
  videoUid: string,
  settings: {
    requireSignedURLs?: boolean;
    meta?: Record<string, string>;
  }
): Promise<void> {
  const response = await fetch(`${STREAM_API_BASE_URL}/${videoUid}`, {
    method: 'POST',
    headers: getStreamJsonHeaders(),
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(error.message || 'Failed to update video settings');
  }
}

/**
 * Delete video from Cloudflare Stream
 *
 * @param videoUid - Cloudflare Stream video UID
 */
export async function deleteStreamVideo(videoUid: string): Promise<void> {
  const response = await fetch(`${STREAM_API_BASE_URL}/${videoUid}`, {
    method: 'DELETE',
    headers: getStreamHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message || 'Failed to delete video from Stream');
  }
}

/**
 * Get video details from Cloudflare Stream
 *
 * @param videoUid - Cloudflare Stream video UID
 * @returns Video details
 */
export async function getStreamVideo(videoUid: string): Promise<any> {
  const response = await fetch(`${STREAM_API_BASE_URL}/${videoUid}`, {
    method: 'GET',
    headers: getStreamHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Fetch failed' }));
    throw new Error(error.message || 'Failed to fetch video details');
  }

  const data = await response.json();
  return data.result;
}

/**
 * Get embed URL for public video (no signed URL required)
 * Note: This only works if requireSignedURLs is false
 *
 * @param videoUid - Cloudflare Stream video UID
 * @returns Embed URL
 */
export function getPublicEmbedUrl(videoUid: string): string {
  return `https://customer-${CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoUid}/iframe`;
}