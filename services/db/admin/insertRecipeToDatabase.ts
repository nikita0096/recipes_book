import {createClient} from "@/lib/supabase/ServerComponentClient";
import {
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
} from "@/types/recipe";

// Insert public recipe. Server-only: uses a request-scoped Supabase client so
// RLS still enforces admin-only access.
export const insertRecipePublic = async (recipeData: IRecipeUploadPublic) => {
  const supabase = await createClient();
  const {error} = await supabase
    .from('recipes')
    .insert({
      id: recipeData.id,
      title: recipeData.title,
      description: recipeData.description,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImg,
      is_premium: false,
      preparing_time: recipeData.preparingTime,
      weight: recipeData.weight,
      diameter: recipeData.diameter,
      calories: recipeData.calories,
      video_url: recipeData.videoUrl,
      recipe_steps: recipeData.recipeSteps,
      steps_count: recipeData.recipeSteps.length,
      slug: recipeData.slug
    });

  if (error) {
    throw error;
  }
};

// Insert premium recipe (main table part only).
export const insertRecipePremiumMain = async (recipeData: IRecipeUploadPremiumMain, stepsCount: number) => {
  const supabase = await createClient();
  const {error} = await supabase
    .from('recipes')
    .insert({
      id: recipeData.id,
      title: recipeData.title,
      description: recipeData.description,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImg,
      is_premium: true,
      preparing_time: recipeData.preparingTime,
      weight: recipeData.weight,
      diameter: recipeData.diameter,
      calories: recipeData.calories,
      video_url: null,
      recipe_steps: null,
      premium_recipe: recipeData.premiumId,
      steps_count: stepsCount,
      slug: recipeData.slug
    });

  if (error) {
    throw error;
  }

};