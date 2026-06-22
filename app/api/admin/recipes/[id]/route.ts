import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { deleteRecipe } from '@/services/db/admin/deleteRecipe';
import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from '@/services/db/admin/updateRecipe';
import {
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
} from '@/types/recipe';

type UpdateRecipePayload =
  | { isPremium: false; wasPremium: boolean; data: UpdateRecipeDataPublic }
  | {
      isPremium: true;
      wasPremium: boolean;
      mainData: UpdateRecipeDataPremiumMain;
      premiumData: UpdateRecipeDataPremiumPart;
    };

/**
 * PATCH /api/admin/recipes/[id]
 *
 * Admin-only. Updates a recipe, handling all four premium/public transitions.
 * Images/video are uploaded client-side first; the body carries storage paths.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const denied = await requireAdmin();
  if (denied) return denied;

  let payload: UpdateRecipePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    let result;

    if (payload.isPremium) {
      result = payload.wasPremium
        ? await updateRecipePremium(payload.mainData, payload.premiumData, id)
        : await convertPublicToPremium(payload.mainData, payload.premiumData, id);
    } else {
      result = payload.wasPremium
        ? await convertPremiumToPublic(payload.data, id)
        : await updateRecipePublic(payload.data, id);
    }

    return NextResponse.json(result, { status: result.error ? 400 : 200 });
  } catch (error) {
    console.error('Error updating recipe:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update recipe';
    return NextResponse.json({ data: null, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/recipes/[id]
 *
 * Admin-only. Deletes a recipe row plus its storage images and Stream video.
 * Body (optional): { videoKey?: string | null } — if omitted, the video key is
 * resolved from the premium table server-side.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const denied = await requireAdmin();
  if (denied) return denied;

  let videoKey: string | null = null;
  try {
    const body = await request.json();
    videoKey = body?.videoKey ?? null;
  } catch {
    // No body provided; video key will be resolved from the premium table.
  }

  const { error } = await deleteRecipe({ id, videoKey });

  if (error) {
    const message =
      typeof error === 'string'
        ? error
        : (error as { message?: string }).message ?? 'Failed to delete recipe';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
