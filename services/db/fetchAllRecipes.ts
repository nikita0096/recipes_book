import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipePublic, IRecipePremiumIncomplete} from "@/types/recipe";

// Возвращает рецепты из main table
// Для premium рецептов recipeSteps и videoUrl могут быть null
export type RecipeListItem = IRecipePublic | IRecipePremiumIncomplete;

export const fetchAllRecipes = async (): Promise<RecipeListItem[]> => {
  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .order("created_at", {ascending: false});

  if (error) throw error;

  return data.map((item): RecipeListItem => {
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
      };
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
      recipeSteps: item.recipe_steps ?? null,
      videoUrl: item.video_url ?? null,
    };
  });
}