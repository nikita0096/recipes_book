/**
 * @jest-environment node
 */
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/ServerComponentClient';

jest.mock('@/lib/supabase/ServerComponentClient', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Build a Supabase stub for the auth + profile-role lookup requireAdmin performs.
const makeSupabase = (user: { id: string } | null, role: string | null) => {
  const single = jest.fn().mockResolvedValue({ data: role ? { role } : null });
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  const client = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from,
  };
  mockCreateClient.mockResolvedValue(client as never);
  return client;
};

describe('requireAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 401 when there is no authenticated user', async () => {
    makeSupabase(null, null);

    const res = await requireAdmin();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('returns 403 when the user is not an admin', async () => {
    makeSupabase({ id: 'user-1' }, 'user');

    const res = await requireAdmin();

    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    await expect(res!.json()).resolves.toEqual({ error: 'Admin access required' });
  });

  test('returns 403 when the profile is missing', async () => {
    makeSupabase({ id: 'user-1' }, null);

    const res = await requireAdmin();

    expect(res!.status).toBe(403);
  });

  test('returns null (allowed) for an admin user', async () => {
    const client = makeSupabase({ id: 'admin-1' }, 'admin');

    const res = await requireAdmin();

    expect(res).toBeNull();
    expect(client.from).toHaveBeenCalledWith('profiles');
  });
});
