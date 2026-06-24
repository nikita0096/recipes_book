import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import { generateStreamToken } from '@/lib/cloudflare-stream/generateToken';

/**
 * POST /api/stream/view-url
 *
 * Generate a signed token for viewing a video in Cloudflare Stream
 *
 * For PUBLIC recipes:
 * - Simply generate a signed token (no purchase check needed)
 *
 * For PREMIUM recipes:
 * - Verify user has purchased the recipe
 * - Check if user is admin (admins have full access)
 * - Only return token if authorized
 *
 * Body:
 * - videoId: string (Cloudflare Stream video UID)
 * - recipeId: string (Recipe ID for access control)
 *
 * Returns:
 * - token: string (Signed JWT token to use with Stream player)
 * - expiresIn: number (Token validity in seconds)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - public recipes can be viewed by anyone)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    // Support both videoId and videoKey for compatibility
    const videoId = body.videoId || body.videoKey;
    const recipeId = body.recipeId;

    if (!videoId || !recipeId) {
      return NextResponse.json(
        { error: 'Missing videoId or recipeId' },
        { status: 400 }
      );
    }

    // Get recipe details to check if it's premium
    const { data: recipe } = await supabase
      .from('recipes')
      .select('is_premium, premium_recipe')
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const isPremium = recipe.is_premium;

    // For PREMIUM recipes: verify access
    if (isPremium) {
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required for premium content' },
          { status: 401 }
        );
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = profile?.role === 'admin';

      // If not admin, check if user has purchased the recipe
      if (!isAdmin) {
        const { data: purchase } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('premium_recipe_id', recipe.premium_recipe)
          .single();

        if (!purchase) {
          return NextResponse.json(
            { error: 'Recipe not purchased' },
            { status: 403 }
          );
        }
      }
    }

    // For PUBLIC recipes: anyone can get a token (no purchase check)
    // For PREMIUM recipes: only authorized users reach this point

    // Generate signed token (valid for 2 hours)
    const expiresIn = 7200; // 2 hours in seconds
    const token = generateStreamToken({
      videoId,
      expiresIn,
      userId: user?.id, // Include user ID for analytics (optional)
    });

    return NextResponse.json({
      token,
      expiresIn,
    });
  } catch (error) {
    console.error('Error generating view token:', error);
    return NextResponse.json(
      { error: 'Failed to generate view token' },
      { status: 500 }
    );
  }
}