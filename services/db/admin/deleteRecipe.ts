import {supabase} from "@/lib/supabase/ClientComponentClient";
import {deleteVideoFromStream} from "@/services/storage/deleteVideoFromStream";

export const deleteRecipe = async ({ id, videoKey }: { id: string; videoKey: string | null }) => {
  // Если videoKey не передан, пробуем получить из premium таблицы (до удаления рецепта!)
  let finalVideoKey = videoKey;

  if (!finalVideoKey) {
    const { data: premiumData } = await supabase
      .from('recipes_premium')
      .select('video_url')
      .eq('recipe_id', id)
      .maybeSingle();

    if (premiumData?.video_url) {
      finalVideoKey = premiumData.video_url;
    }
  }


  const { error: deleteError } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return { error: deleteError };
  }

  const { data: heroImage, error: listError } = await supabase
    .storage
    .from('hero-images')
    .list(id);

  if (listError) {
    return { error: listError };
  }

  const heroImgList = heroImage?.map((item) => `${id}/${item.name}`);

  if (heroImgList && heroImgList.length > 0) {
    const { error: removeError } = await supabase
      .storage
      .from('hero-images')
      .remove(heroImgList);

    if (removeError) {
      return { error: removeError };
    }
  }

  const { data: stepsList, error: stepListError } = await supabase
    .storage
    .from('steps')
    .list(id);

  if (stepListError) {
    return { error: stepListError };
  }

  const stepsImagesList = stepsList?.map((item) => `${id}/${item.name}`);

  if (stepsImagesList && stepsImagesList.length > 0) {
    const { error: removeError } = await supabase
      .storage
      .from('steps')
      .remove(stepsImagesList);

    if (removeError) {
      return { error: removeError };
    }
  }


  if (finalVideoKey) {
    const res = await deleteVideoFromStream(finalVideoKey);

    if (!res.success && res.error) {
      return { error: res.error };
    }
  }

  return { error: null };
}