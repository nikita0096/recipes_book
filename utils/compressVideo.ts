export interface CompressVideoOptions {
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
}

export async function compressVideo(
  file: File,
  options: CompressVideoOptions = {}
): Promise<File> {
  const {
    width = 1280,
    height = 720,
    bitrate = 1_000_000,
    fps = 30
  } = options;

  const videoUrl = URL.createObjectURL(file);

  // Создаём видео элемент
  const videoElement = document.createElement('video');
  videoElement.src = videoUrl;
  videoElement.muted = true;
  videoElement.playsInline = true;

  // Ждём загрузки метаданных
  await new Promise<void>((resolve, reject) => {
    videoElement.onloadedmetadata = () => resolve();
    videoElement.onerror = () => reject(new Error('Failed to load video metadata'));
  });

  // Canvas для захвата кадров
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = width;
  canvas.height = height;

  // Захватываем поток с canvas
  const stream = canvas.captureStream(fps);
  const chunks: BlobPart[] = [];

  // Определяем поддерживаемый MIME тип
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : 'video/webm';

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: bitrate
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Промис для завершения записи
  const recordingComplete = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      const compressedBlob = new Blob(chunks, { type: mimeType });
      resolve(compressedBlob);
    };
  });

  // Начинаем запись
  mediaRecorder.start();

  // Проигрываем видео и рисуем на canvas
  await videoElement.play();

  const drawFrame = () => {
    if (videoElement.paused || videoElement.ended) {
      mediaRecorder.stop();
      return;
    }
    ctx.drawImage(videoElement, 0, 0, width, height);
    requestAnimationFrame(drawFrame);
  };

  drawFrame();

  // Ждём завершения видео
  await new Promise<void>((resolve) => {
    videoElement.onended = () => resolve();
  });

  // Получаем сжатый Blob
  const compressedBlob = await recordingComplete;

  // Создаём File из Blob
  const compressedFile = new File(
    [compressedBlob],
    file.name.replace(/\.[^.]+$/, '.webm'),
    { type: mimeType }
  );

  // Очищаем ресурсы
  URL.revokeObjectURL(videoUrl);

  return compressedFile;
}