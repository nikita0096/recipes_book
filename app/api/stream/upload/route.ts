import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import { createDirectUploadUrl } from '@/lib/cloudflare-stream/client';

/**
 * POST /api/stream/upload
 *
 * Create a Direct Creator Upload URL for Cloudflare Stream
 * Client will upload the video directly to Cloudflare
 *
 * Body (JSON):
 * - isPremium: boolean (whether this is a premium recipe)
 * - recipeId: string (recipe ID for metadata)
 *
 * Returns:
 * - uploadUrl: string (URL to upload video directly to Cloudflare)
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

    // Parse JSON body
    const { isPremium, recipeId, size, name } = await request.json();

    if (!recipeId) {
      return NextResponse.json(
        { error: 'Missing recipe ID' },
        { status: 400 }
      );
    }

    const metadata = {
      recipeId,
      isPremium: String(isPremium ?? false),
      uploadedBy: user.id,
      uploadedAt: new Date().toISOString(),
    };

    // Create Direct Upload URL with metadata
    const { uploadUrl, uid: videoUid } = await createDirectUploadUrl(
      metadata,
      size,
      name,
      {
        watermarkUid: 'd9b4afd0610f47504532987942029f9a',
      }
    );

    return NextResponse.json({
      uploadUrl,
      videoUid,
      message: 'Upload URL created successfully',
    });
  } catch (error) {
    console.error('Stream upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create upload URL',
      },
      { status: 500 }
    );
  }
}