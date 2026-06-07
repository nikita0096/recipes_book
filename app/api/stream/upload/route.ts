import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import {
  initiateStreamUpload,
  updateStreamVideo,
} from '@/lib/cloudflare-stream/client';

/**
 * POST /api/stream/upload
 *
 * Upload video to Cloudflare Stream with signed URL protection
 *
 * Body (FormData):
 * - videoFile: File (video file)
 * - isPremium: 'true' | 'false' (whether this is a premium recipe)
 * - recipeId: string (recipe ID for metadata)
 *
 * Returns:
 * - videoUid: string (Cloudflare Stream video UID to store in database)
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File;
    const isPremium = formData.get('isPremium') === 'true';
    const recipeId = formData.get('recipeId') as string;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'Missing video file' },
        { status: 400 }
      );
    }

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Missing recipe ID' },
        { status: 400 }
      );
    }

    // Upload video to Cloudflare Stream
    const { uid: videoUid } = await initiateStreamUpload(videoFile, {
      recipeId,
      isPremium: isPremium.toString(),
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    });

    // IMPORTANT: Enable signed URLs for ALL videos (both public and premium)
    // This provides unified security model and allows us to:
    // - Track all video views
    // - Control access programmatically
    // - Add analytics
    // - Rate limit if needed
    await updateStreamVideo(videoUid, {
      requireSignedURLs: true,
    });

    return NextResponse.json({
      videoUid,
      message: 'Video uploaded successfully',
    });
  } catch (error) {
    console.error('Stream upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to upload video',
      },
      { status: 500 }
    );
  }
}