import { fetchRecipeServer } from '@/services/db/public/fetchRecipeServer';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock storage helpers (pure URL builders) the same way as the client twin's test.
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

// Builds a query chain for `recipes_price` used by the internal price lookup.
const makePriceFrom = () => {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: { price: { en: 9.99, uk: 400 }, discount: null },
    error: null,
  });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  return { select };
};

describe('fetchRecipeServer - Access Control', () => {
  let from: jest.Mock;
  let getUser: jest.Mock;
  let supabase: SupabaseClient;

  beforeEach(() => {
    jest.clearAllMocks();
    from = jest.fn();
    getUser = jest.fn();
    supabase = { from, auth: { getUser } } as unknown as SupabaseClient;
  });

  describe('Authorized access - Admin or Purchased', () => {
    test('should return full premium recipe data for admin user', async () => {
      const recipeId = 'premium-recipe-123';

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

      const recipesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRecipeData, error: null }),
          }),
        }),
      };

      getUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });

      const profilesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          }),
        }),
      };

      const purchasesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      };

      const mockPremiumData = {
        recipe_id: recipeId,
        video_url: 'premium-video-key-123',
        recipe_steps: [
          { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: 'recipe-123/step-1.jpg', id: 'step-1' },
          { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: 'recipe-123/step-2.jpg', id: 'step-2' },
          { desc: { uk: 'Крок 3', en: 'Step 3' }, imgUrl: null, id: 'step-3' },
        ],
      };

      const premiumFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPremiumData, error: null }),
          }),
        }),
      };

      from
        .mockImplementationOnce(() => recipesFrom) // recipes
        .mockImplementationOnce(() => makePriceFrom()) // recipes_price
        .mockImplementationOnce(() => profilesFrom) // profiles
        .mockImplementationOnce(() => purchasesFrom) // purchases
        .mockImplementationOnce(() => premiumFrom); // recipes_premium

      const result = await fetchRecipeServer(supabase, recipeId);

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
        weight: undefined,
        diameter: undefined,
        calories: undefined,
        recipeSteps: [
          { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: expect.stringContaining('step-1.jpg'), id: 'step-1' },
          { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: expect.stringContaining('step-2.jpg'), id: 'step-2' },
          { desc: { uk: 'Крок 3', en: 'Step 3' }, imgUrl: null, id: 'step-3' },
        ],
        videoUrl: 'premium-video-key-123',
        stepsCount: 3,
        slug: undefined,
        isPublished: undefined,
      });

      expect(result.totalPrice).toBeNull();
      expect(result.error).toBeNull();
    });

    test('should return full premium recipe data for user who purchased recipe', async () => {
      const recipeId = 'premium-recipe-456';
      const premiumRecipeId = 'premium-id-456';

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

      const recipesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRecipeData, error: null }),
          }),
        }),
      };

      getUser.mockResolvedValue({ data: { user: { id: 'user-456' } } });

      const profilesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          }),
        }),
      };

      const purchasesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { premium_recipe_id: premiumRecipeId },
                error: null,
              }),
            }),
          }),
        }),
      };

      const mockPremiumData = {
        recipe_id: recipeId,
        video_url: 'premium-video-key-456',
        recipe_steps: [
          { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: 'recipe-456/step-1.jpg', id: 'step-1' },
          { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: null, id: 'step-2' },
        ],
      };

      const premiumFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockPremiumData, error: null }),
          }),
        }),
      };

      from
        .mockImplementationOnce(() => recipesFrom)
        .mockImplementationOnce(() => makePriceFrom())
        .mockImplementationOnce(() => profilesFrom)
        .mockImplementationOnce(() => purchasesFrom)
        .mockImplementationOnce(() => premiumFrom);

      const result = await fetchRecipeServer(supabase, recipeId);

      expect(result.data?.isPremium).toBe(true);
      expect(result.data?.videoUrl).toBe('premium-video-key-456');
      expect(result.data?.recipeSteps).toEqual([
        { desc: { uk: 'Крок 1', en: 'Step 1' }, imgUrl: expect.stringContaining('step-1.jpg'), id: 'step-1' },
        { desc: { uk: 'Крок 2', en: 'Step 2' }, imgUrl: null, id: 'step-2' },
      ]);
      expect(result.totalPrice).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('Unauthorized access - No purchase or not admin', () => {
    test('should return limited public data for unauthorized user trying to access premium recipe', async () => {
      const recipeId = 'premium-recipe-789';

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

      const recipesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRecipeData, error: null }),
          }),
        }),
      };

      getUser.mockResolvedValue({ data: { user: { id: 'user-789' } } });

      const profilesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { role: 'user' }, error: null }),
          }),
        }),
      };

      const purchasesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      };

      from
        .mockImplementationOnce(() => recipesFrom)
        .mockImplementationOnce(() => makePriceFrom())
        .mockImplementationOnce(() => profilesFrom)
        .mockImplementationOnce(() => purchasesFrom);

      const result = await fetchRecipeServer(supabase, recipeId);

      expect(result.data?.isPremium).toBe(false);
      expect(result.data?.videoUrl).toBe('public-video-preview');
      expect(result.totalPrice).toEqual({ price: { en: 9.99, uk: 400 }, discount: null });
      expect(result.error).toBeNull();

      // recipes_premium must NOT be queried for an unauthorized user.
      expect(from).toHaveBeenCalledTimes(4);
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

      const recipesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockRecipeData, error: null }),
          }),
        }),
      };

      getUser.mockResolvedValue({ data: { user: null } });

      from
        .mockImplementationOnce(() => recipesFrom)
        .mockImplementationOnce(() => makePriceFrom());

      const result = await fetchRecipeServer(supabase, recipeId);

      expect(result.data?.isPremium).toBe(false);
      expect(result.totalPrice).toEqual({ price: { en: 9.99, uk: 400 }, discount: null });
      expect(result.error).toBeNull();

      // Only recipes + recipes_price are queried; no role/purchase/premium lookups.
      expect(from).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error handling', () => {
    test('should return the error when the recipe fetch fails', async () => {
      const recipeId = 'missing-recipe';
      const fetchError = new Error('not found');

      const recipesFrom = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: fetchError }),
          }),
        }),
      };

      from.mockImplementationOnce(() => recipesFrom);

      const result = await fetchRecipeServer(supabase, recipeId);

      expect(result.data).toBeNull();
      expect(result.totalPrice).toBeNull();
      expect(result.error).toBe(fetchError);
      // Should short-circuit before querying anything else.
      expect(from).toHaveBeenCalledTimes(1);
    });
  });
});
