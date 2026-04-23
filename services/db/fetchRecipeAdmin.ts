import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe, IRecipePublic, IRecipePremiumFull} from "@/types/recipe";

export const fetchRecipeAdmin = async (id: string): Promise<IRecipe> => {
  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Public рецепт - все данные в main table
  if (!data.is_premium) {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg: data.hero_img,
      isPremium: false as const,
      preparingTime: data.preparing_time,
      recipeSteps: data.recipe_steps,
      videoUrl: data.video_url,
    } satisfies IRecipePublic;
  }

  // Premium рецепт - fetch из premium table
  const {data: premiumData, error: premiumError} = await supabase
    .from('recipes_premium')
    .select('*')
    .eq('recipe_id', id)
    .single();

  if (premiumError) {
    throw premiumError;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    likes: data.likes,
    category: data.category,
    ingredients: data.ingredients,
    heroImg: data.hero_img,
    isPremium: true as const,
    preparingTime: data.preparing_time,
    recipeSteps: premiumData.recipe_steps,
    videoUrl: premiumData.video_url,
  } satisfies IRecipePremiumFull;
}