import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipePremiumUpload} from "@/types/recipe";

export const insertPremiumRecipePart = async (recipeData: IRecipePremiumUpload) => {
  const {data, error} = await supabase
    .from('recipes_premium')
    .insert({
      id: recipeData.id,
      recipe_id: recipeData.recipeId,
      recipe_steps: recipeData.recipeSteps,
      video_url: recipeData.videoUrl,
    });

  if (error) {
    throw error;
  }
}