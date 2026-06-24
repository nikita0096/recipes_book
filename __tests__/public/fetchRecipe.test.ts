import { fetchRecipe } from '@/services/db/public/fetchRecipe';
import { supabase } from '@/lib/supabase/ClientComponentClient';
import { fetchRecipePrice } from '@/services/db/public/fetchRecipePrice';
import { getPublicImageUrl, batchGetPublicUrls } from '@/services/storage/getPublicImageUrl';

// Mock dependencies
jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

jest.mock('@/services/db/public/fetchRecipePrice', () => ({
  fetchRecipePrice: jest.fn(),
}));

jest.mock('@/services/storage/getPublicImageUrl', () => ({
  getPublicImageUrl: jest.fn((path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://supabase.url/storage/v1/object/public/bucket/${path}`;
  }),
  batchGetPublicUrls: jest.fn((paths: string[]) => {
    const result: Record<string, string> = {};
    paths.forEach((path) => {
      result[path] = `https://supabase.url/storage/v1/object/public/bucket/${path}`;
    });
    return result;
  }),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockFetchRecipePrice = fetchRecipePrice as jest.MockedFunction<typeof fetchRecipePrice>;

describe('fetchRecipe - Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default price mock
    mockFetchRecipePrice.mockResolvedValue({
      price: { en: 9.99, uk: 400 },
      discount: null,
    });
  });

  describe('Authorized access - Admin or Purchased', () => {
    test('should return full premium recipe data for admin user', async () => {
      const recipeId = 'premium-recipe-123';

      // Mock recipe fetch
      const mockRecipeData = {
        id: recipeId,
        title: { uk: 'Преміум рецепт', en: 'Premium Recipe' },
        description: { uk: 'Опис', en: 'Description' },
        likes: 10,
        category: { uk: 'Десерти', en: 'Desserts' },
        ingredients: [{ id: 'ing-1', value: { uk: 'Цукор', en: 'Sugar' }, quantity: '100', unit: 'g' }],
        hero_img: 'recipe-123/hero.jpg',
        is_premium: true,
        preparing_time: 30,
        recipe_steps: null,
        video_url: null,
        steps_count: 3,
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock auth user (logged in)
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
      });

      // Mock role check (admin)
      const mockRoleSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });
      const mockRoleEq = jest.fn().mockReturnValue({ single: mockRoleSingle });
      const mockRoleSelect = jest.fn().mockReturnValue({ eq: mockRoleEq });

      // Mock purchase check
      const mockPurchaseMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockPurchaseEq2 = jest.fn().mockReturnValue({ maybeSingle: mockPurchaseMaybeSingle });
      const mockPurchaseEq1 = jest.fn().mockReturnValue({ eq: mockPurchaseEq2 });
      const mockPurchaseSelect = jest.fn().mockReturnValue({ eq: mockPurchaseEq1 });

      // Mock premium data fetch
      const mockPremiumData = {
        recipe_id: recipeId,
        video_url: 'premium-video-key-123',
        recipe_steps: [
          { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: 'recipe-123/step-1.jpg', id: 'step-1' },
          { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: 'recipe-123/step-2.jpg', id: 'step-2' },
          { desc: { uk: 'Крок 3', en: 'Step 3' }, imgUrl: null, id: 'step-3' },
        ],
      };

      const mockPremiumSingle = jest.fn().mockResolvedValue({
        data: mockPremiumData,
        error: null,
      });
      const mockPremiumEq = jest.fn().mockReturnValue({ single: mockPremiumSingle });
      const mockPremiumSelect = jest.fn().mockReturnValue({ eq: mockPremiumEq });

      // Setup supabase.from() to return different mocks based on call sequence
      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect })) // recipes table
        .mockImplementationOnce(() => ({ select: mockRoleSelect })) // profiles table
        .mockImplementationOnce(() => ({ select: mockPurchaseSelect })) // purchases table
        .mockImplementationOnce(() => ({ select: mockPremiumSelect })); // recipes_premium table

      const result = await fetchRecipe(recipeId);

      // Should return full premium data
      expect(result.data).toEqual({
        id: recipeId,
        title: mockRecipeData.title,
        description: mockRecipeData.description,
        likes: mockRecipeData.likes,
        category: mockRecipeData.category,
        ingredients: mockRecipeData.ingredients,
        heroImg: expect.stringContaining('hero.jpg'),
        isPremium: true,
        preparingTime: mockRecipeData.preparing_time,
        recipeSteps: [
          {
            desc: { uk: 'Крок 1', en: 'Step 1' },
            imgUrl: expect.stringContaining('step-1.jpg'),
            id: 'step-1',
          },
          {
            desc: { uk: 'Крок 2', en: 'Step 2' },
            imgUrl: expect.stringContaining('step-2.jpg'),
            id: 'step-2',
          },
          {
            desc: { uk: 'Крок 3', en: 'Step 3' },
            imgUrl: null,
            id: 'step-3',
          },
        ],
        videoUrl: 'premium-video-key-123',
        stepsCount: 3,
      });

      expect(result.totalPrice).toBeNull();
      expect(result.error).toBeNull();
    });

    test('should return full premium recipe data for user who purchased recipe', async () => {
      const recipeId = 'premium-recipe-456';
      const premiumRecipeId = 'premium-id-456';

      // Mock recipe fetch
      const mockRecipeData = {
        id: recipeId,
        title: { uk: 'Куплений рецепт', en: 'Purchased Recipe' },
        description: { uk: 'Опис', en: 'Description' },
        likes: 5,
        category: { uk: 'Салати', en: 'Salads' },
        ingredients: [{ id: 'ing-1', value: { uk: 'Помідор', en: 'Tomato' }, quantity: '2', unit: 'pcs' }],
        hero_img: 'recipe-456/hero.jpg',
        is_premium: true,
        preparing_time: 15,
        recipe_steps: null,
        video_url: null,
        steps_count: 2,
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock auth user (logged in)
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-456' } },
      });

      // Mock role check (regular user)
      const mockRoleSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      });
      const mockRoleEq = jest.fn().mockReturnValue({ single: mockRoleSingle });
      const mockRoleSelect = jest.fn().mockReturnValue({ eq: mockRoleEq });

      // Mock purchase check (user has purchased)
      const mockPurchaseMaybeSingle = jest.fn().mockResolvedValue({
        data: { premium_recipe_id: premiumRecipeId },
        error: null,
      });
      const mockPurchaseEq2 = jest.fn().mockReturnValue({ maybeSingle: mockPurchaseMaybeSingle });
      const mockPurchaseEq1 = jest.fn().mockReturnValue({ eq: mockPurchaseEq2 });
      const mockPurchaseSelect = jest.fn().mockReturnValue({ eq: mockPurchaseEq1 });

      // Mock premium data fetch
      const mockPremiumData = {
        recipe_id: recipeId,
        video_url: 'premium-video-key-456',
        recipe_steps: [
          { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: 'recipe-456/step-1.jpg', id: 'step-1' },
          { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: null, id: 'step-2' },
        ],
      };

      const mockPremiumSingle = jest.fn().mockResolvedValue({
        data: mockPremiumData,
        error: null,
      });
      const mockPremiumEq = jest.fn().mockReturnValue({ single: mockPremiumSingle });
      const mockPremiumSelect = jest.fn().mockReturnValue({ eq: mockPremiumEq });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ select: mockRoleSelect }))
        .mockImplementationOnce(() => ({ select: mockPurchaseSelect }))
        .mockImplementationOnce(() => ({ select: mockPremiumSelect }));

      const result = await fetchRecipe(recipeId);

      // Should return full premium data
      expect(result.data).toEqual({
        id: recipeId,
        title: mockRecipeData.title,
        description: mockRecipeData.description,
        likes: mockRecipeData.likes,
        category: mockRecipeData.category,
        ingredients: mockRecipeData.ingredients,
        heroImg: expect.stringContaining('hero.jpg'),
        isPremium: true,
        preparingTime: mockRecipeData.preparing_time,
        recipeSteps: [
          {
            desc: { uk: 'Крок 1', en: 'Step 1' },
            imgUrl: expect.stringContaining('step-1.jpg'),
            id: 'step-1',
          },
          {
            desc: { uk: 'Крок 2', en: 'Step 2' },
            imgUrl: null,
            id: 'step-2',
          },
        ],
        videoUrl: 'premium-video-key-456',
        stepsCount: 2,
      });

      expect(result.totalPrice).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('Unauthorized access - No purchase or not admin', () => {
    test('should return limited public data for unauthorized user trying to access premium recipe', async () => {
      const recipeId = 'premium-recipe-789';

      // Mock recipe fetch
      const mockRecipeData = {
        id: recipeId,
        title: { uk: 'Закритий рецепт', en: 'Locked Recipe' },
        description: { uk: 'Опис', en: 'Description' },
        likes: 20,
        category: { uk: 'Супи', en: 'Soups' },
        ingredients: [{ id: 'ing-1', value: { uk: 'Вода', en: 'Water' }, quantity: '1', unit: 'l' }],
        hero_img: 'recipe-789/hero.jpg',
        is_premium: true,
        preparing_time: 45,
        recipe_steps: [
          { desc: { uk: 'Короткий опис', en: 'Short desc' }, imgUrl: null, id: 'public-step-1' },
        ],
        video_url: 'public-video-preview',
        steps_count: 5,
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock auth user (logged in but not admin/purchased)
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-789' } },
      });

      // Mock role check (regular user)
      const mockRoleSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      });
      const mockRoleEq = jest.fn().mockReturnValue({ single: mockRoleSingle });
      const mockRoleSelect = jest.fn().mockReturnValue({ eq: mockRoleEq });

      // Mock purchase check (no purchase)
      const mockPurchaseMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockPurchaseEq2 = jest.fn().mockReturnValue({ maybeSingle: mockPurchaseMaybeSingle });
      const mockPurchaseEq1 = jest.fn().mockReturnValue({ eq: mockPurchaseEq2 });
      const mockPurchaseSelect = jest.fn().mockReturnValue({ eq: mockPurchaseEq1 });

      (mockSupabase.from as jest.Mock)
        .mockImplementationOnce(() => ({ select: mockSelect }))
        .mockImplementationOnce(() => ({ select: mockRoleSelect }))
        .mockImplementationOnce(() => ({ select: mockPurchaseSelect }));

      const result = await fetchRecipe(recipeId);

      // Should return public data only (limited)
      expect(result.data).toEqual({
        id: recipeId,
        title: mockRecipeData.title,
        description: mockRecipeData.description,
        likes: mockRecipeData.likes,
        category: mockRecipeData.category,
        ingredients: mockRecipeData.ingredients,
        heroImg: expect.stringContaining('hero.jpg'),
        isPremium: false, // Should be false for unauthorized access
        preparingTime: mockRecipeData.preparing_time,
        recipeSteps: [
          {
            desc: { uk: 'Короткий опис', en: 'Short desc' },
            imgUrl: null,
            id: 'public-step-1',
          },
        ],
        videoUrl: 'public-video-preview',
        stepsCount: 5,
      });

      // Should include price info for purchase
      expect(result.totalPrice).toEqual({
        price: { en: 9.99, uk: 400 },
        discount: null,
      });

      expect(result.error).toBeNull();

      // Should NOT have called recipes_premium table
      expect(mockSupabase.from).toHaveBeenCalledTimes(3);
    });

    test('should return public data when user is not logged in', async () => {
      const recipeId = 'premium-recipe-999';

      const mockRecipeData = {
        id: recipeId,
        title: { uk: 'Рецепт', en: 'Recipe' },
        description: { uk: 'Опис', en: 'Description' },
        likes: 15,
        category: { uk: "М'ясо", en: 'Meat' },
        ingredients: [],
        hero_img: 'recipe-999/hero.jpg',
        is_premium: true,
        preparing_time: 60,
        recipe_steps: [],
        video_url: null,
        steps_count: 4,
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: mockRecipeData,
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock auth user (NOT logged in)
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      (mockSupabase.from as jest.Mock).mockImplementationOnce(() => ({ select: mockSelect }));

      const result = await fetchRecipe(recipeId);

      // Should return public data
      expect(result.data?.isPremium).toBe(false);
      expect(result.totalPrice).toEqual({
        price: { en: 9.99, uk: 400 },
        discount: null,
      });
      expect(result.error).toBeNull();

      // Should NOT check role or purchases or fetch premium data
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });
  });
});
