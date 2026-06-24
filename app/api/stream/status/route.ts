import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import { getStreamVideo } from '@/lib/cloudflare-stream/client';

/**
 * POST /api/stream/status
 *
 * Check video processing status in Cloudflare Stream
 *
 * Body (JSON):
 * - videoUid: string (Cloudflare Stream video UID)
 *
 * Returns:
 * - readyToStream: boolean (whether video is ready for playback)
 * - status: object (full status info)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoUid } = await request.json();

    if (!videoUid) {
      return NextResponse.json(
        { error: 'Missing video UID' },
        { status: 400 }
      );
    }

    // Get video details from Cloudflare Stream
    const videoDetails = await getStreamVideo(videoUid);

    return NextResponse.json({
      readyToStream: videoDetails.readyToStream ?? false,
      status: {
        state: videoDetails.status?.state,
        pctComplete: videoDetails.status?.pctComplete,
        errorReasonCode: videoDetails.status?.errorReasonCode,
        errorReasonText: videoDetails.status?.errorReasonText,
      },
      duration: videoDetails.duration,
      thumbnail: videoDetails.thumbnail,
    });
  } catch (error) {
    console.error('Stream status error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to get video status',
      },
      { status: 500 }
    );
  }
}