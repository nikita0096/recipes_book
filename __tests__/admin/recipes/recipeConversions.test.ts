import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from '@/services/db/admin/updateRecipe';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import {
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
} from '@/types/recipe';

// The update services create their own request-scoped client; mock the factory.
jest.mock('@/lib/supabase/ServerComponentClient', () => ({
  createClient: jest.fn(),
}));

// Mock getPublicImageUrl
jest.mock('@/services/storage/getPublicImageUrl', () => ({
  getPublicImageUrl: jest.fn((path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://supabase.url/storage/v1/object/public/bucket/${path}`;
  }),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

const mockSupabase = { from: jest.fn() };
(createClient as jest.Mock).mockResolvedValue(mockSupabase);

const createMockPublicData = (): UpdateRecipeDataPublic => ({
  title: { uk: 'Публічний рецепт', en: 'Public Recipe' },
  description: { uk: 'Опис', en: 'Description' },
  category: { uk: 'Десерти', en: 'Desserts' },
  likes: 10,
  ingredients: [
    {
      id: 'group-1',
      title: { uk: 'Основа', en: 'Base' },
      ingredients: [
        { id: 'ing-1', value: { uk: 'Цукор', en: 'Sugar' }, quantity: '100', unit: 'g' },
      ],
    },
  ],
  heroImg: 'recipe-1/hero.jpg',
  preparingTime: 30,
  weight: null,
  diameter: null,
  calories: null,
  isPremium: false as const,
  recipeSteps: [
    { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: null, id: 'step-1' },
  ],
  videoUrl: 'video-key-1',
  stepsCount: 1,
  slug: 'public-recipe',
});

const createMockPremiumMainData = (): UpdateRecipeDataPremiumMain => ({
  title: { uk: 'Преміум рецепт', en: 'Premium Recipe' },
  description: { uk: 'Преміум опис', en: 'Premium Description' },
  category: { uk: 'Торти', en: 'Cakes' },
  likes: 50,
  ingredients: [
    {
      id: 'group-1',
      title: { uk: 'Основа', en: 'Base' },
      ingredients: [
        { id: 'ing-1', value: { uk: 'Борошно', en: 'Flour' }, quantity: '200', unit: 'g' },
      ],
    },
  ],
  heroImg: 'recipe-2/hero.jpg',
  preparingTime: 60,
  weight: null,
  diameter: null,
  calories: null,
  isPremium: true as const,
  stepsCount: 2,
  slug: 'premium-recipe',
});

const createMockPremiumPartData = (): UpdateRecipeDataPremiumPart => ({
  recipeId: 'recipe-2',
  recipeSteps: [
    { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: null, id: 'step-1' },
    { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: null, id: 'step-2' },
  ],
  videoUrl: 'video-key-premium',
  price: { en: 10, uk: 400 },
  discount: 15,
});

describe('Recipe Conversions - All Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Scenario 1: Public → Public (regular update)', () => {
    test('should update all fields in public recipe', async () => {
      const formData = createMockPublicData();

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-1',
                title: formData.title,
                description: formData.description,
                category: formData.category,
                likes: formData.likes,
                ingredients: formData.ingredients,
                hero_img: formData.heroImg,
                video_url: formData.videoUrl,
                preparing_time: formData.preparingTime,
                is_premium: false,
                recipe_steps: formData.recipeSteps,
                steps_count: formData.stepsCount,
                slug: 'test-slug',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateRecipePublic(formData, 'recipe-1');

      expect(result.error).toBeNull();
      expect(result.data?.isPremium).toBe(false);
      expect(result.data?.videoUrl).toBe('video-key-1');
      expect(result.data?.recipeSteps).toHaveLength(1);
    });

    test('should keep recipe_steps and video_url in main table', async () => {
      const formData = createMockPublicData();

      let capturedData: any;
      const mockUpdate = jest.fn().mockImplementation((data) => {
        capturedData = data;
        return {
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'recipe-1',
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  likes: formData.likes,
                  ingredients: formData.ingredients,
                  hero_img: formData.heroImg,
                  video_url: formData.videoUrl,
                  preparing_time: formData.preparingTime,
                  is_premium: false,
                  recipe_steps: formData.recipeSteps,
                  steps_count: formData.stepsCount,
                },
                error: null,
              }),
            }),
          }),
        };
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      await updateRecipePublic(formData, 'recipe-1');

      expect(capturedData.recipe_steps).toEqual(formData.recipeSteps);
      expect(capturedData.video_url).toBe('video-key-1');
      expect(capturedData.is_premium).toBe(false);
    });
  });

  describe('Scenario 2: Premium → Premium (regular update)', () => {
    test('should update both main and premium tables', async () => {
      const mainData = createMockPremiumMainData();
      const premiumData = createMockPremiumPartData();

      // Mock main table update
      const mockUpdateMain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-2',
                title: mainData.title,
                description: mainData.description,
                category: mainData.category,
                likes: mainData.likes,
                ingredients: mainData.ingredients,
                hero_img: mainData.heroImg,
                preparing_time: mainData.preparingTime,
                is_premium: true,
                recipe_steps: null,
                video_url: null,
                steps_count: 2,
                slug: 'test-slug',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock premium table update
      const mockUpdatePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock price table update
      const mockUpdatePrice = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ update: mockUpdatePremium } as any)
        .mockReturnValueOnce({ update: mockUpdatePrice } as any);

      const result = await updateRecipePremium(mainData, premiumData, 'recipe-2');

      expect(result.error).toBeNull();
      expect(result.data?.newRecipe.isPremium).toBe(true);
      expect(result.data?.newRecipe.recipeSteps).toHaveLength(2);
      expect(result.data?.newPrice.price.en).toBe(10);
      expect(result.data?.newPrice.price.uk).toBe(400);
    });

    test('should set recipe_steps and video_url to null in main table', async () => {
      const mainData = createMockPremiumMainData();
      const premiumData = createMockPremiumPartData();

      let capturedMainData: any;
      const mockUpdateMain = jest.fn().mockImplementation((data) => {
        capturedMainData = data;
        return {
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'recipe-2',
                  title: mainData.title,
                  description: mainData.description,
                  category: mainData.category,
                  likes: mainData.likes,
                  ingredients: mainData.ingredients,
                  hero_img: mainData.heroImg,
                  preparing_time: mainData.preparingTime,
                  is_premium: true,
                  recipe_steps: null,
                  video_url: null,
                  steps_count: 2,
                },
                error: null,
              }),
            }),
          }),
        };
      });

      const mockUpdatePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockUpdatePrice = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ update: mockUpdatePremium } as any)
        .mockReturnValueOnce({ update: mockUpdatePrice } as any);

      await updateRecipePremium(mainData, premiumData, 'recipe-2');

      expect(capturedMainData.recipe_steps).toBeNull();
      expect(capturedMainData.video_url).toBeNull();
      expect(capturedMainData.is_premium).toBe(true);
    });

    test('should update price with both currencies', async () => {
      const mainData = createMockPremiumMainData();
      const premiumData = createMockPremiumPartData();

      const mockUpdateMain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-2',
                title: mainData.title,
                description: mainData.description,
                category: mainData.category,
                likes: mainData.likes,
                ingredients: mainData.ingredients,
                hero_img: mainData.heroImg,
                preparing_time: mainData.preparingTime,
                is_premium: true,
                recipe_steps: null,
                video_url: null,
                steps_count: 2,
                slug: 'test-slug',
              },
              error: null,
            }),
          }),
        }),
      });

      const mockUpdatePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      let capturedPriceData: any;
      const mockUpdatePrice = jest.fn().mockImplementation((data) => {
        capturedPriceData = data;
        return {
          eq: jest.fn().mockResolvedValue({ error: null }),
        };
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ update: mockUpdatePremium } as any)
        .mockReturnValueOnce({ update: mockUpdatePrice } as any);

      await updateRecipePremium(mainData, premiumData, 'recipe-2');

      expect(capturedPriceData.price).toEqual({ en: 10, uk: 400 });
      expect(capturedPriceData.discount).toBe(15);
    });
  });

  describe('Scenario 3: Public → Premium (conversion)', () => {
    test('should convert public recipe to premium with INSERT', async () => {
      const mainData = createMockPremiumMainData();
      const premiumData = createMockPremiumPartData();

      // Mock main table update
      const mockUpdateMain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-1',
                title: mainData.title,
                description: mainData.description,
                category: mainData.category,
                likes: mainData.likes,
                ingredients: mainData.ingredients,
                hero_img: mainData.heroImg,
                preparing_time: mainData.preparingTime,
                is_premium: true,
                recipe_steps: null,
                video_url: null,
                premium_recipe: 'test-uuid',
                steps_count: 2,
                slug: 'test-slug',
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock premium table INSERT (not update!)
      const mockInsertPremium = jest.fn().mockResolvedValue({ error: null });

      // Mock price table INSERT
      const mockInsertPrice = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ insert: mockInsertPremium } as any)
        .mockReturnValueOnce({ insert: mockInsertPrice } as any);

      const result = await convertPublicToPremium(mainData, premiumData, 'recipe-1');

      expect(result.error).toBeNull();
      expect(result.data?.newRecipe.isPremium).toBe(true);
      expect(mockInsertPremium).toHaveBeenCalled(); // Should INSERT, not UPDATE
      expect(mockInsertPrice).toHaveBeenCalled();
    });

    test('should set premium_recipe ID in main table', async () => {
      const mainData = createMockPremiumMainData();
      const premiumData = createMockPremiumPartData();

      let capturedMainData: any;
      const mockUpdateMain = jest.fn().mockImplementation((data) => {
        capturedMainData = data;
        return {
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'recipe-1',
                  title: mainData.title,
                  description: mainData.description,
                  category: mainData.category,
                  likes: mainData.likes,
                  ingredients: mainData.ingredients,
                  hero_img: mainData.heroImg,
                  preparing_time: mainData.preparingTime,
                  is_premium: true,
                  recipe_steps: null,
                  video_url: null,
                  premium_recipe: 'test-uuid',
                  steps_count: 2,
                },
                error: null,
              }),
            }),
          }),
        };
      });

      const mockInsertPremium = jest.fn().mockResolvedValue({ error: null });
      const mockInsertPrice = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ insert: mockInsertPremium } as any)
        .mockReturnValueOnce({ insert: mockInsertPrice } as any);

      await convertPublicToPremium(mainData, premiumData, 'recipe-1');

      expect(capturedMainData.premium_recipe).toBeDefined();
      expect(capturedMainData.is_premium).toBe(true);
      expect(capturedMainData.recipe_steps).toBeNull();
      expect(capturedMainData.video_url).toBeNull();
    });
  });

  describe('Scenario 4: Premium → Public (conversion)', () => {
    test('should convert premium recipe to public with DELETE', async () => {
      const formData = createMockPublicData();

      // Mock main table update
      const mockUpdateMain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-2',
                title: formData.title,
                description: formData.description,
                category: formData.category,
                likes: formData.likes,
                ingredients: formData.ingredients,
                hero_img: formData.heroImg,
                preparing_time: formData.preparingTime,
                is_premium: false,
                recipe_steps: formData.recipeSteps,
                video_url: formData.videoUrl,
                premium_recipe: null,
                steps_count: 1,
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock premium table DELETE (not update!)
      const mockDeletePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock price table DELETE
      const mockDeletePrice = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ delete: mockDeletePremium } as any)
        .mockReturnValueOnce({ delete: mockDeletePrice } as any);

      const result = await convertPremiumToPublic(formData, 'recipe-2');

      expect(result.error).toBeNull();
      expect(result.data?.isPremium).toBe(false);
      expect(mockDeletePremium).toHaveBeenCalled(); // Should DELETE
      expect(mockDeletePrice).toHaveBeenCalled();
    });

    test('should move recipe_steps and video_url back to main table', async () => {
      const formData = createMockPublicData();

      let capturedMainData: any;
      const mockUpdateMain = jest.fn().mockImplementation((data) => {
        capturedMainData = data;
        return {
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  id: 'recipe-2',
                  title: formData.title,
                  description: formData.description,
                  category: formData.category,
                  likes: formData.likes,
                  ingredients: formData.ingredients,
                  hero_img: formData.heroImg,
                  preparing_time: formData.preparingTime,
                  is_premium: false,
                  recipe_steps: formData.recipeSteps,
                  video_url: formData.videoUrl,
                  premium_recipe: null,
                  steps_count: 1,
                },
                error: null,
              }),
            }),
          }),
        };
      });

      const mockDeletePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const mockDeletePrice = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ delete: mockDeletePremium } as any)
        .mockReturnValueOnce({ delete: mockDeletePrice } as any);

      await convertPremiumToPublic(formData, 'recipe-2');

      expect(capturedMainData.recipe_steps).toEqual(formData.recipeSteps);
      expect(capturedMainData.video_url).toBe('video-key-1');
      expect(capturedMainData.is_premium).toBe(false);
      expect(capturedMainData.premium_recipe).toBeNull();
    });

    test('should not fail if premium record does not exist', async () => {
      const formData = createMockPublicData();

      const mockUpdateMain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'recipe-2',
                title: formData.title,
                description: formData.description,
                category: formData.category,
                likes: formData.likes,
                ingredients: formData.ingredients,
                hero_img: formData.heroImg,
                preparing_time: formData.preparingTime,
                is_premium: false,
                recipe_steps: formData.recipeSteps,
                video_url: formData.videoUrl,
                premium_recipe: null,
                steps_count: 1,
              },
              error: null,
            }),
          }),
        }),
      });

      // Premium delete fails (record doesn't exist)
      const mockDeletePremium = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Not found' } }),
      });

      const mockDeletePrice = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from
        .mockReturnValueOnce({ update: mockUpdateMain } as any)
        .mockReturnValueOnce({ delete: mockDeletePremium } as any)
        .mockReturnValueOnce({ delete: mockDeletePrice } as any);

      const result = await convertPremiumToPublic(formData, 'recipe-2');

      // Should still succeed
      expect(result.error).toBeNull();
      expect(result.data?.isPremium).toBe(false);
    });
  });
});
