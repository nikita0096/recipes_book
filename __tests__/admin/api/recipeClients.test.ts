import { createRecipe } from '@/services/api/admin/createRecipe';
import { deleteRecipe } from '@/services/api/admin/deleteRecipe';
import { togglePublishStatus } from '@/services/api/admin/togglePublishStatus';
import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from '@/services/api/admin/updateRecipe';

const okJson = (body: unknown) =>
  ({ ok: true, json: jest.fn().mockResolvedValue(body) }) as unknown as Response;
const errJson = (status: number, body: unknown) =>
  ({ ok: false, status, json: jest.fn().mockResolvedValue(body) }) as unknown as Response;

const lastCall = () => (global.fetch as jest.Mock).mock.calls[0];
const lastBody = () => JSON.parse(lastCall()[1].body as string);

describe('admin recipe client wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue(okJson({ success: true }));
  });

  describe('createRecipe', () => {
    test('POSTs the payload to /api/admin/recipes', async () => {
      const payload = { isPremium: false as const, recipe: { id: 'r1' } } as never;
      await createRecipe(payload);

      const [url, init] = lastCall();
      expect(url).toBe('/api/admin/recipes');
      expect(init.method).toBe('POST');
      expect(lastBody()).toEqual({ isPremium: false, recipe: { id: 'r1' } });
    });

    test('throws with the API error message on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(errJson(500, { error: 'create failed' }));

      await expect(
        createRecipe({ isPremium: false, recipe: {} } as never)
      ).rejects.toThrow('create failed');
    });
  });

  describe('deleteRecipe', () => {
    test('DELETEs /api/admin/recipes/:id with videoKey and returns no error', async () => {
      const result = await deleteRecipe({ id: 'r1', videoKey: 'vid-1' });

      const [url, init] = lastCall();
      expect(url).toBe('/api/admin/recipes/r1');
      expect(init.method).toBe('DELETE');
      expect(lastBody()).toEqual({ videoKey: 'vid-1' });
      expect(result).toEqual({ error: null });
    });

    test('returns the error message on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(errJson(500, { error: 'delete failed' }));

      const result = await deleteRecipe({ id: 'r1', videoKey: null });

      expect(result).toEqual({ error: 'delete failed' });
    });
  });

  describe('togglePublishStatus', () => {
    test('PATCHes the publish route and returns parsed body', async () => {
      global.fetch = jest.fn().mockResolvedValue(okJson({ id: 'r1', isPublished: true }));

      const result = await togglePublishStatus('r1', true);

      const [url, init] = lastCall();
      expect(url).toBe('/api/admin/recipes/r1/publish');
      expect(init.method).toBe('PATCH');
      expect(lastBody()).toEqual({ isPublished: true });
      expect(result).toEqual({ id: 'r1', isPublished: true });
    });

    test('throws on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue(errJson(403, { error: 'forbidden' }));

      await expect(togglePublishStatus('r1', false)).rejects.toThrow('forbidden');
    });
  });

  describe('updateRecipe wrappers', () => {
    test('updateRecipePublic sends public/public discriminator', async () => {
      global.fetch = jest.fn().mockResolvedValue(okJson({ data: { id: 'r1' }, error: null }));

      const result = await updateRecipePublic({ d: 1 } as never, 'r1');

      const [url, init] = lastCall();
      expect(url).toBe('/api/admin/recipes/r1');
      expect(init.method).toBe('PATCH');
      expect(lastBody()).toEqual({ isPremium: false, wasPremium: false, data: { d: 1 } });
      expect(result).toEqual({ data: { id: 'r1' }, error: null });
    });

    test('convertPremiumToPublic sends public/wasPremium discriminator', async () => {
      global.fetch = jest.fn().mockResolvedValue(okJson({ data: {}, error: null }));

      await convertPremiumToPublic({ d: 1 } as never, 'r1');

      expect(lastBody()).toEqual({ isPremium: false, wasPremium: true, data: { d: 1 } });
    });

    test('updateRecipePremium sends premium/premium discriminator', async () => {
      global.fetch = jest.fn().mockResolvedValue(okJson({ data: {}, error: null }));

      await updateRecipePremium({ m: 1 } as never, { p: 1 } as never, 'r1');

      expect(lastBody()).toEqual({
        isPremium: true,
        wasPremium: true,
        mainData: { m: 1 },
        premiumData: { p: 1 },
      });
    });

    test('convertPublicToPremium sends premium/wasPublic discriminator', async () => {
      global.fetch = jest.fn().mockResolvedValue(okJson({ data: {}, error: null }));

      await convertPublicToPremium({ m: 1 } as never, { p: 1 } as never, 'r1');

      expect(lastBody()).toEqual({
        isPremium: true,
        wasPremium: false,
        mainData: { m: 1 },
        premiumData: { p: 1 },
      });
    });

    test('returns { data: null, error } on a failed response', async () => {
      global.fetch = jest.fn().mockResolvedValue(errJson(400, { error: 'bad update' }));

      const result = await updateRecipePublic({ d: 1 } as never, 'r1');

      expect(result).toEqual({ data: null, error: 'bad update' });
    });
  });
});
