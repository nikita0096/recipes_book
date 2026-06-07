/**
 * JWT Token Generation for Cloudflare Stream Signed URLs
 *
 * This module generates signed JWT tokens for secure video access.
 * Tokens are required when videos have requireSignedURLs enabled.
 */

import jwt from 'jsonwebtoken';

// Environment variables for signing
const SIGNING_KEY_ID = process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID;
const PRIVATE_KEY = process.env.CLOUDFLARE_STREAM_PRIVATE_KEY;

// Validate signing credentials
if (!SIGNING_KEY_ID || !PRIVATE_KEY) {
  console.warn(
    'Missing Cloudflare Stream signing credentials. Signed URLs will not work.\n' +
    'Required environment variables:\n' +
    '- CLOUDFLARE_STREAM_SIGNING_KEY_ID\n' +
    '- CLOUDFLARE_STREAM_PRIVATE_KEY\n' +
    'See CLOUDFLARE_STREAM_SETUP.md for setup instructions.'
  );
}

interface GenerateTokenOptions {
  videoId: string;
  expiresIn?: number; // seconds, default 2 hours
  userId?: string; // optional user ID for analytics
}

/**
 * Generate a signed JWT token for Cloudflare Stream video access
 *
 * @param options - Token generation options
 * @returns Signed JWT token
 *
 * @example
 * ```typescript
 * const token = generateStreamToken({
 *   videoId: 'abc123xyz',
 *   expiresIn: 7200, // 2 hours
 *   userId: 'user_123'
 * });
 * ```
 */
export function generateStreamToken(options: GenerateTokenOptions): string {
  const { videoId, expiresIn = 7200, userId } = options;

  if (!SIGNING_KEY_ID || !PRIVATE_KEY) {
    throw new Error('Cloudflare Stream signing credentials not configured');
  }

  // Normalize private key (replace escaped newlines)
  const privateKey = PRIVATE_KEY.replace(/\\n/g, '\n');

  // Current timestamp in seconds
  const now = Math.floor(Date.now() / 1000);

  // Token payload
  const payload: any = {
    sub: videoId, // Subject: video UID
    kid: SIGNING_KEY_ID, // Key ID
    exp: now + expiresIn, // Expiration time
    nbf: now - 60, // Not before (allow 1 minute clock skew)
  };

  // Optionally add user ID for analytics
  if (userId) {
    payload.uid = userId;
  }

  // Sign with RS256 algorithm
  try {
    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      header: {
        kid: SIGNING_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Error signing token:', error);
    throw new Error('Failed to generate signed token');
  }
}

/**
 * Generate a signed embed URL for Cloudflare Stream
 *
 * @param videoId - Cloudflare Stream video UID
 * @param customerCode - Customer code from Stream dashboard
 * @param expiresIn - Token expiration in seconds (default 2 hours)
 * @param userId - Optional user ID for analytics
 * @returns Full embed URL with signed token
 *
 * @example
 * ```typescript
 * const embedUrl = generateSignedEmbedUrl(
 *   'abc123xyz',
 *   'my-customer-code',
 *   7200,
 *   'user_123'
 * );
 * // Returns: https://customer-my-customer-code.cloudflarestream.com/abc123xyz/iframe?token=eyJ...
 * ```
 */
export function generateSignedEmbedUrl(
  videoId: string,
  customerCode: string,
  expiresIn: number = 7200,
  userId?: string
): string {
  const token = generateStreamToken({ videoId, expiresIn, userId });
  return `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe?token=${token}`;
}

/**
 * Verify if a token is still valid (not expired)
 *
 * @param token - JWT token to verify
 * @returns true if token is valid, false otherwise
 */
export function isTokenValid(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp > now;
  } catch {
    return false;
  }
}

/**
 * Get token expiration time in seconds from now
 *
 * @param token - JWT token
 * @returns Seconds until expiration, or 0 if expired/invalid
 */
export function getTokenExpirationTime(token: string): number {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return 0;

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp - now;

    return expiresIn > 0 ? expiresIn : 0;
  } catch {
    return 0;
  }
}