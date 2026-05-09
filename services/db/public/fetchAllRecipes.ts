import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipePublic, IRecipePremiumIncomplete, RecipeStep} from "@/types/recipe";
import {Ingredient, LocalizedText} from "@/types/forms";

// Database row type
interface RecipeRow {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  likes: number;
  category: LocalizedText;
  ingredients: Ingredient[];
  hero_img: string;
  is_premium: boolean;
  preparing_time: number;
  recipe_steps: RecipeStep[] | null;
  video_url: string | null;
  steps_count: number;
  created_at: string;
}

// Возвращает рецепты из main table
// Для premium рецептов recipeSteps и videoUrl могут быть null
export type RecipeListItem = IRecipePublic | IRecipePremiumIncomplete;

export const fetchAllRecipes = async (): Promise<RecipeListItem[]> => {
  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .order("created_at", {ascending: false});

  if (error) throw error;

  return (data as RecipeRow[]).map((item): RecipeListItem => {
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
        recipeSteps: item.recipe_steps!,
        videoUrl: item.video_url!,
        stepsCount: item.steps_count,
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
      stepsCount: item.steps_count,
    };
  });
}