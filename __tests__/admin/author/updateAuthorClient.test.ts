import { updateAuthorInfo } from '@/services/api/admin/updateAuthor';
import { AuthorInfoForm } from '@/app/[locale]/admin/author/page';
import { uploadImage } from '@/services/storage/uploadImagetoStorage';
import { deleteFileByPath } from '@/services/storage/deleteImageFromStorage';

jest.mock('@/services/storage/uploadImagetoStorage', () => ({
  uploadImage: jest.fn(),
}));

jest.mock('@/services/storage/deleteImageFromStorage', () => ({
  deleteFileByPath: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-author'),
}));

const mockUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>;
const mockDeleteFile = deleteFileByPath as jest.MockedFunction<typeof deleteFileByPath>;

const createMockAuthorForm = (overrides?: Partial<AuthorInfoForm>): AuthorInfoForm => ({
  name: 'Yuliia',
  email: 'yuliia@example.com',
  instagram: '#',
  tikTok: '#',
  youTube: '#',
  facebook: '#',
  telegram: '#',
  recipesCount: 100,
  subscribers: 1.5,
  views: 50,
  image: 'author-123.jpg',
  imageFile: null,
  description: { en: 'desc', uk: 'опис' },
  descriptionFooter: { en: 'footer', uk: 'футер' },
  animatedHeroWords: { en: 'cakes', uk: 'торти' },
  ...overrides,
});

const okResponse = () =>
  ({
    ok: true,
    json: jest.fn().mockResolvedValue({ data: { id: 'author-1' }, error: null }),
  }) as unknown as Response;

describe('updateAuthorInfo (client wrapper)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue(okResponse());
  });

  test('uploads new image, deletes old one, and PATCHes resolved path', async () => {
    const mockFile = new File(['image content'], 'new-author.jpg', { type: 'image/jpeg' });
    const formData = createMockAuthorForm({ imageFile: mockFile });

    mockDeleteFile.mockResolvedValue({ success: true });
    mockUploadImage.mockResolvedValue({ imagePath: 'author-test-uuid-author', error: '' });

    await updateAuthorInfo('author-1', formData, 'old-author-123.jpg');

    expect(mockDeleteFile).toHaveBeenCalledWith('old-author-123.jpg', 'author');
    expect(mockUploadImage).toHaveBeenCalledWith({
      file: mockFile,
      bucket: 'author',
      filePath: 'author-test-uuid-author',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.image).toBe('author-test-uuid-author');
    expect(body.imageFile).toBeUndefined();
  });

  test('skips upload when no new file and sends current path', async () => {
    const formData = createMockAuthorForm({ imageFile: null });

    await updateAuthorInfo('author-1', formData, 'author-123.jpg');

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.image).toBe('author-123.jpg');
  });

  test('throws when image upload fails (no request sent)', async () => {
    const mockFile = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const formData = createMockAuthorForm({ imageFile: mockFile });

    mockDeleteFile.mockResolvedValue({ success: true });
    mockUploadImage.mockResolvedValue({ imagePath: '', error: 'Upload failed' });

    await expect(updateAuthorInfo('author-1', formData, 'old.jpg')).rejects.toThrow(
      'Failed to upload image'
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('throws when the API responds with an error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Admin access required' }),
    });

    const formData = createMockAuthorForm();

    await expect(updateAuthorInfo('author-1', formData, 'author-123.jpg')).rejects.toThrow(
      'Admin access required'
    );
  });
});
