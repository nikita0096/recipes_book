import { uploadImageServer } from '@/services/api/admin/uploadImageServer';

describe('uploadImageServer', () => {
  const mockFile = new File(['image content'], 'photo.png', { type: 'image/png' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POSTs multipart form data to the upload route and returns the resolved path', async () => {
    const jsonMock = jest.fn().mockResolvedValue({ imagePath: 'hero-images/hero.webp', error: '' });
    global.fetch = jest.fn().mockResolvedValue({ json: jsonMock } as unknown as Response);

    const result = await uploadImageServer(mockFile, 'hero-images', 'hero-images/hero');

    expect(result).toEqual({ imagePath: 'hero-images/hero.webp', error: '' });

    // Correct absolute endpoint and method
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/admin/upload_image');
    expect(init.method).toBe('POST');

    // Body is FormData carrying file, bucket and filePath
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(mockFile);
    expect(body.get('bucket')).toBe('hero-images');
    expect(body.get('filePath')).toBe('hero-images/hero');

    // No manual Content-Type header — the browser sets the multipart boundary
    expect(init.headers).toBeUndefined();
  });

  test('passes through an error returned by the route', async () => {
    const jsonMock = jest.fn().mockResolvedValue({ imagePath: '', error: 'Failed to upload image' });
    global.fetch = jest.fn().mockResolvedValue({ json: jsonMock } as unknown as Response);

    const result = await uploadImageServer(mockFile, 'steps', 'steps/step-1');

    expect(result).toEqual({ imagePath: '', error: 'Failed to upload image' });
  });

  test('rejects when the request itself fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(uploadImageServer(mockFile, 'steps', 'steps/step-1')).rejects.toThrow(
      'Network error'
    );
  });
});
