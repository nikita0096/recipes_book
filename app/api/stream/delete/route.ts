import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { deleteStreamVideo } from '@/lib/cloudflare-stream/client';

/**
 * POST /api/stream/delete
 *
 * Delete a video from Cloudflare Stream
 *
 * Admin-only endpoint for removing videos when:
 * - Recipe is deleted
 * - Video is being replaced with a new one
 *
 * Body:
 * - videoUid: string (Cloudflare Stream video UID)
 *
 * Returns:
 * - success: boolean
 * - message: string
 */
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    // Get video UID from request
    const { videoUid } = await request.json();

    if (!videoUid) {
      return NextResponse.json(
        { error: 'Missing video UID' },
        { status: 400 }
      );
    }

    // Delete from Cloudflare Stream
    await deleteStreamVideo(videoUid);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete video',
      },
      { status: 500 }
    );
  }
}