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
    'Tus-Resumable': '1.0.0'
  };
}

/**
 * Create a Direct Creator Upload URL
 * Client will upload directly to this URL
 *
 * @param metadata - Video metadata (recipeId, isPremium, etc.)
 * @param size - Upload length
 * @param name - Video file name
 * @param options - Additional options (maxDurationSeconds, watermarkUid)
 * @returns Upload URL and video UID
 */
export async function createDirectUploadUrl(
  metadata: Record<string, string>,
  size: number,
  name: string,
  options: { maxDurationSeconds?: number; watermarkUid?: string } = {}
): Promise<{ uploadUrl: string; uid: string }> {
  const { maxDurationSeconds = 3600, watermarkUid } = options;

  // Allow CORS for browser uploads (required for tus protocol)
  // Include all environments: localhost, staging, production
  const allowedOrigins = [
    'localhost:3000',
    process.env.NEXT_PUBLIC_STAGING_URL?.replace(/^https?:\/\//, ''),
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
  ].filter(Boolean).join(',');

  const uploadMetadata = [
    `name ${Buffer.from(name).toString('base64')}`,
    `allowedorigins ${Buffer.from(allowedOrigins).toString('base64')}`,
    `maxDurationSeconds ${Buffer.from(String(maxDurationSeconds)).toString('base64')}`,
    `requiresignedurls`,
  ];

  if (watermarkUid) {
    uploadMetadata.push(`watermark ${Buffer.from(watermarkUid).toString('base64')}`);
  }

  // Add custom metadata
  for (const [key, value] of Object.entries(metadata)) {
    uploadMetadata.push(`${key} ${Buffer.from(value).toString('base64')}`);
  }

  const response = await fetch(`${STREAM_API_BASE_URL}/?direct_user=true`, {
    method: 'POST',
    headers: {
      ...getStreamJsonHeaders(),
      "Upload-Length": String(size),
      "Upload-Metadata": uploadMetadata.join(','),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ errors: [{ message: 'Upload failed' }] }));
    console.error('Cloudflare Stream API error:', JSON.stringify(error, null, 2));
    const errorMessage = error.errors?.[0]?.message || 'Failed to create upload URL';
    throw new Error(errorMessage);
  }

  return {
    uploadUrl: response.headers.get('Location') || '',
    uid: response.headers.get('stream-media-id') || '',
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