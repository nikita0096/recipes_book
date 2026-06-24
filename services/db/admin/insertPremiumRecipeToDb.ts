import {createClient} from "@/lib/supabase/ServerComponentClient";
import {IRecipePremiumUpload} from "@/types/recipe";

export const insertPremiumRecipePart = async (recipeData: IRecipePremiumUpload) => {
  if (recipeData.price === null) {
    return;
  }

  const supabase = await createClient();

  const { error: priceError } = await supabase
    .from('recipes_price')
    .insert({
      recipe_id: recipeData.recipeId,
      price: recipeData.price,
      discount: recipeData.discount
    });

  if (priceError) throw priceError;

  const {error} = await supabase
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