/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { POST } from '@/app/api/admin/recipes/route';
import { DELETE, PATCH } from '@/app/api/admin/recipes/[id]/route';
import { PATCH as PUBLISH_PATCH } from '@/app/api/admin/recipes/[id]/publish/route';
import {
  insertRecipePublic,
  insertRecipePremiumMain,
} from '@/services/db/admin/insertRecipeToDatabase';
import { insertPremiumRecipePart } from '@/services/db/admin/insertPremiumRecipeToDb';
import { deleteRecipe } from '@/services/db/admin/deleteRecipe';
import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from '@/services/db/admin/updateRecipe';
import { togglePublishStatus } from '@/services/db/admin/togglePublishStatus';

jest.mock('@/lib/auth/requireAdmin', () => ({ requireAdmin: jest.fn() }));
jest.mock('@/services/db/admin/insertRecipeToDatabase', () => ({
  insertRecipePublic: jest.fn(),
  insertRecipePremiumMain: jest.fn(),
}));
jest.mock('@/services/db/admin/insertPremiumRecipeToDb', () => ({
  insertPremiumRecipePart: jest.fn(),
}));
jest.mock('@/services/db/admin/deleteRecipe', () => ({ deleteRecipe: jest.fn() }));
jest.mock('@/services/db/admin/updateRecipe', () => ({
  updateRecipePublic: jest.fn(),
  updateRecipePremium: jest.fn(),
  convertPublicToPremium: jest.fn(),
  convertPremiumToPublic: jest.fn(),
}));
jest.mock('@/services/db/admin/togglePublishStatus', () => ({
  togglePublishStatus: jest.fn(),
}));

const mockRequireAdmin = requireAdmin as jest.MockedFunction<typeof requireAdmin>;

// Minimal NextRequest stub — handlers only call request.json().
const req = (body: unknown) => ({ json: async () => body }) as never;
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('admin recipes routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAdmin.mockResolvedValue(null); // allowed by default
  });

  describe('auth gating', () => {
    test('POST returns the requireAdmin denial response', async () => {
      mockRequireAdmin.mockResolvedValue(
        NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      );

      const res = await POST(req({ isPremium: false, recipe: {} }));

      expect(res.status).toBe(403);
      expect(insertRecipePublic).not.toHaveBeenCalled();
    });

    test('DELETE returns the denial response when unauthorized', async () => {
      mockRequireAdmin.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const res = await DELETE(req({ videoKey: null }), params('r1'));

      expect(res.status).toBe(401);
      expect(deleteRecipe).not.toHaveBeenCalled();
    });
  });

  describe('POST (create)', () => {
    test('public payload calls insertRecipePublic', async () => {
      const recipe = { id: 'r1', isPremium: false };
      const res = await POST(req({ isPremium: false, recipe }));

      expect(insertRecipePublic).toHaveBeenCalledWith(recipe);
      expect(insertRecipePremiumMain).not.toHaveBeenCalled();
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ success: true });
    });

    test('premium payload calls premium main + premium part', async () => {
      const main = { id: 'r2' };
      const premium = { id: 'p2', recipeId: 'r2' };
      await POST(req({ isPremium: true, main, stepsCount: 3, premium }));

      expect(insertRecipePremiumMain).toHaveBeenCalledWith(main, 3);
      expect(insertPremiumRecipePart).toHaveBeenCalledWith(premium);
      expect(insertRecipePublic).not.toHaveBeenCalled();
    });

    test('maps a service error to 500', async () => {
      (insertRecipePublic as jest.Mock).mockRejectedValue(new Error('insert failed'));

      const res = await POST(req({ isPremium: false, recipe: {} }));

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'insert failed' });
    });
  });

  describe('DELETE', () => {
    test('forwards id + videoKey and returns success', async () => {
      (deleteRecipe as jest.Mock).mockResolvedValue({ error: null });

      const res = await DELETE(req({ videoKey: 'vid-1' }), params('r1'));

      expect(deleteRecipe).toHaveBeenCalledWith({ id: 'r1', videoKey: 'vid-1' });
      expect(res.status).toBe(200);
    });

    test('maps a service error to 500', async () => {
      (deleteRecipe as jest.Mock).mockResolvedValue({ error: { message: 'boom' } });

      const res = await DELETE(req({}), params('r1'));

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'boom' });
    });
  });

  describe('PATCH (update transitions)', () => {
    test('premium → premium calls updateRecipePremium', async () => {
      (updateRecipePremium as jest.Mock).mockResolvedValue({ data: { ok: 1 }, error: null });

      const res = await PATCH(
        req({ isPremium: true, wasPremium: true, mainData: { m: 1 }, premiumData: { p: 1 } }),
        params('r1')
      );

      expect(updateRecipePremium).toHaveBeenCalledWith({ m: 1 }, { p: 1 }, 'r1');
      expect(res.status).toBe(200);
    });

    test('public → premium calls convertPublicToPremium', async () => {
      (convertPublicToPremium as jest.Mock).mockResolvedValue({ data: {}, error: null });

      await PATCH(
        req({ isPremium: true, wasPremium: false, mainData: { m: 1 }, premiumData: { p: 1 } }),
        params('r1')
      );

      expect(convertPublicToPremium).toHaveBeenCalledWith({ m: 1 }, { p: 1 }, 'r1');
    });

    test('premium → public calls convertPremiumToPublic', async () => {
      (convertPremiumToPublic as jest.Mock).mockResolvedValue({ data: {}, error: null });

      await PATCH(req({ isPremium: false, wasPremium: true, data: { d: 1 } }), params('r1'));

      expect(convertPremiumToPublic).toHaveBeenCalledWith({ d: 1 }, 'r1');
    });

    test('public → public calls updateRecipePublic', async () => {
      (updateRecipePublic as jest.Mock).mockResolvedValue({ data: {}, error: null });

      await PATCH(req({ isPremium: false, wasPremium: false, data: { d: 1 } }), params('r1'));

      expect(updateRecipePublic).toHaveBeenCalledWith({ d: 1 }, 'r1');
    });

    test('service error returns 400 with the error body', async () => {
      (updateRecipePublic as jest.Mock).mockResolvedValue({ data: null, error: 'nope' });

      const res = await PATCH(
        req({ isPremium: false, wasPremium: false, data: {} }),
        params('r1')
      );

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ data: null, error: 'nope' });
    });
  });

  describe('PATCH publish', () => {
    test('toggles publish status', async () => {
      (togglePublishStatus as jest.Mock).mockResolvedValue({ id: 'r1', isPublished: true });

      const res = await PUBLISH_PATCH(req({ isPublished: true }), params('r1'));

      expect(togglePublishStatus).toHaveBeenCalledWith('r1', true);
      expect(res.status).toBe(200);
      await expect(res.json()).resolves.toEqual({ id: 'r1', isPublished: true });
    });

    test('maps a thrown error to 500', async () => {
      (togglePublishStatus as jest.Mock).mockRejectedValue(new Error('rls denied'));

      const res = await PUBLISH_PATCH(req({ isPublished: false }), params('r1'));

      expect(res.status).toBe(500);
      await expect(res.json()).resolves.toEqual({ error: 'rls denied' });
    });
  });
});
