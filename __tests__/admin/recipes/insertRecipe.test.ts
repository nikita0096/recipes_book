import {
  insertRecipePublic,
  insertRecipePremiumMain,
  insertRecipe,
} from '@/services/db/insertRecipeToDatabase';
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
  category: { ua: 'Десерти', en: 'Desserts' },
  likes: 0,
  ingredients: [
    { id: 'ing-1', value: { ua: 'Цукор', en: 'Sugar' }, quantity: '100', unit: 'g' },
  ],
  heroImg: 'https://example.com/hero.jpg',
  isPremium: false,
  preparingTime: 30,
  videoUrl: 'https://example.com/video.mp4',
  recipeSteps: [
    { desc: { ua: 'Крок 1', en: 'Step 1' }, imgUrl: null, id: 'step-1' },
  ],
});

const createMockPremiumRecipe = (): IRecipeUploadPremiumMain => ({
  id: 'recipe-456',
  title: { ua: 'Преміум рецепт', en: 'Premium Recipe' },
  category: { ua: 'Торти', en: 'Cakes' },
  likes: 0,
  ingredients: [
    { id: 'ing-1', value: { ua: 'Борошно', en: 'Flour' }, quantity: '200', unit: 'g' },
  ],
  heroImg: 'https://example.com/premium-hero.jpg',
  isPremium: true,
  preparingTime: 60,
});

describe('insertRecipePublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should insert public recipe successfully', async () => {
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

    const result = await insertRecipePublic(mockRecipe);

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockInsert).toHaveBeenCalledWith({
      id: mockRecipe.id,
      title: mockRecipe.title,
      category: mockRecipe.category,
      likes: mockRecipe.likes,
      ingredients: mockRecipe.ingredients,
      hero_img: mockRecipe.heroImg,
      is_premium: false,
      preparing_time: mockRecipe.preparingTime,
      video_url: mockRecipe.videoUrl,
      recipe_steps: mockRecipe.recipeSteps,
    });
    expect(result).toEqual({ id: mockRecipe.id });
  });

  test('should throw error when insert fails', async () => {
    const mockRecipe = createMockPublicRecipe();
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: mockSelect,
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

    const result = await insertRecipePremiumMain(mockRecipe);

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockInsert).toHaveBeenCalledWith({
      id: mockRecipe.id,
      title: mockRecipe.title,
      category: mockRecipe.category,
      likes: mockRecipe.likes,
      ingredients: mockRecipe.ingredients,
      hero_img: mockRecipe.heroImg,
      is_premium: true,
      preparing_time: mockRecipe.preparingTime,
      video_url: null,
      recipe_steps: null,
    });
    expect(result).toEqual({ id: mockRecipe.id });
  });

  test('should set video_url and recipe_steps to null for premium', async () => {
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

    await insertRecipePremiumMain(mockRecipe);

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.video_url).toBeNull();
    expect(insertCall.recipe_steps).toBeNull();
    expect(insertCall.is_premium).toBe(true);
  });

  test('should throw error when insert fails', async () => {
    const mockRecipe = createMockPremiumRecipe();
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key' },
      }),
    });
    const mockInsert = jest.fn().mockReturnValue({
      select: mockSelect,
    });
    (mockSupabase.from as jest.Mock).mockReturnValue({
      insert: mockInsert,
    });

    await expect(insertRecipePremiumMain(mockRecipe)).rejects.toEqual({
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
