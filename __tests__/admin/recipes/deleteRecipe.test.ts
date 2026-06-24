import type { SupabaseClient } from '@supabase/supabase-js';
import { deleteRecipe } from '@/services/db/admin/deleteRecipe';
import { deleteRecipeVideo } from '@/services/storage/server/deleteRecipeVideo';
import { createClient } from '@/lib/supabase/ServerComponentClient';

// Mock the server-only video deletion helper
jest.mock('@/services/storage/server/deleteRecipeVideo', () => ({
  deleteRecipeVideo: jest.fn(),
}));

// deleteRecipe creates its own request-scoped client; mock the factory.
jest.mock('@/lib/supabase/ServerComponentClient', () => ({
  createClient: jest.fn(),
}));

const mockDeleteRecipeVideo = deleteRecipeVideo as jest.MockedFunction<
  typeof deleteRecipeVideo
>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

// Build a minimal mock Supabase client and register it as the value the
// service's createClient() call resolves to. `from` and `storage.from` are
// supplied per-test so each scenario can wire up its own chained query mocks.
const makeSupabase = (overrides: {
  from?: jest.Mock;
  storageFrom?: jest.Mock;
}): SupabaseClient => {
  const client = {
    from: overrides.from ?? jest.fn(),
    storage: { from: overrides.storageFrom ?? jest.fn() },
  } as unknown as SupabaseClient;

  mockCreateClient.mockResolvedValue(client);

  return client;
};

describe('deleteRecipe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteRecipeVideo.mockResolvedValue({ success: true, error: '' });
  });

  describe('Delete public recipe with video', () => {
    test('should delete recipe and video successfully', async () => {
      // videoKey is provided, so there is no premium lookup — only the delete.
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockHeroList = jest
        .fn()
        .mockResolvedValue({ data: [{ name: 'hero-img.jpg' }], error: null });
      const mockHeroRemove = jest.fn().mockResolvedValue({ error: null });
      const mockStepsList = jest
        .fn()
        .mockResolvedValue({ data: [{ name: 'step-1.jpg' }], error: null });
      const mockStepsRemove = jest.fn().mockResolvedValue({ error: null });

      const from = jest.fn().mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageFromCallCount = 0;
      const storageFrom = jest.fn(() => {
        storageFromCallCount++;
        if (storageFromCallCount === 1) return { list: mockHeroList };
        if (storageFromCallCount === 2) return { remove: mockHeroRemove };
        if (storageFromCallCount === 3) return { list: mockStepsList };
        return { remove: mockStepsRemove };
      });

      makeSupabase({ from, storageFrom });

      const result = await deleteRecipe({
        id: 'recipe-123',
        videoKey: 'video-key-123',
      });

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'recipe-123');

      expect(mockHeroList).toHaveBeenCalledWith('recipe-123');
      expect(mockHeroRemove).toHaveBeenCalledWith(['recipe-123/hero-img.jpg']);

      expect(mockStepsList).toHaveBeenCalledWith('recipe-123');
      expect(mockStepsRemove).toHaveBeenCalledWith(['recipe-123/step-1.jpg']);

      expect(mockDeleteRecipeVideo).toHaveBeenCalledWith('video-key-123');

      expect(result.error).toBeNull();
    });
  });

  describe('Delete premium recipe', () => {
    test('should get video key from premium table if not provided', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { video_url: 'premium-video-key' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      const from = jest
        .fn()
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      const storageFrom = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      makeSupabase({ from, storageFrom });

      const result = await deleteRecipe({
        id: 'recipe-premium',
        videoKey: null,
      });

      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('recipe_id', 'recipe-premium');

      expect(mockDeleteRecipeVideo).toHaveBeenCalledWith('premium-video-key');

      expect(result.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    test('should return error if database delete fails', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockDeleteEq = jest
        .fn()
        .mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const from = jest
        .fn()
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      makeSupabase({ from });

      const result = await deleteRecipe({
        id: 'recipe-123',
        videoKey: null,
      });

      expect(result.error).toEqual({ message: 'Delete failed' });
    });

    test('should return error if storage list fails', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockList = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'List failed' },
      });

      const from = jest
        .fn()
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      const storageFrom = jest.fn(() => ({ list: mockList }));

      makeSupabase({ from, storageFrom });

      const result = await deleteRecipe({
        id: 'recipe-123',
        videoKey: null,
      });

      expect(result.error).toEqual({ message: 'List failed' });
    });

    test('should handle video deletion error', async () => {
      mockDeleteRecipeVideo.mockResolvedValue({
        success: false,
        error: 'Video delete failed',
      });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      const from = jest.fn().mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      const storageFrom = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      makeSupabase({ from, storageFrom });

      const result = await deleteRecipe({
        id: 'recipe-123',
        videoKey: 'video-key',
      });

      expect(result.error).toEqual('Video delete failed');
    });
  });

  describe('Handle recipes without images', () => {
    test('should succeed even if no images to delete', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      const from = jest
        .fn()
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      const storageFrom = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      makeSupabase({ from, storageFrom });

      const result = await deleteRecipe({
        id: 'recipe-123',
        videoKey: null,
      });

      expect(result.error).toBeNull();
    });
  });
});
