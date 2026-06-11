import {
  insertRecipePublic,
  insertRecipePremiumMain,
  insertRecipe,
} from '@/services/db/admin/insertRecipeToDatabase';
import { supabase } from '@/lib/supabase/ClientComponentClient';
import { IRecipeUploadPublic, IRecipeUploadPremiumMain } from '@/types/recipe';

// Mock supabase
jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock data
const createMockPublicRecipe = (): IRecipeUploadPublic => ({
  id: 'recipe-123',
  title: { ua: 'Тестовий рецепт', en: 'Test Recipe' },
  description: { ua: 'Тестовий опис', en: 'Test Description' },
  category: { ua: 'Десерти', en: 'Desserts' },
  likes: 0,
  ingredients: [
    {
      id: 'group-1',
      title: { ua: 'Основа', en: 'Base' },
      ingredients: [
        { id: 'ing-1', value: { ua: 'Цукор', en: 'Sugar' }, quantity: '100', unit: 'g' },
      ],
    },
  ],
  heroImg: 'recipe-123/hero-img-1.jpg',
  isPremium: false,
  preparingTime: 30,
  weight: null,
  diameter: null,
  calories: null,
  videoUrl: 'video-key-1',
  recipeSteps: [
    { desc: { ua: 'Крок 1', en: 'Step 1' }, imgUrl: null, id: 'step-1' },
  ],
  stepsCount: 1,
  slug: 'test-recipe',
});

const createMockPremiumRecipe = (): IRecipeUploadPremiumMain => ({
  id: 'recipe-456',
  title: { ua: 'Преміум рецепт', en: 'Premium Recipe' },
  description: { ua: 'Преміум опис', en: 'Premium Description' },
  category: { ua: 'Торти', en: 'Cakes' },
  likes: 0,
  ingredients: [
    {
      id: 'group-1',
      title: { ua: 'Основа', en: 'Base' },
      ingredients: [
        { id: 'ing-1', value: { ua: 'Борошно', en: 'Flour' }, quantity: '200', unit: 'g' },
      ],
    },
  ],
  heroImg: 'recipe-456/hero-img-1.jpg',
  isPremium: true,
  preparingTime: 60,
  weight: null,
  diameter: null,
  calories: null,
  premiumId: 'premium-123',
  stepsCount: 1,
  slug: 'premium-recipe',
});

describe('insertRecipePublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should insert public recipe successfully', async () => {
    const mockRecipe = createMockPublicRecipe();
    const mockInsert = jest.fn().mockResolvedValue({
      error: null,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipePublic(mockRecipe);

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockInsert).toHaveBeenCalledWith({
      id: mockRecipe.id,
      title: mockRecipe.title,
      description: mockRecipe.description,
      category: mockRecipe.category,
      likes: mockRecipe.likes,
      ingredients: mockRecipe.ingredients,
      hero_img: mockRecipe.heroImg,
      is_premium: false,
      preparing_time: mockRecipe.preparingTime,
      video_url: mockRecipe.videoUrl,
      recipe_steps: mockRecipe.recipeSteps,
      steps_count: mockRecipe.recipeSteps.length,
      slug: mockRecipe.slug,
    });
  });

  test('should throw error when insert fails', async () => {
    const mockRecipe = createMockPublicRecipe();
    const mockInsert = jest.fn().mockResolvedValue({
      error: { message: 'Database error' },
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(insertRecipePublic(mockRecipe)).rejects.toEqual({
      message: 'Database error',
    });
  });

  test('should map all fields correctly to snake_case', async () => {
    const mockRecipe = createMockPublicRecipe();
    const mockInsert = jest.fn().mockResolvedValue({
      error: null,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipePublic(mockRecipe);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall).toHaveProperty('hero_img');
    expect(insertCall).toHaveProperty('is_premium');
    expect(insertCall).toHaveProperty('preparing_time');
    expect(insertCall).toHaveProperty('video_url');
    expect(insertCall).toHaveProperty('recipe_steps');
    expect(insertCall).not.toHaveProperty('heroImg');
    expect(insertCall).not.toHaveProperty('isPremium');
  });
});

describe('insertRecipePremiumMain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should insert premium recipe main data successfully', async () => {
    const mockRecipe = createMockPremiumRecipe();
    const mockInsert = jest.fn().mockResolvedValue({
      error: null,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipePremiumMain(mockRecipe, 3);

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockInsert).toHaveBeenCalledWith({
      id: mockRecipe.id,
      title: mockRecipe.title,
      description: mockRecipe.description,
      category: mockRecipe.category,
      likes: mockRecipe.likes,
      ingredients: mockRecipe.ingredients,
      hero_img: mockRecipe.heroImg,
      is_premium: true,
      preparing_time: mockRecipe.preparingTime,
      video_url: null,
      recipe_steps: null,
      premium_recipe: mockRecipe.premiumId,
      steps_count: 3,
      slug: mockRecipe.slug,
    });
  });

  test('should set video_url and recipe_steps to null for premium', async () => {
    const mockRecipe = createMockPremiumRecipe();
    const mockInsert = jest.fn().mockResolvedValue({
      error: null,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipePremiumMain(mockRecipe, 3);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.video_url).toBeNull();
    expect(insertCall.recipe_steps).toBeNull();
    expect(insertCall.is_premium).toBe(true);
  });

  test('should throw error when insert fails', async () => {
    const mockRecipe = createMockPremiumRecipe();
    const mockInsert = jest.fn().mockReturnValue({
      error: { message: 'Duplicate key' },
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(insertRecipePremiumMain(mockRecipe, 3)).rejects.toEqual({
      message: 'Duplicate key',
    });
  });
});

describe('insertRecipe (universal)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should call insertRecipePublic for public recipe', async () => {
    const mockRecipe = createMockPublicRecipe();
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: mockRecipe.id },
        error: null,
      }),
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: mockSelect,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipe(mockRecipe);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.is_premium).toBe(false);
    expect(insertCall.recipe_steps).toEqual(mockRecipe.recipeSteps);
    expect(insertCall.video_url).toBe(mockRecipe.videoUrl);
  });

  test('should call insertRecipePremiumMain for premium recipe', async () => {
    const mockRecipe = createMockPremiumRecipe();
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: mockRecipe.id },
        error: null,
      }),
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: mockSelect,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await insertRecipe(mockRecipe);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.is_premium).toBe(true);
    expect(insertCall.recipe_steps).toBeNull();
    expect(insertCall.video_url).toBeNull();
  });
});
