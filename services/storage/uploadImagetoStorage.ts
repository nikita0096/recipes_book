import imageCompression from "browser-image-compression";
import {supabase} from "@/supabase/ClientComponentClient";

type UploadProps = {
  file: File;
  bucket: string;
  filePath: string;
}

export async function uploadImage({file, bucket, filePath}: UploadProps) {
  const fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1);
  const path = `${filePath}.${fileExtension}`;

  try {
    file = await imageCompression(file, {
      maxSizeMB: 1
    });
  } catch (err) {
    console.error(err);
    return {imageUrl: "", error: "Image compression failed"};
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    console.error(error);
    return {imageUrl: "", error: "Image upload failed"};
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;

  return {imageUrl, error: ''};
}