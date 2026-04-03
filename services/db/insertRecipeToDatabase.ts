import {supabase} from "@/lib/supabase/ClientComponentClient";
import {
  IRecipeUpload,
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
} from "@/types/recipe";

// Type guard
const isPublicUpload = (data: IRecipeUpload): data is IRecipeUploadPublic => {
  return data.isPremium === false;
};

// Insert public рецепта
export const insertRecipePublic = async (recipeData: IRecipeUploadPublic) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      id: recipeData.id,
      title: recipeData.title,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImg,
      is_premium: false,
      preparing_time: recipeData.preparingTime,
      video_url: recipeData.videoUrl,
      recipe_steps: recipeData.recipeSteps,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Insert premium рецепта (только main table часть)
export const insertRecipePremiumMain = async (recipeData: IRecipeUploadPremiumMain) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      id: recipeData.id,
      title: recipeData.title,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImg,
      is_premium: true,
      preparing_time: recipeData.preparingTime,
      video_url: null,
      recipe_steps: null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Универсальная функция (для обратной совместимости)
export const insertRecipe = async (recipeData: IRecipeUpload) => {
  if (isPublicUpload(recipeData)) {
    return insertRecipePublic(recipeData);
  }
  return insertRecipePremiumMain(recipeData);
};