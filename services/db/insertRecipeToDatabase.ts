import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipeUpload} from "@/types/recipe";

export const insertRecipe = async (recipeData: IRecipeUpload) => {
  const { data, error} = await supabase
    .from('recipes')
    .insert({
      title: recipeData.title,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImg,
      is_premium: recipeData.isPremium,
      preparing_time: recipeData.preparingTime,
      video_url: recipeData.videoUrl ? recipeData.videoUrl : null,
      recipe_steps: recipeData.recipeSteps ? recipeData.recipeSteps : null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
