import imageCompression from "browser-image-compression";
import {supabase} from "@/lib/supabase/ClientComponentClient";

type UploadProps = {
  file: File;
  bucket: string;
  filePath: string;
}

export async function uploadImage({file, bucket, filePath}: UploadProps) {
  const fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1);
  const path = `${filePath}.${fileExtension}`;

  let errorMessage;

  try {
    file = await imageCompression(file, {
      maxSizeMB: 1
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Image compression failed';
    return {imagePath: "", error: errorMessage};
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    errorMessage = 'Image uploading failed';
    return {imagePath: "", error: errorMessage};
  }

  return {imagePath: data.path, error: ''};
}