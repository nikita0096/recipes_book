import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from '@/services/db/admin/updateRecipe';
import { supabase } from '@/lib/supabase/ClientComponentClient';
import {
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
} from '@/types/recipe';

// Mock supabase
jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock data factories
const createMockPublicUpdateData = (): UpdateRecipeDataPublic => ({
  title: { ua: 'Оновлений рецепт', en: 'Updated Recipe' },
  description: { ua: 'Оновлений опис', en: 'Updated Description' },
  category: { ua: 'Десерти', en: 'Desserts' },
  likes: 25,
  ingredients: [
    { id: 'ing-1', value: { ua: 'Цукор', en: 'Sugar' }, quantity: '100', unit: 'g' },
  ],
  heroImg: 'recipe-123/hero-img-1.jpg',
  isPremium: false,
  preparingTime: 45,
  videoUrl: 'video-key-1',
  recipeSteps: [
    { desc: { ua: 'Крок 1', en: 'Step 1' }, imgUrl: null, id: 'step-1' },
  ],
  stepsCount: 1,
});

const createMockPremiumMainData = (): UpdateRecipeDataPremiumMain => ({
  title: { ua: 'Преміум рецепт', en: 'Premium Recipe' },
  description: { ua: 'Преміум опис', en: 'Premium Description' },
  category: { ua: 'Торти', en: 'Cakes' },
  likes: 50,
  ingredients: [
    { id: 'ing-1', value: { ua: 'Борошно', en: 'Flour' }, quantity: '200', unit: 'g' },
  ],
  heroImg: 'recipe-123/hero-img-1.jpg',
  isPremium: true,
  preparingTime: 90,
  stepsCount: 1,
});

const createMockPremiumPartData = (): UpdateRecipeDataPremiumPart => ({
  recipeId: 'recipe-123',
  recipeSteps: [
    { desc: { ua: 'Преміум крок 1', en: 'Premium Step 1' }, imgUrl: 'recipe-123/step-img-1.jpg', id: 'step-1' },
  ],
  videoUrl: 'video-key-premium',
  price: { en: 100, ua: 4000 },
  discount: null,
});

const createMockDbResponse = (id: string, isPremium: boolean) => ({
  id,
  title: { ua: 'Рецепт', en: 'Recipe' },
  description: { ua: 'Опис', en: 'Description' },
  likes: 10,
  category: { ua: 'Десерти', en: 'Desserts' },
  ingredients: [],
  hero_img: `${id}/hero-img-1.jpg`,
  is_premium: isPremium,
  preparing_time: 30,
  recipe_steps: isPremium ? null : [],
  video_url: isPremium ? null : 'video-key-1',
  steps_count: 1,
});

// Helper to setup supabase mock chain
const setupUpdateMock = (data: any, error: any = null) => {
  const mockSingle = jest.fn().mockResolvedValue({ data, error });
  const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
  const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
  (mockSupabase.from as jest.Mock).mockReturnValue({ update: mockUpdate });
  return { mockUpdate, mockEq, mockSelect, mockSingle };
};

describe('updateRecipePublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update public recipe successfully', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);
    setupUpdateMock(dbResponse);

    const result = await updateRecipePublic(formData, 'recipe-123');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.id).toBe('recipe-123');
    expect(result.data?.isPremium).toBe(false);
  });

  test('should map camelCase to snake_case correctly', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);
    const { mockUpdate } = setupUpdateMock(dbResponse);

    await updateRecipePublic(formData, 'recipe-123');

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall).toHaveProperty('hero_img', formData.heroImg);
    expect(updateCall).toHaveProperty('preparing_time', formData.preparingTime);
    expect(updateCall).toHaveProperty('video_url', formData.videoUrl);
    expect(updateCall).toHaveProperty('recipe_steps', formData.recipeSteps);
    expect(updateCall).toHaveProperty('is_premium', false);
  });

  test('should return error when recipe not found', async () => {
    const formData = createMockPublicUpdateData();
    setupUpdateMock(null, null);

    const result = await updateRecipePublic(formData, 'non-existent');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Recipe not found');
  });

  test('should return error when database fails', async () => {
    const formData = createMockPublicUpdateData();
    setupUpdateMock(null, { message: 'Database connection error' });

    const result = await updateRecipePublic(formData, 'recipe-123');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Database connection error');
  });

  test('should map response from snake_case to camelCase', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);
    setupUpdateMock(dbResponse);

    const result = await updateRecipePublic(formData, 'recipe-123');

    expect(result.data).toHaveProperty('heroImg');
    expect(result.data).toHaveProperty('preparingTime');
    expect(result.data).toHaveProperty('videoUrl');
    expect(result.data).toHaveProperty('recipeSteps');
    expect(result.data).toHaveProperty('isPremium');
    expect(result.data).not.toHaveProperty('hero_img');
  });
});

describe('updateRecipePremium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update premium recipe in both tables', async () => {
    const mainData = createMockPremiumMainData();
    const premiumData = createMockPremiumPartData();
    const dbResponse = createMockDbResponse('recipe-123', true);

    // Setup main table update
    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    // Setup premium table update
    const mockPremiumEq = jest.fn().mockResolvedValue({ error: null });
    const mockPremiumUpdate = jest.fn().mockReturnValue({ eq: mockPremiumEq });

    let callCount = 0;
    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      callCount++;
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { update: mockPremiumUpdate };
    });

    const result = await updateRecipePremium(mainData, premiumData, 'recipe-123');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.newRecipe.isPremium).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('recipes');
    expect(mockSupabase.from).toHaveBeenCalledWith('recipes_premium');
  });

  test('should set recipe_steps and video_url to null in main table', async () => {
    const mainData = createMockPremiumMainData();
    const premiumData = createMockPremiumPartData();
    const dbResponse = createMockDbResponse('recipe-123', true);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockPremiumEq = jest.fn().mockResolvedValue({ error: null });
    const mockPremiumUpdate = jest.fn().mockReturnValue({ eq: mockPremiumEq });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { update: mockPremiumUpdate };
    });

    await updateRecipePremium(mainData, premiumData, 'recipe-123');

    const mainUpdateCall = mockUpdate.mock.calls[0][0];
    expect(mainUpdateCall.recipe_steps).toBeNull();
    expect(mainUpdateCall.video_url).toBeNull();
    expect(mainUpdateCall.is_premium).toBe(true);
  });

  test('should return error when premium table update fails', async () => {
    const mainData = createMockPremiumMainData();
    const premiumData = createMockPremiumPartData();
    const dbResponse = createMockDbResponse('recipe-123', true);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockPremiumEq = jest.fn().mockResolvedValue({ error: { message: 'Premium table error' } });
    const mockPremiumUpdate = jest.fn().mockReturnValue({ eq: mockPremiumEq });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { update: mockPremiumUpdate };
    });

    const result = await updateRecipePremium(mainData, premiumData, 'recipe-123');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Premium table error');
  });
});

describe('convertPublicToPremium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should convert public recipe to premium', async () => {
    const mainData = createMockPremiumMainData();
    const premiumData = createMockPremiumPartData();
    const dbResponse = createMockDbResponse('recipe-123', true);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { insert: mockInsert };
    });

    const result = await convertPublicToPremium(mainData, premiumData, 'recipe-123');

    expect(result.error).toBeNull();
    expect(result.data?.newRecipe.isPremium).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('recipes_premium');
  });

  test('should INSERT into premium table (not UPDATE)', async () => {
    const mainData = createMockPremiumMainData();
    const premiumData = createMockPremiumPartData();
    const dbResponse = createMockDbResponse('recipe-123', true);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { insert: mockInsert };
    });

    await convertPublicToPremium(mainData, premiumData, 'recipe-123');

    expect(mockInsert).toHaveBeenCalledWith({
      recipe_id: 'recipe-123',
      recipe_steps: premiumData.recipeSteps,
      video_url: premiumData.videoUrl,
    });
  });
});

describe('convertPremiumToPublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should convert premium recipe to public', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { delete: mockDelete };
    });

    const result = await convertPremiumToPublic(formData, 'recipe-123');

    expect(result.error).toBeNull();
    expect(result.data?.newRecipe.isPremium).toBe(false);
  });

  test('should DELETE from premium table', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { delete: mockDelete };
    });

    await convertPremiumToPublic(formData, 'recipe-123');

    expect(mockSupabase.from).toHaveBeenCalledWith('recipes_premium');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith('recipe_id', 'recipe-123');
  });

  test('should add recipe_steps and video_url to main table', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { delete: mockDelete };
    });

    await convertPremiumToPublic(formData, 'recipe-123');

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.recipe_steps).toEqual(formData.recipeSteps);
    expect(updateCall.video_url).toBe(formData.videoUrl);
    expect(updateCall.is_premium).toBe(false);
  });

  test('should not fail if premium record does not exist', async () => {
    const formData = createMockPublicUpdateData();
    const dbResponse = createMockDbResponse('recipe-123', false);

    const mockSingle = jest.fn().mockResolvedValue({ data: dbResponse, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });

    // Delete fails but should not cause error
    const mockDeleteEq = jest.fn().mockResolvedValue({ error: { message: 'Record not found' } });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockDeleteEq });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    (mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'recipes') {
        return { update: mockUpdate };
      }
      return { delete: mockDelete };
    });

    const result = await convertPremiumToPublic(formData, 'recipe-123');

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
