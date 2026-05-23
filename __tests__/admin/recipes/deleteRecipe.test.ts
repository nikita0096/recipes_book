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
    jest.clearAllMocks();
    mockDeleteVideo.mockResolvedValue({ error: null });
  });

  describe('Delete public recipe with video', () => {
    test('should delete recipe and video successfully', async () => {
      // Mock premium data check (not premium)
      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      // Mock delete from database
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock storage list
      const mockList = jest.fn().mockResolvedValue({
        data: [
          { name: 'hero-img.jpg' },
          { name: 'step-1.jpg' },
        ],
        error: null,
      });

      // Mock storage remove
      const mockRemove = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      (mockSupabase.storage.from as jest.Mock)
        .mockReturnValueOnce({ list: mockList })
        .mockReturnValueOnce({ remove: mockRemove });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: 'video-key-123' });

      // Should delete from database
      expect(mockDelete).toHaveBeenCalled();

      // Should delete images
      expect(mockList).toHaveBeenCalledWith('recipe-123');
      expect(mockRemove).toHaveBeenCalledWith(['recipe-123/hero-img.jpg', 'recipe-123/step-1.jpg']);

      // Should delete video
      expect(mockDeleteVideo).toHaveBeenCalledWith('video-key-123');

      expect(result.error).toBeNull();
    });
  });

  describe('Delete premium recipe', () => {
    test('should get video key from premium table if not provided', async () => {
      // Mock premium data check (has video)
      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              video_url: 'premium-video-key',
            },
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockList = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      (mockSupabase.storage.from as jest.Mock).mockReturnValue({ list: mockList });

      const result = await deleteRecipe({ id: 'recipe-premium', videoKey: null });

      // Should fetch video from premium table
      expect(mockSelectPremium).toHaveBeenCalled();

      // Should delete video from premium table
      expect(mockDeleteVideo).toHaveBeenCalledWith('premium-video-key');

      expect(result.error).toBeNull();
    });
  });

  describe('Error handling', () => {
    test('should return error if database delete fails', async () => {
      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toEqual({ message: 'Delete failed' });
    });

    test('should return error if storage list fails', async () => {
      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockList = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'List failed' },
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      (mockSupabase.storage.from as jest.Mock).mockReturnValue({ list: mockList });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toEqual({ message: 'List failed' });
    });

    test('should handle video deletion error', async () => {
      mockDeleteVideo.mockResolvedValue({ error: { message: 'Video delete failed' } });

      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockList = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      (mockSupabase.storage.from as jest.Mock).mockReturnValue({ list: mockList });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: 'video-key' });

      expect(result.error).toEqual({ message: 'Video delete failed' });
    });
  });

  describe('Handle recipes without images', () => {
    test('should succeed even if no images to delete', async () => {
      const mockSelectPremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Empty images list
      const mockList = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from
        .mockReturnValueOnce({ select: mockSelectPremium } as any)
        .mockReturnValueOnce({ delete: mockDelete } as any);

      (mockSupabase.storage.from as jest.Mock).mockReturnValue({ list: mockList });

      const result = await deleteRecipe({ id: 'recipe-123', videoKey: null });

      expect(result.error).toBeNull();
    });
  });
});
