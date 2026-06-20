import { updateAuthorInfo } from '@/services/db/author/updateAuthorInfo';
import { AuthorInfoForm } from '@/app/[locale]/admin/author/page';
import { supabase } from '@/lib/supabase/ClientComponentClient';
import { uploadImage } from '@/services/storage/uploadImagetoStorage';
import { deleteFileByPath } from '@/services/storage/deleteImageFromStorage';
import { getPublicImageUrl } from '@/services/storage/getPublicImageUrl';

// Mock dependencies
jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/services/storage/uploadImagetoStorage', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('@/services/storage/deleteImageFromStorage', () => ({
  deleteFileByPath: jest.fn(),
}));

jest.mock('@/services/storage/getPublicImageUrl', () => ({
  getPublicImageUrl: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-author'),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>;
const mockDeleteFile = deleteFileByPath as jest.MockedFunction<typeof deleteFileByPath>;
const mockGetPublicUrl = getPublicImageUrl as jest.MockedFunction<typeof getPublicImageUrl>;

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
  ...overrides,
});

describe('updateAuthorInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPublicUrl.mockReturnValue('https://storage.example.com/author-123.jpg');
  });

  describe('Basic updates without image change', () => {
    test('should update author info successfully', async () => {
      const formData = createMockAuthorForm();
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAuthorInfo('author-1', formData, 'author-123.jpg');

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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAuthorInfo('author-1', formData, 'author-123.jpg');

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
        youTube: 'https://youtube.com/@yuliia', // Only YouTube provided
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAuthorInfo('author-1', formData, 'author-123.jpg');

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

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAuthorInfo('author-1', formData, 'author-123.jpg');

      expect(result.data.description.en).toBe('Updated English description');
      expect(result.data.description.uk).toBe('Оновлений український опис');
    });
  });

  describe('Image upload scenarios', () => {
    test('should upload new image and delete old one', async () => {
      const mockFile = new File(['image content'], 'new-author.jpg', { type: 'image/jpeg' });
      const formData = createMockAuthorForm({
        imageFile: mockFile,
      });

      mockDeleteFile.mockResolvedValue({ success: true });
      mockUploadImage.mockResolvedValue({
        imagePath: 'author-test-uuid-author',
        error: null,
      });
      mockGetPublicUrl.mockReturnValue('https://storage.example.com/author-test-uuid-author');

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
                image: 'author-test-uuid-author',
                description: formData.description,
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      const result = await updateAuthorInfo('author-1', formData, 'old-author-123.jpg');

      // Should delete old image
      expect(mockDeleteFile).toHaveBeenCalledWith('old-author-123.jpg', 'author');

      // Should upload new image
      expect(mockUploadImage).toHaveBeenCalledWith({
        file: mockFile,
        bucket: 'author',
        filePath: 'author-test-uuid-author',
      });

      // Should return new image URL
      expect(result.data.image).toBe('https://storage.example.com/author-test-uuid-author');
    });

    test('should throw error if image upload fails', async () => {
      const mockFile = new File(['image content'], 'new-author.jpg', { type: 'image/jpeg' });
      const formData = createMockAuthorForm({
        imageFile: mockFile,
      });

      mockDeleteFile.mockResolvedValue({ success: true });
      mockUploadImage.mockResolvedValue({
        imagePath: '',
        error: 'Upload failed',
      });

      await expect(updateAuthorInfo('author-1', formData, 'old-author.jpg')).rejects.toThrow(
        'Failed to upload image'
      );
    });
  });

  describe('Error handling', () => {
    test('should throw error when database update fails', async () => {
      const formData = createMockAuthorForm();

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      await expect(updateAuthorInfo('author-1', formData, 'author-123.jpg')).rejects.toThrow(
        'Database error'
      );
    });

    test('should throw error when no data returned', async () => {
      const formData = createMockAuthorForm();

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      await expect(updateAuthorInfo('author-1', formData, 'author-123.jpg')).rejects.toThrow(
        'Failed to update author'
      );
    });
  });

  describe('Field mapping (camelCase <-> snake_case)', () => {
    test('should correctly map all fields to snake_case', async () => {
      const formData = createMockAuthorForm();

      let capturedUpdateData: any;
      const mockUpdate = jest.fn().mockImplementation((data) => {
        capturedUpdateData = data;
        return {
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
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
              }),
            }),
          }),
        };
      });

      mockSupabase.from.mockReturnValue({ update: mockUpdate } as any);

      await updateAuthorInfo('author-1', formData, 'author-123.jpg');

      // Verify snake_case mapping
      expect(capturedUpdateData.contact_email).toBe(formData.email);
      expect(capturedUpdateData.inst_link).toBe(formData.instagram);
      expect(capturedUpdateData.tik_tok_link).toBe(formData.tikTok);
      expect(capturedUpdateData.you_tube_link).toBe(formData.youTube);
      expect(capturedUpdateData.facebook_link).toBe(formData.facebook);
      expect(capturedUpdateData.telegram_link).toBe(formData.telegram);
      expect(capturedUpdateData.recipes_count).toBe(formData.recipesCount);
    });
  });
});
