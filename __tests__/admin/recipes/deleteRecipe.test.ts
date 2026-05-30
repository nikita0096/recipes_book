import { deleteRecipe } from '@/services/db/admin/deleteRecipe';
import { supabase } from '@/lib/supabase/ClientComponentClient';
import { deleteVideo } from '@/services/storage/deleteVideoR2Bucket';

// Mock dependencies
jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

jest.mock('@/services/storage/deleteVideoR2Bucket', () => ({
  deleteVideo: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockDeleteVideo = deleteVideo as jest.MockedFunction<typeof deleteVideo>;

describe('deleteRecipe', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockDeleteVideo.mockResolvedValue({ error: null });
  });

  describe('Delete public recipe with video', () => {
    test('should delete recipe and video successfully', async () => {
      // Mock delete from database (videoKey is provided, so no premium check)
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // Mock storage operations
      const mockHeroList = jest.fn().mockResolvedValue({ data: [{ name: 'hero-img.jpg' }], error: null });
      const mockHeroRemove = jest.fn().mockResolvedValue({ error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [{ name: 'step-1.jpg' }], error: null });
      const mockStepsRemove = jest.fn().mockResolvedValue({ error: null });

      // Setup supabase.from() - only ONE call since videoKey is provided
      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      // Setup storage.from() with implementation
      let storageFromCallCount = 0;
      (mockSupabase.storage.from as jest.Mock) = jest.fn(() => {
        storageFromCallCount++;
        if (storageFromCallCount === 1) return { list: mockHeroList };
        if (storageFromCallCount === 2) return { remove: mockHeroRemove };
        if (storageFromCallCount === 3) return { list: mockStepsList };
        return { remove: mockStepsRemove };
      });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: 'video-key-123' });

      // Should delete from database
      expect(mockDelete).toHaveBeenCalled();
      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'recipe-123');

      // Should delete hero images
      expect(mockHeroList).toHaveBeenCalledWith('recipe-123');
      expect(mockHeroRemove).toHaveBeenCalledWith(['recipe-123/hero-img.jpg']);

      // Should delete step images
      expect(mockStepsList).toHaveBeenCalledWith('recipe-123');
      expect(mockStepsRemove).toHaveBeenCalledWith(['recipe-123/step-1.jpg']);

      // Should delete video
      expect(mockDeleteVideo).toHaveBeenCalledWith('video-key-123');

      expect(result.error).toBeNull();
    });
  });

  describe('Delete premium recipe', () => {
    test('should get video key from premium table if not provided', async () => {
      // Mock premium data check (has video) - chains: select -> eq -> maybeSingle
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { video_url: 'premium-video-key' },
        error: null,
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock delete from database
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // Mock storage lists (empty)
      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      mockSupabase.storage.from = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      const result = await deleteRecipe({ id: 'recipe-premium', videoKey: null });

      // Should fetch video from premium table
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('recipe_id', 'recipe-premium');

      // Should delete video from premium table
      expect(mockDeleteVideo).toHaveBeenCalledWith('premium-video-key');

      expect(result.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    test('should return error if database delete fails', async () => {
      // Mock premium check
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock delete with error
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toEqual({ message: 'Delete failed' });
    });

    test('should return error if storage list fails', async () => {
      // Mock premium check
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock delete success
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // Mock storage list with error
      const mockList = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'List failed' },
      });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      mockSupabase.storage.from = jest.fn(() => {
        return { list: mockList };
      });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toEqual({ message: 'List failed' });
    });

    test('should handle video deletion error', async () => {
      mockDeleteVideo.mockResolvedValue({ error: { message: 'Video delete failed' } });

      // Mock delete success (videoKey is provided, so no premium check)
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // Mock storage lists (empty)
      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      // Setup supabase.from() - only ONE call since videoKey is provided
      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      mockSupabase.storage.from = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: 'video-key' });

      expect(result.error).toEqual({ message: 'Video delete failed' });
    });
  });

  describe('Handle recipes without images', () => {
    test('should succeed even if no images to delete', async () => {
      // Mock premium check
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock delete success
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

      // Empty images list
      const mockHeroList = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockStepsList = jest.fn().mockResolvedValue({ data: [], error: null });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ delete: mockDelete }));

      let storageCallCount = 0;
      mockSupabase.storage.from = jest.fn(() => {
        storageCallCount++;
        if (storageCallCount === 1) return { list: mockHeroList };
        return { list: mockStepsList };
      });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toBeNull();
    });
  });
});
