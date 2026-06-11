import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipePublic, IRecipePremiumIncomplete, RecipeStep} from "@/types/recipe";
import {Ingredient, LocalizedText} from "@/types/forms";
import {batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";

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
  weight: number | null;
  diameter: number | null;
  calories: number | null;
  recipe_steps: RecipeStep[] | null;
  video_url: string | null;
  steps_count: number;
  created_at: string;
  slug: string;
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

  const recipes = data as RecipeRow[];
  const heroPaths = recipes.map(r => r.hero_img).filter(Boolean);
  const urlMap = batchGetPublicUrls(heroPaths, 'hero-images');

  return recipes.map((item): RecipeListItem => {
    const heroImg = urlMap[item.hero_img] || '';

    if (!item.is_premium) {
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        likes: item.likes,
        category: item.category,
        ingredients: item.ingredients,
        heroImg,
        isPremium: false as const,
        preparingTime: item.preparing_time,
        weight: item.weight,
        diameter: item.diameter,
        calories: item.calories,
        recipeSteps: item.recipe_steps!,
        videoUrl: item.video_url!,
        stepsCount: item.steps_count,
        slug: item.slug,
      };
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      likes: item.likes,
      category: item.category,
      ingredients: item.ingredients,
      heroImg,
      isPremium: true as const,
      preparingTime: item.preparing_time,
      weight: item.weight,
      diameter: item.diameter,
      calories: item.calories,
      recipeSteps: item.recipe_steps ?? null,
      videoUrl: item.video_url ?? null,
      stepsCount: item.steps_count,
      slug: item.slug,
    };
  });
}