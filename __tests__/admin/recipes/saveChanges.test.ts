import {prepareUpdateData, hasDataChanged, PrepareUpdateDataResult} from '@/app/[locale]/admin/recipes/[recipe]/utils/prepareUpdateData';
import {EditingValues} from '@/app/[locale]/admin/recipes/[recipe]/page';
import {IRecipe, IRecipePublic, IRecipePremiumFull} from '@/types/recipe';
import {uploadImageServer} from '@/services/api/admin/uploadImageServer';
import {uploadVideoToStream} from '@/services/storage/uploadVideoToStream';

// Mock the upload functions
jest.mock('@/services/api/admin/uploadImageServer', () => ({
  uploadImageServer: jest.fn(),
}));

jest.mock('@/services/storage/uploadVideoToStream', () => ({
  uploadVideoToStream: jest.fn(),
}));

jest.mock('@/services/storage/deleteImageFromStorage', () => ({
  deleteFileByPath: jest.fn().mockResolvedValue({success: true}),
}));

jest.mock('@/services/storage/deleteVideoFromStream', () => ({
  deleteVideoFromStream: jest.fn().mockResolvedValue({success: true, error: ''}),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

const mockUploadImage = uploadImageServer as jest.MockedFunction<typeof uploadImageServer>;
const mockUploadVideo = uploadVideoToStream as jest.MockedFunction<typeof uploadVideoToStream>;

// Base mock data
const createMockRecipePublic = (): IRecipePublic => ({
  id: '1',
  title: {uk: 'Тестовий рецепт', en: 'Test Recipe'},
  description: {uk: 'Тестовий опис', en: 'Test Description'},
  likes: 10,
  category: {uk: 'Десерти', en: 'Desserts'},
  recipeSteps: [
    {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '1/step-img-1.jpg', id: 'step-1'},
    {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, id: 'step-2'},
  ],
  ingredients: [
    {
      id: 'group-1',
      title: {uk: 'Основа', en: 'Base'},
      ingredients: [
        {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
        {id: 'ing-2', value: {uk: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
      ],
    },
  ],
  heroImg: '1/hero-img-1.jpg',
  isPremium: false,
  preparingTime: 30,
  weight: null,
  diameter: null,
  calories: null,
  videoUrl: 'video-key-1',
  stepsCount: 2,
  slug: 'test-recipe',
  isPublished: true,
});

const createMockRecipePremium = (): IRecipePremiumFull => ({
  id: '2',
  title: {uk: 'Преміум рецепт', en: 'Premium Recipe'},
  description: {uk: 'Преміум опис', en: 'Premium Description'},
  likes: 50,
  category: {uk: 'Супи', en: 'Soups'},
  recipeSteps: [
    {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '2/step-img-1.jpg', id: 'step-1'},
  ],
  ingredients: [
    {
      id: 'group-1',
      title: {uk: 'Основа', en: 'Base'},
      ingredients: [
        {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
      ],
    },
  ],
  heroImg: '2/hero-img-2.jpg',
  isPremium: true,
  preparingTime: 60,
  weight: null,
  diameter: null,
  calories: null,
  videoUrl: 'video-key-2',
  stepsCount: 1,
  slug: 'premium-recipe',
  isPublished: true,
});

const createMockFormData = (overrides?: Partial<EditingValues>): EditingValues => ({
  heroImg: '1/hero-img-1.jpg',
  heroImgFile: null,
  category: {uk: 'Десерти', en: 'Desserts'},
  title: {uk: 'Тестовий рецепт', en: 'Test Recipe'},
  description: {uk: 'Тестовий опис', en: 'Test Description'},
  ingredientGroups: [
    {
      id: 'group-1',
      title: {uk: 'Основа', en: 'Base'},
      ingredients: [
        {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
        {id: 'ing-2', value: {uk: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
      ],
      draft: {uk: '', en: '', quantity: '', unit: 'g'},
    },
  ],
  recipeSteps: [
    {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '1/step-img-1.jpg', imgFile: null, id: 'step-1'},
    {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
  ],
  likes: 10,
  videoUrl: 'video-key-1',
  videoFile: null,
  preparingTime: 30,
  weight: null,
  diameter: null,
  calories: null,
  isPremium: false,
  price: { en: 0, uk: 0 },
  discount: 0,
  slug: 'test-recipe',
  ...overrides,
});

// Type guard helpers for tests
const isPublicResult = (result: PrepareUpdateDataResult): result is Extract<PrepareUpdateDataResult, {isPremium: false}> => {
  return result.success && !result.isPremium;
};

const isPremiumResult = (result: PrepareUpdateDataResult): result is Extract<PrepareUpdateDataResult, {isPremium: true}> => {
  return result.success && result.isPremium;
};

describe('prepareUpdateData - Public recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadImage.mockResolvedValue({imagePath: 'recipe-id/new-image.jpg', error: ''});
    mockUploadVideo.mockResolvedValue({videoUrl: 'new-video-key', error: ''});
  });

  // Test 1: Nothing changed - save with same data
  test('should return correct data when nothing changed', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData();

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    expect(isPublicResult(result)).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.title).toEqual({uk: 'Тестовий рецепт', en: 'Test Recipe'});
      expect(result.data.likes).toBe(10);
      expect(result.data.isPremium).toBe(false);
    }
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockUploadVideo).not.toHaveBeenCalled();
  });

  // Test 2: Only title changed
  test('should handle title change correctly', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      title: {uk: 'Новий рецепт', en: 'New Recipe'},
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.title).toEqual({uk: 'Новий рецепт', en: 'New Recipe'});
    }
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  // Test 3: Only category changed
  test('should handle category change correctly', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      category: {uk: 'Супи', en: 'Soups'},
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.category).toEqual({uk: 'Супи', en: 'Soups'});
    }
  });

  // Test 4: Only likes changed
  test('should handle likes change correctly', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      likes: 50,
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.likes).toBe(50);
    }
  });

  // Test 5: Only step description changed
  test('should handle step description change correctly', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Оновлений крок 1', en: 'Updated Step 1'}, imgUrl: '1/step-img-1.jpg', imgFile: null, id: 'step-1'},
        {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.recipeSteps[0].desc).toEqual({uk: 'Оновлений крок 1', en: 'Updated Step 1'});
    }
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  // Test 6: Step image changed (new file uploaded)
  test('should upload new step image when imgFile is provided', async () => {
    const recipe = createMockRecipePublic();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: 'blob:test', imgFile: mockFile, id: 'step-1'},
        {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    if (isPublicResult(result)) {
      expect(result.data.recipeSteps[0].imgUrl).toBe('recipe-id/new-image.jpg');
    }
  });

  // Test 7: Video changed (new file uploaded)
  test('should upload new video when videoFile is provided', async () => {
    const recipe = createMockRecipePublic();
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});
    const formData = createMockFormData({
      videoFile: mockVideoFile,
      videoUrl: 'blob:test-video',
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    expect(mockUploadVideo).toHaveBeenCalledTimes(1);
    if (isPublicResult(result)) {
      expect(result.data.videoUrl).toBe('new-video-key');
    }
  });

  // Test 8: Ingredients changed
  test('should handle ingredients change correctly', async () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      ingredientGroups: [
        {
          id: 'group-1',
          title: {uk: 'Основа', en: 'Base'},
          ingredients: [
            {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '150', unit: 'g'},
            {id: 'ing-2', value: {uk: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
            {id: 'ing-3', value: {uk: 'Яйця', en: 'Eggs'}, quantity: '3', unit: 'pcs'},
          ],
          draft: {uk: '', en: '', quantity: '', unit: 'g'},
        },
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.ingredients).toHaveLength(1);
      expect(result.data.ingredients[0].title.en).toBe('Base');
      expect(result.data.ingredients[0].ingredients).toHaveLength(3);
      expect(result.data.ingredients[0].ingredients[0].quantity).toBe('150');
      expect(result.data.ingredients[0].ingredients[2].value.en).toBe('Eggs');
    }
  });

  // Test 9: All fields changed
  test('should handle all fields changed correctly', async () => {
    const recipe = createMockRecipePublic();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});

    const formData = createMockFormData({
      title: {uk: 'Повністю новий рецепт', en: 'Completely New Recipe'},
      category: {uk: 'Салати', en: 'Salads'},
      likes: 100,
      heroImg: 'blob:new-hero',
      videoUrl: 'blob:new-video',
      videoFile: mockVideoFile,
      recipeSteps: [
        {desc: {uk: 'Новий крок', en: 'New Step'}, imgUrl: 'blob:new-step', imgFile: mockFile, id: 'step-new'},
      ],
      ingredientGroups: [
        {
          id: 'group-new',
          title: {uk: 'Нова група', en: 'New Group'},
          ingredients: [
            {id: 'ing-new', value: {uk: 'Новий інгредієнт', en: 'New Ingredient'}, quantity: '500', unit: 'ml'},
          ],
          draft: {uk: '', en: '', quantity: '', unit: 'g'},
        },
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    if (isPublicResult(result)) {
      expect(result.data.title).toEqual({uk: 'Повністю новий рецепт', en: 'Completely New Recipe'});
      expect(result.data.category).toEqual({uk: 'Салати', en: 'Salads'});
      expect(result.data.likes).toBe(100);
    }
    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    expect(mockUploadVideo).toHaveBeenCalledTimes(1);
  });

  // Test 10: Upload error handling
  test('should return error when image upload fails', async () => {
    mockUploadImage.mockResolvedValue({imagePath: '', error: 'Upload failed'});

    const recipe = createMockRecipePublic();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: 'blob:test', imgFile: mockFile, id: 'step-1'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to upload step image');
    }
  });
});

describe('prepareUpdateData - Premium recipes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadImage.mockResolvedValue({imagePath: 'recipe-id/new-image.jpg', error: ''});
    mockUploadVideo.mockResolvedValue({videoUrl: 'new-video-key', error: ''});
  });

  test('should return premium structure for premium recipe', async () => {
    const recipe = createMockRecipePremium();
    const formData = createMockFormData({
      isPremium: true,
      title: {uk: 'Преміум рецепт', en: 'Premium Recipe'},
      category: {uk: 'Супи', en: 'Soups'},
      likes: 50,
      preparingTime: 60,
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '1/step-img-1.jpg', imgFile: null, id: 'step-1'},
      ],
      ingredientGroups: [
        {
          id: 'group-1',
          title: {uk: 'Основа', en: 'Base'},
          ingredients: [
            {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
          ],
          draft: {uk: '', en: '', quantity: '', unit: 'g'},
        },
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    expect(isPremiumResult(result)).toBe(true);
    if (isPremiumResult(result)) {
      // Main data should NOT contain recipeSteps and videoUrl
      expect(result.mainData.title).toEqual({uk: 'Преміум рецепт', en: 'Premium Recipe'});
      expect(result.mainData.isPremium).toBe(true);
      expect((result.mainData as any).recipeSteps).toBeUndefined();
      expect((result.mainData as any).videoUrl).toBeUndefined();

      // Premium data should contain recipeSteps and videoUrl
      expect(result.premiumData.recipeId).toBe('2');
      expect(result.premiumData.recipeSteps).toHaveLength(1);
      expect(result.premiumData.videoUrl).toBe('video-key-2');
    }
  });

  test('should handle video upload for premium recipe', async () => {
    const recipe = createMockRecipePremium();
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});
    const formData = createMockFormData({
      isPremium: true,
      title: {uk: 'Преміум рецепт', en: 'Premium Recipe'},
      category: {uk: 'Супи', en: 'Soups'},
      likes: 50,
      preparingTime: 60,
      videoFile: mockVideoFile,
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '1/step-img-1.jpg', imgFile: null, id: 'step-1'},
      ],
      ingredientGroups: [
        {
          id: 'group-1',
          title: {uk: 'Основа', en: 'Base'},
          ingredients: [
            {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
          ],
          draft: {uk: '', en: '', quantity: '', unit: 'g'},
        },
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
    });

    expect(result.success).toBe(true);
    expect(mockUploadVideo).toHaveBeenCalledTimes(1);
    if (isPremiumResult(result)) {
      expect(result.premiumData.videoUrl).toBe('new-video-key');
    }
  });
});

describe('hasDataChanged', () => {
  // Test 1: No changes
  test('should return false when no data changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData();

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(false);
  });

  // Test 2: Title changed
  test('should return true when title changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      title: {uk: 'Інша назва', en: 'Different Title'},
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 3: Category changed
  test('should return true when category changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      category: {uk: 'Супи', en: 'Soups'},
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 4: Likes changed
  test('should return true when likes changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      likes: 99,
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 5: Steps count changed
  test('should return true when steps count changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: null, imgFile: null, id: 'step-1'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 6: Step description changed
  test('should return true when step description changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Змінений крок', en: 'Changed Step'}, imgUrl: '1/step-img-1.jpg', imgFile: null, id: 'step-1'},
        {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 7: New step image file added
  test('should return true when new step image file added', () => {
    const recipe = createMockRecipePublic();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {uk: 'Крок 1', en: 'Step 1'}, imgUrl: '1/step-img-1.jpg', imgFile: mockFile, id: 'step-1'},
        {desc: {uk: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 8: Ingredient changed
  test('should return true when ingredient changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      ingredientGroups: [
        {
          id: 'group-1',
          title: {uk: 'Основа', en: 'Base'},
          ingredients: [
            {id: 'ing-1', value: {uk: 'Цукор', en: 'Sugar'}, quantity: '999', unit: 'g'},
            {id: 'ing-2', value: {uk: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
          ],
          draft: {uk: '', en: '', quantity: '', unit: 'g'},
        },
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 9: Video URL changed
  test('should return true when video URL changed', () => {
    const recipe = createMockRecipePublic();
    const formData = createMockFormData({
      videoUrl: 'https://example.com/different-video.mp4',
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 10: New video file added
  test('should return true when new video file added', () => {
    const recipe = createMockRecipePublic();
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});
    const formData = createMockFormData({
      videoFile: mockVideoFile,
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });
});