import { supabase } from "@/lib/supabase/ClientComponentClient";
import { IRecipe, IRecipePublic, IRecipePremiumFull } from "@/types/recipe";

export const fetchFeaturedRecipes = async (): Promise<IRecipe[]> => {
  const { data, error } = await supabase
    .from("recipes")
    .select('*')
    .order("likes", { ascending: false })
    .limit(3);

  if (error) throw error;

  return (data || []).map((item): IRecipe => {
    if (!item.is_premium) {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        likes: item.likes,
        category: item.category,
        ingredients: item.ingredients,
        heroImg: item.hero_img,
        isPremium: false as const,
        preparingTime: item.preparing_time,
        recipeSteps: item.recipe_steps,
        videoUrl: item.video_url,
        stepsCount: item.steps_count,
      } satisfies IRecipePublic;
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      likes: item.likes,
      category: item.category,
      ingredients: item.ingredients,
      heroImg: item.hero_img,
      isPremium: true as const,
      preparingTime: item.preparing_time,
      recipeSteps: item.recipe_steps,
      videoUrl: item.video_url,
      stepsCount: item.steps_count,
    } satisfies IRecipePremiumFull;
  });
};
