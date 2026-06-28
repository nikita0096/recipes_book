import imageCompression from "browser-image-compression";
import {supabase} from "@/lib/supabase/ClientComponentClient";

type UploadProps = {
  file: File;
  bucket: string;
  filePath: string;
}

export async function uploadImage({file, bucket, filePath}: UploadProps) {
  let errorMessage;
  let compressedImage = null;

  try {
    compressedImage = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1600,
      fileType: 'image/webp',
      useWebWorker: true,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Image compression failed';
    return {imagePath: "", error: errorMessage};
  }

  const fileExtension = compressedImage.type.split('/');
  const path = `${filePath}.${fileExtension[fileExtension.length - 1]}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, compressedImage);

  if (error) {
    errorMessage = 'Image uploading failed';
    return {imagePath: "", error: errorMessage};
  }

  return {imagePath: data.path, error: ''};
}