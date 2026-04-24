import {supabase} from "@/lib/supabase/ClientComponentClient";
import {deleteVideo} from "@/services/storage/deleteVideoR2Bucket";

export const deleteRecipe = async ({ id, videoKey }: { id: string; videoKey: string | null}) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;

  if (videoKey) await deleteVideo(videoKey);
}