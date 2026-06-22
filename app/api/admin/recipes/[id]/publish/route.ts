import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { togglePublishStatus } from '@/services/db/admin/togglePublishStatus';

/**
 * PATCH /api/admin/recipes/[id]/publish
 *
 * Admin-only. Publishes or unpublishes a recipe.
 * Body: { isPublished: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const denied = await requireAdmin();
  if (denied) return denied;

  let isPublished: boolean;
  try {
    const body = await request.json();
    isPublished = Boolean(body?.isPublished);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const result = await togglePublishStatus(id, isPublished);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error toggling publish status:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update publish status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
