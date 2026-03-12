import {compressVideo} from "@/utils/compressVideo";
import {supabase} from "@/lib/supabase/ClientComponentClient";

interface IVideoUploadProps {
  videoFile: File;
  bucket: string;
  filePath: string;
}

export const uploadVideoToStorage = async ({videoFile, bucket, filePath}: IVideoUploadProps) => {
  let compressedVideo;
  let errorMessage;

  try {
    compressedVideo = await compressVideo(videoFile, {
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,
      fps: 30
    });
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Video compression failed';
    return {videoUrl: "", error: errorMessage};
  }

  const path = `${filePath}.webm`;

  const {data, error} = await supabase.storage
    .from(bucket)
    .upload(path, compressedVideo, {
      contentType: 'video/webm'
    });

  if (error) {
    errorMessage = error.message || 'Video uploading failed';
    return {videoUrl: "", error: errorMessage};
  }

  const videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;

  return {videoUrl, error: ''};

}
