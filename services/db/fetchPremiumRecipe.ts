import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe} from "@/types/recipe";

export const fetchPremiumRecipe = async (id: string): Promise<IRecipe> => {
  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  if(!data.is_premium) {

    console.log('free', data);
    return {
      id: data.id,
      title: data.title,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg: data.hero_img,
      isPremium: data.is_premium,
      preparingTime: data.preparing_time,
      recipeSteps: data.recipe_steps,
      videoUrl: data.video_url,
    };
  } else {
    const {data: premiumData, error: premiumError} = await supabase
      .from('recipes_premium')
      .select('*')
      .eq('recipe_id', id)
      .single();

    if(premiumError) {
      throw premiumError;
    }
    console.log('premium', premiumData);
    return {
      id: data.id,
      title: data.title,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg: data.hero_img,
      isPremium: data.is_premium,
      preparingTime: data.preparing_time,
      recipeSteps: premiumData.recipe_steps,
      videoUrl: premiumData.video_url,
    };
  }
}