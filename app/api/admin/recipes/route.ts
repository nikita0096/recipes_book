import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  insertRecipePublic,
  insertRecipePremiumMain,
} from '@/services/db/admin/insertRecipeToDatabase';
import { insertPremiumRecipePart } from '@/services/db/admin/insertPremiumRecipeToDb';
import {
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
  IRecipePremiumUpload,
} from '@/types/recipe';

type CreateRecipePayload =
  | { isPremium: false; recipe: IRecipeUploadPublic }
  | {
      isPremium: true;
      main: IRecipeUploadPremiumMain;
      stepsCount: number;
      premium: IRecipePremiumUpload;
    };

/**
 * POST /api/admin/recipes
 *
 * Admin-only. Persists a recipe whose images/video have already been uploaded
 * client-side (the body carries the resulting storage paths/keys). Premium
 * recipes write the main row plus the premium + price rows.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let payload: CreateRecipePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    if (payload.isPremium) {
      await insertRecipePremiumMain(payload.main, payload.stepsCount);
      await insertPremiumRecipePart(payload.premium);
    } else {
      await insertRecipePublic(payload.recipe);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating recipe:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create recipe';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
