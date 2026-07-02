import { uploadImageServer } from '@/services/api/admin/uploadImageServer';
import { supabase } from '@/lib/supabase/ClientComponentClient';

jest.mock('@/lib/supabase/ClientComponentClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

const storageFrom = supabase.storage.from as jest.Mock;

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as Response;

const nonJsonResponse = (status: number) =>
  ({
    ok: false,
    status,
    json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
  }) as unknown as Response;

describe('uploadImageServer', () => {
  const mockFile = new File(['image content'], 'photo.png', { type: 'image/png' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signs, uploads straight to storage and processes the image', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'signed-token', path: 'hero-images/hero.orig' }))
      .mockResolvedValueOnce(jsonResponse({ imagePath: 'hero-images/hero.webp', error: '' }));

    const uploadToSignedUrl = jest.fn().mockResolvedValue({ data: {}, error: null });
    storageFrom.mockReturnValue({ uploadToSignedUrl });

    const result = await uploadImageServer(mockFile, 'hero-images', 'hero-images/hero');

    expect(result).toEqual({ imagePath: 'hero-images/hero.webp', error: '' });

    // Step 1: signed upload URL requested with a small JSON body
    const [signUrl, signInit] = (global.fetch as jest.Mock).mock.calls[0];
    expect(signUrl).toBe('/api/admin/upload_image/sign');
    expect(signInit.method).toBe('POST');
    expect(signInit.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(signInit.body)).toEqual({ bucket: 'hero-images', filePath: 'hero-images/hero' });

    // Step 2: the file bytes go directly to Supabase Storage, not through the API
    expect(storageFrom).toHaveBeenCalledWith('hero-images');
    expect(uploadToSignedUrl).toHaveBeenCalledWith(
      'hero-images/hero.orig',
      'signed-token',
      mockFile,
      { contentType: 'image/png' }
    );

    // Step 3: compression triggered with a small JSON body
    const [processUrl, processInit] = (global.fetch as jest.Mock).mock.calls[1];
    expect(processUrl).toBe('/api/admin/upload_image/process');
    expect(JSON.parse(processInit.body)).toEqual({ bucket: 'hero-images', filePath: 'hero-images/hero' });
  });

  test('surfaces a non-JSON platform error from the sign route', async () => {
    global.fetch = jest.fn().mockResolvedValue(nonJsonResponse(413));

    const result = await uploadImageServer(mockFile, 'steps', 'steps/step-1');

    expect(result).toEqual({
      imagePath: '',
      error: 'Request to /api/admin/upload_image/sign failed (413)',
    });
    expect(storageFrom).not.toHaveBeenCalled();
  });

  test('returns an error and skips processing when the direct upload fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'signed-token', path: 'steps/step-1.orig' }));

    const uploadToSignedUrl = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: 'Payload too large' } });
    storageFrom.mockReturnValue({ uploadToSignedUrl });

    const result = await uploadImageServer(mockFile, 'steps', 'steps/step-1');

    expect(result).toEqual({ imagePath: '', error: 'Failed to upload image' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('passes through an error returned by the process route', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'signed-token', path: 'steps/step-1.orig' }))
      .mockResolvedValueOnce(jsonResponse({ imagePath: '', error: 'Failed to compose image' }, 500));

    const uploadToSignedUrl = jest.fn().mockResolvedValue({ data: {}, error: null });
    storageFrom.mockReturnValue({ uploadToSignedUrl });

    const result = await uploadImageServer(mockFile, 'steps', 'steps/step-1');

    expect(result).toEqual({ imagePath: '', error: 'Failed to compose image' });
  });

  test('returns the error message when the request itself fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await uploadImageServer(mockFile, 'steps', 'steps/step-1');

    expect(result).toEqual({ imagePath: '', error: 'Network error' });
  });
});