import {prepareUpdateData, hasDataChanged} from '@/app/[locale]/admin/recipes/[recipe]/utils/prepareUpdateData';
import {EditingValues} from '@/app/[locale]/admin/recipes/[recipe]/page';
import {IRecipe} from '@/types/recipe';
import {uploadImage} from '@/services/storage/uploadImagetoStorage';
import {uploadVideoToStorage} from '@/services/storage/uploadVideoToStorage';

// Mock the upload functions
jest.mock('@/services/storage/uploadImagetoStorage', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('@/services/storage/uploadVideoToStorage', () => ({
  uploadVideoToStorage: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

const mockUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>;
const mockUploadVideo = uploadVideoToStorage as jest.MockedFunction<typeof uploadVideoToStorage>;

// Base mock data
const createMockRecipe = (): IRecipe => ({
  id: '1',
  title: {ua: 'Тестовий рецепт', en: 'Test Recipe'},
  likes: 10,
  category: {ua: 'Десерти', en: 'Desserts'},
  recipeSteps: [
    {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: 'https://example.com/step1.jpg', id: 'step-1'},
    {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, id: 'step-2'},
  ],
  ingredients: [
    {id: 'ing-1', value: {ua: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
    {id: 'ing-2', value: {ua: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
  ],
  heroImg: 'https://example.com/hero.jpg',
  isPremium: false,
  preparingTime: 30,
  videoUrl: 'https://example.com/video.mp4',
});

const createMockFormData = (overrides?: Partial<EditingValues>): EditingValues => ({
  heroImg: 'https://example.com/hero.jpg',
  category: {ua: 'Десерти', en: 'Desserts'},
  title: {ua: 'Тестовий рецепт', en: 'Test Recipe'},
  ingredients: [
    {id: 'ing-1', value: {ua: 'Цукор', en: 'Sugar'}, quantity: '100', unit: 'g'},
    {id: 'ing-2', value: {ua: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
  ],
  recipeSteps: [
    {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: 'https://example.com/step1.jpg', imgFile: null, id: 'step-1'},
    {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
  ],
  likes: 10,
  ingredientEn: '',
  ingredientUa: '',
  ingredientQuantity: '',
  ingredientUnit: 'g',
  videoUrl: 'https://example.com/video.mp4',
  videoFile: null,
  ...overrides,
});

describe('prepareUpdateData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUploadImage.mockResolvedValue({imageUrl: 'https://example.com/new-image.jpg', error: ''});
    mockUploadVideo.mockResolvedValue({videoUrl: 'https://example.com/new-video.mp4', error: ''});
  });

  // Test 1: Nothing changed - save with same data
  test('should return correct data when nothing changed', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData();

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.title).toEqual({ua: 'Тестовий рецепт', en: 'Test Recipe'});
    expect(result.data?.likes).toBe(10);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockUploadVideo).not.toHaveBeenCalled();
  });

  // Test 2: Only title changed
  test('should handle title change correctly', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      title: {ua: 'Новий рецепт', en: 'New Recipe'},
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.title).toEqual({ua: 'Новий рецепт', en: 'New Recipe'});
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  // Test 3: Only category changed
  test('should handle category change correctly', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      category: {ua: 'Супи', en: 'Soups'},
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.category).toEqual({ua: 'Супи', en: 'Soups'});
  });

  // Test 4: Only likes changed
  test('should handle likes change correctly', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      likes: 50,
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.likes).toBe(50);
  });

  // Test 5: Only step description changed
  test('should handle step description change correctly', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Оновлений крок 1', en: 'Updated Step 1'}, imgUrl: 'https://example.com/step1.jpg', imgFile: null, id: 'step-1'},
        {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.recipeSteps[0].desc).toEqual({ua: 'Оновлений крок 1', en: 'Updated Step 1'});
    expect(mockUploadImage).not.toHaveBeenCalled();
  });

  // Test 6: Step image changed (new file uploaded)
  test('should upload new step image when imgFile is provided', async () => {
    const recipe = createMockRecipe();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: 'blob:test', imgFile: mockFile, id: 'step-1'},
        {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    expect(result.data?.recipeSteps[0].imgUrl).toBe('https://example.com/new-image.jpg');
  });

  // Test 7: Video changed (new file uploaded)
  test('should upload new video when videoFile is provided', async () => {
    const recipe = createMockRecipe();
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});
    const formData = createMockFormData({
      videoFile: mockVideoFile,
      videoUrl: 'blob:test-video',
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(mockUploadVideo).toHaveBeenCalledTimes(1);
    expect(result.data?.videoUrl).toBe('https://example.com/new-video.mp4');
  });

  // Test 8: Ingredients changed
  test('should handle ingredients change correctly', async () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      ingredients: [
        {id: 'ing-1', value: {ua: 'Цукор', en: 'Sugar'}, quantity: '150', unit: 'g'},
        {id: 'ing-2', value: {ua: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
        {id: 'ing-3', value: {ua: 'Яйця', en: 'Eggs'}, quantity: '3', unit: 'pcs'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.ingredients).toHaveLength(3);
    expect(result.data?.ingredients[0].quantity).toBe('150');
    expect(result.data?.ingredients[2].value.en).toBe('Eggs');
  });

  // Test 9: All fields changed
  test('should handle all fields changed correctly', async () => {
    const recipe = createMockRecipe();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});

    const formData = createMockFormData({
      title: {ua: 'Повністю новий рецепт', en: 'Completely New Recipe'},
      category: {ua: 'Салати', en: 'Salads'},
      likes: 100,
      heroImg: 'blob:new-hero',
      videoUrl: 'blob:new-video',
      videoFile: mockVideoFile,
      recipeSteps: [
        {desc: {ua: 'Новий крок', en: 'New Step'}, imgUrl: 'blob:new-step', imgFile: mockFile, id: 'step-new'},
      ],
      ingredients: [
        {id: 'ing-new', value: {ua: 'Новий інгредієнт', en: 'New Ingredient'}, quantity: '500', unit: 'ml'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: 'blob:new-hero',
    });

    expect(result.success).toBe(true);
    expect(result.data?.title).toEqual({ua: 'Повністю новий рецепт', en: 'Completely New Recipe'});
    expect(result.data?.category).toEqual({ua: 'Салати', en: 'Salads'});
    expect(result.data?.likes).toBe(100);
    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    expect(mockUploadVideo).toHaveBeenCalledTimes(1);
  });

  // Test 10: Upload error handling
  test('should return error when image upload fails', async () => {
    mockUploadImage.mockResolvedValue({imageUrl: '', error: 'Upload failed'});

    const recipe = createMockRecipe();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: 'blob:test', imgFile: mockFile, id: 'step-1'},
      ],
    });

    const result = await prepareUpdateData({
      formData,
      recipe,
      updatedHeroImg: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to upload step image');
  });
});

describe('hasDataChanged', () => {
  // Test 1: No changes
  test('should return false when no data changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData();

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(false);
  });

  // Test 2: Title changed
  test('should return true when title changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      title: {ua: 'Інша назва', en: 'Different Title'},
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 3: Category changed
  test('should return true when category changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      category: {ua: 'Супи', en: 'Soups'},
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 4: Likes changed
  test('should return true when likes changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      likes: 99,
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 5: Steps count changed
  test('should return true when steps count changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: null, imgFile: null, id: 'step-1'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 6: Step description changed
  test('should return true when step description changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Змінений крок', en: 'Changed Step'}, imgUrl: 'https://example.com/step1.jpg', imgFile: null, id: 'step-1'},
        {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 7: New step image file added
  test('should return true when new step image file added', () => {
    const recipe = createMockRecipe();
    const mockFile = new File(['test'], 'test.jpg', {type: 'image/jpeg'});
    const formData = createMockFormData({
      recipeSteps: [
        {desc: {ua: 'Крок 1', en: 'Step 1'}, imgUrl: 'https://example.com/step1.jpg', imgFile: mockFile, id: 'step-1'},
        {desc: {ua: 'Крок 2', en: 'Step 2'}, imgUrl: null, imgFile: null, id: 'step-2'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 8: Ingredient changed
  test('should return true when ingredient changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      ingredients: [
        {id: 'ing-1', value: {ua: 'Цукор', en: 'Sugar'}, quantity: '999', unit: 'g'},
        {id: 'ing-2', value: {ua: 'Борошно', en: 'Flour'}, quantity: '200', unit: 'g'},
      ],
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 9: Video URL changed
  test('should return true when video URL changed', () => {
    const recipe = createMockRecipe();
    const formData = createMockFormData({
      videoUrl: 'https://example.com/different-video.mp4',
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });

  // Test 10: New video file added
  test('should return true when new video file added', () => {
    const recipe = createMockRecipe();
    const mockVideoFile = new File(['video'], 'test.mp4', {type: 'video/mp4'});
    const formData = createMockFormData({
      videoFile: mockVideoFile,
    });

    const result = hasDataChanged(formData, recipe);

    expect(result).toBe(true);
  });
});