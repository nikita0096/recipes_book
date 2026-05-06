import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET } from '@/lib/r2/client';
import { createClient } from '@/lib/supabase/ServerComponentClient';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { videoKey, recipeId } = await request.json();

    const {data: isPremium} = await supabase
      .from('recipes')
      .select('is_premium')
      .eq('id', recipeId)
      .single();

    // Check if user has purchased this recipe (if it's premium)
    if (user && recipeId && isPremium?.is_premium) {
      const {data: recipeData} = await supabase
        .from('recipes')
        .select('premium_recipe')
        .eq('id', recipeId)
        .single();


      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('premium_recipe_id', recipeData?.premium_recipe)
        .single();

      // Also check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';

      if (!purchase && !isAdmin) {
        return NextResponse.json(
          { error: 'Recipe not purchased' },
          { status: 403 }
        );
      }
    }

    if (!videoKey) {
      return NextResponse.json(
        { error: 'Missing video key' },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: videoKey,
    });

    // URL valid for 2 hours (enough time to watch the video)
    const viewUrl = await getSignedUrl(r2Client, command, { expiresIn: 7200 });

    return NextResponse.json({ viewUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate view URL' },
      { status: 500 }
    );
  }
}