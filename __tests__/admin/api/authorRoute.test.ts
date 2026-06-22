/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { PATCH } from '@/app/api/admin/author/[id]/route';
import { updateAuthorInfo } from '@/services/db/author/updateAuthorInfo';

jest.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/services/db/author/updateAuthorInfo', () => ({
  updateAuthorInfo: jest.fn(),
}));

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;
const mockUpdateAuthor = updateAuthorInfo as jest.MockedFunction<typeof updateAuthorInfo>;

const req = (body: unknown) => ({ json: async () => body }) as never;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('admin author route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null);
  });

  test('returns the requireAdmin denial response when unauthorized', async () => {
    mockRequireAdmin.mockResolvedValue(
      NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    );

    const res = await PATCH(req({}), params('a1'));

    expect(res.status).toBe(403);
    expect(mockUpdateAuthor).not.toHaveBeenCalled();
  });

  test('forwards id + payload and returns the mapped author', async () => {
    const payload = { name: 'Yuliia', image: 'author-x.jpg' };
    mockUpdateAuthor.mockResolvedValue({ data: { id: 'a1' }, error: null } as never);

    const res = await PATCH(req(payload), params('a1'));

    expect(mockUpdateAuthor).toHaveBeenCalledWith('a1', payload);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: { id: 'a1' }, error: null });
  });

  test('maps a thrown error to 500', async () => {
    mockUpdateAuthor.mockRejectedValue(new Error('update failed'));

    const res = await PATCH(req({}), params('a1'));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: 'update failed' });
  });
});
