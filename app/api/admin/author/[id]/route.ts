import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  updateAuthorInfo,
  UpdateAuthorPayload,
} from '@/services/db/author/updateAuthorInfo';

/**
 * PATCH /api/admin/author/[id]
 *
 * Admin-only. Updates the author row. The image is uploaded client-side first;
 * the body carries the resolved storage path along with the other fields.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const denied = await requireAdmin();
  if (denied) return denied;

  let payload: UpdateAuthorPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const result = await updateAuthorInfo(id, payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating author:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update author';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
