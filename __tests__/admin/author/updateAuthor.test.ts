import { updateAuthorInfo } from '@/services/db/author/updateAuthorInfo';
import { AuthorInfoForm } from '@/app/[locale]/admin/author/page';
import { createClient } from '@/lib/supabase/ServerComponentClient';
import { getPublicImageUrl } from '@/services/storage/getPublicImageUrl';

// The author update service creates its own request-scoped client; mock it.
jest.mock('@/lib/supabase/ServerComponentClient', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/services/storage/getPublicImageUrl', () => ({
  getPublicImageUrl: jest.fn(),
}));

const mockSupabase = { from: jest.fn() };
(createClient as jest.Mock).mockResolvedValue(mockSupabase);
const mockGetPublicUrl = getPublicImageUrl as jest.MockedFunction<typeof getPublicImageUrl>;

// The service accepts the form fields with the image already resolved to a
// path (the imageFile is stripped client-side), so the mock form doubles as a
// valid payload.
const createMockAuthorForm = (overrides?: Partial<AuthorInfoForm>): AuthorInfoForm => ({
  name: 'Yuliia Stohantseva',
  email: 'yuliia@example.com',
  instagram: 'https://instagram.com/yuliia',
  tikTok: 'https://tiktok.com/@yuliia',
  youTube: 'https://youtube.com/@yuliia',
  facebook: 'https://facebook.com/yuliia',
  telegram: 'https://t.me/yuliia',
  recipesCount: 100,
  subscribers: 1.5,
  views: 50,
  image: 'author-123.jpg',
  imageFile: null,
  description: {
    en: 'Professional pastry chef with 10+ years experience',
    uk: 'Професійний кондитер з 10+ роками досвіду',
  },
  descriptionFooter: {
    en: 'Sweet moments, baked with love',
    uk: 'Солодкі моменти, спечені з любовʼю',
  },
  animatedHeroWords: {
    en: 'cakes cookies pastries',
    uk: 'торти печиво випічка',
  },
  heroCakeId: 'cake-123',
  ...overrides,
});

// Build a chained update().eq().select().single() mock resolving to the row.
const mockUpdateChain = (resolved: { data: unknown; error: unknown }) => {
  const single = jest.fn().mockResolvedValue(resolved);
  const select = jest.fn().mockReturnValue({ single });
  const eq = jest.fn().mockReturnValue({ select });
  const update = jest.fn().mockReturnValue({ eq });
  mockSupabase.from.mockReturnValue({ update } as never);
  return { update };
};

describe('updateAuthorInfo (server)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPublicUrl.mockReturnValue('https://storage.example.com/author-123.jpg');
  });

  describe('Basic updates', () => {
    test('should update author info successfully', async () => {
      const formData = createMockAuthorForm();
      mockUpdateChain({
        data: {
          id: 'author-1',
          name: formData.name,
          contact_email: formData.email,
          inst_link: formData.instagram,
          tik_tok_link: formData.tikTok,
          you_tube_link: formData.youTube,
          facebook_link: formData.facebook,
          telegram_link: formData.telegram,
          recipes_count: formData.recipesCount,
          subscribers: formData.subscribers,
          views: formData.views,
          image: formData.image,
          description: formData.description,
        },
        error: null,
      });

      const result = await updateAuthorInfo('author-1', formData);

      expect(result.error).toBeNull();
      expect(result.data.name).toBe('Yuliia Stohantseva');
      expect(result.data.email).toBe('yuliia@example.com');
      expect(result.data.recipesCount).toBe(100);
      expect(result.data.description.en).toBe('Professional pastry chef with 10+ years experience');
    });

    test('should handle numeric fields correctly', async () => {
      const formData = createMockAuthorForm({
        recipesCount: 250,
        subscribers: 2.8,
        views: 120,
      });

      mockUpdateChain({
        data: {
          id: 'author-1',
          name: formData.name,
          contact_email: formData.email,
          inst_link: formData.instagram,
          tik_tok_link: formData.tikTok,
          you_tube_link: formData.youTube,
          facebook_link: formData.facebook,
          telegram_link: formData.telegram,
          recipes_count: 250,
          subscribers: 2.8,
          views: 120,
          image: formData.image,
          description: formData.description,
        },
        error: null,
      });

      const result = await updateAuthorInfo('author-1', formData);

      expect(result.data.recipesCount).toBe(250);
      expect(result.data.subscribers).toBe(2.8);
      expect(result.data.views).toBe(120);
    });

    test('should handle empty social links (optional fields)', async () => {
      const formData = createMockAuthorForm({
        instagram: '',
        tikTok: '',
        facebook: '',
        telegram: '',
        youTube: 'https://youtube.com/@yuliia',
      });

      mockUpdateChain({
        data: {
          id: 'author-1',
          name: formData.name,
          contact_email: formData.email,
          inst_link: '',
          tik_tok_link: '',
          you_tube_link: 'https://youtube.com/@yuliia',
          facebook_link: '',
          telegram_link: '',
          recipes_count: formData.recipesCount,
          subscribers: formData.subscribers,
          views: formData.views,
          image: formData.image,
          description: formData.description,
        },
        error: null,
      });

      const result = await updateAuthorInfo('author-1', formData);

      expect(result.data.instagram).toBe('');
      expect(result.data.tikTok).toBe('');
      expect(result.data.youTube).toBe('https://youtube.com/@yuliia');
    });

    test('should update description in both languages', async () => {
      const formData = createMockAuthorForm({
        description: {
          en: 'Updated English description',
          uk: 'Оновлений український опис',
        },
      });

      mockUpdateChain({
        data: {
          id: 'author-1',
          name: formData.name,
          contact_email: formData.email,
          inst_link: formData.instagram,
          tik_tok_link: formData.tikTok,
          you_tube_link: formData.youTube,
          facebook_link: formData.facebook,
          telegram_link: formData.telegram,
          recipes_count: formData.recipesCount,
          subscribers: formData.subscribers,
          views: formData.views,
          image: formData.image,
          description: {
            en: 'Updated English description',
            uk: 'Оновлений український опис',
          },
        },
        error: null,
      });

      const result = await updateAuthorInfo('author-1', formData);

      expect(result.data.description.en).toBe('Updated English description');
      expect(result.data.description.uk).toBe('Оновлений український опис');
    });
  });

  describe('Error handling', () => {
    test('should throw error when database update fails', async () => {
      const formData = createMockAuthorForm();
      mockUpdateChain({ data: null, error: { message: 'Database error' } });

      await expect(updateAuthorInfo('author-1', formData)).rejects.toThrow('Database error');
    });

    test('should throw error when no data returned', async () => {
      const formData = createMockAuthorForm();
      mockUpdateChain({ data: null, error: null });

      await expect(updateAuthorInfo('author-1', formData)).rejects.toThrow('Failed to update author');
    });
  });

  describe('Field mapping (camelCase <-> snake_case)', () => {
    test('should correctly map all fields to snake_case', async () => {
      const formData = createMockAuthorForm();

      let capturedUpdateData: Record<string, unknown> | undefined;
      const single = jest.fn().mockResolvedValue({
        data: {
          id: 'author-1',
          name: formData.name,
          contact_email: formData.email,
          inst_link: formData.instagram,
          tik_tok_link: formData.tikTok,
          you_tube_link: formData.youTube,
          facebook_link: formData.facebook,
          telegram_link: formData.telegram,
          recipes_count: formData.recipesCount,
          subscribers: formData.subscribers,
          views: formData.views,
          image: formData.image,
          description: formData.description,
        },
        error: null,
      });
      const update = jest.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return { eq: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single }) }) };
      });
      mockSupabase.from.mockReturnValue({ update } as never);

      await updateAuthorInfo('author-1', formData);

      expect(capturedUpdateData!.contact_email).toBe(formData.email);
      expect(capturedUpdateData!.inst_link).toBe(formData.instagram);
      expect(capturedUpdateData!.tik_tok_link).toBe(formData.tikTok);
      expect(capturedUpdateData!.you_tube_link).toBe(formData.youTube);
      expect(capturedUpdateData!.facebook_link).toBe(formData.facebook);
      expect(capturedUpdateData!.telegram_link).toBe(formData.telegram);
      expect(capturedUpdateData!.recipes_count).toBe(formData.recipesCount);
      // Hero words are normalized from free text into arrays.
      expect(capturedUpdateData!.animated_hero_words).toEqual({
        en: ['cakes', 'cookies', 'pastries'],
        uk: ['торти', 'печиво', 'випічка'],
      });
    });
  });
});
