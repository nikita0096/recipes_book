import {supabase} from "@/lib/supabase/ClientComponentClient";
import {LocalizedText} from "@/types/forms";

export type { LocalizedText };

export interface IUploadPrivateData {
  recipeId: string;
  recipeSteps: { desc: LocalizedText, imgUrl: string | null, id: string }[];
  videoUrl: string;
}

export const insertPremiumRecipePart = async (recipeData: IUploadPrivateData) => {
  const { error} = await supabase
    .from('recipes_premium')
    .insert({
      recipe_id: recipeData.recipeId,
      recipe_steps: recipeData.recipeSteps,
      video_url: recipeData.videoUrl,
    });

  if (error) {
    throw error;
  }
}