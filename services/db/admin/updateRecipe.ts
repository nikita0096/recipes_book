import {supabase} from "@/lib/supabase/ClientComponentClient";
import {
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
  IRecipePublic,
  IRecipePremiumFull, RecipePrice,
} from "@/types/recipe";
import {v4 as uuidv4} from 'uuid';


// ===== PUBLIC → PUBLIC =====
// Update public рецепта (все в main table)
export const updateRecipePublic = async (
  formData: UpdateRecipeDataPublic,
  id: string
): Promise<{ data: IRecipePublic | null; error: string | null }> => {
  const {data, error} = await supabase
    .from("recipes")
    .update({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      likes: formData.likes,
      recipe_steps: formData.recipeSteps,
      ingredients: formData.ingredients,
      hero_img: formData.heroImg,
      video_url: formData.videoUrl,
      preparing_time: formData.preparingTime,
      is_premium: false,
      steps_count: formData.recipeSteps.length,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  if (!data) {
    return {data: null, error: 'Recipe not found'};
  }

  return {
    data: {
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
      stepsCount: data.steps_count,
    },
    error: null,
  };
};

// ===== PREMIUM → PREMIUM =====
// Update premium рецепта (main table + premium table)
export const updateRecipePremium = async (
  mainData: UpdateRecipeDataPremiumMain,
  premiumData: UpdateRecipeDataPremiumPart,
  id: string
): Promise<{ data: { newRecipe: IRecipePremiumFull, newPrice: RecipePrice } | null; error: string | null }> => {
  // Update main table
  const {data, error} = await supabase
    .from("recipes")
    .update({
      title: mainData.title,
      description: mainData.description,
      category: mainData.category,
      likes: mainData.likes,
      ingredients: mainData.ingredients,
      hero_img: mainData.heroImg,
      preparing_time: mainData.preparingTime,
      is_premium: true,
      recipe_steps: null,
      video_url: null,
      steps_count: premiumData.recipeSteps.length,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  if (!data) {
    return {data: null, error: 'Recipe not found'};
  }

  // Update premium table
  const {error: premiumError} = await supabase
    .from("recipes_premium")
    .update({
      recipe_steps: premiumData.recipeSteps,
      video_url: premiumData.videoUrl,
    })
    .eq('recipe_id', id);

  if (premiumError) {
    return {data: null, error: premiumError.message};
  }

  await supabase
    .from("recipes_price")
    .update({
      price: premiumData.price,
      discount: premiumData.discount
    }).eq('recipe_id', id);

  return {
    data: {
      newRecipe: {
        id: data.id,
        title: data.title,
        description: data.description,
        likes: data.likes,
        category: data.category,
        ingredients: data.ingredients,
        heroImg: data.hero_img,
        isPremium: true as const,
        preparingTime: data.preparing_time,
        recipeSteps: premiumData.recipeSteps,
        videoUrl: premiumData.videoUrl,
        stepsCount: data.steps_count,
      },
      newPrice: {
        price: premiumData.price,
        discount: premiumData.discount
      }
    },
    error: null,
  };
};

// ===== PUBLIC → PREMIUM =====
// Конвертация public в premium (update main + INSERT в premium table)
export const convertPublicToPremium = async (
  mainData: UpdateRecipeDataPremiumMain,
  premiumData: UpdateRecipeDataPremiumPart,
  id: string
): Promise<{ data: { newRecipe: IRecipePremiumFull, newPrice: RecipePrice } | null; error: string | null }> => {
  const premiumId = uuidv4();
  // Update main table - убираем steps/video, ставим is_premium = true
  const {data, error} = await supabase
    .from("recipes")
    .update({
      title: mainData.title,
      description: mainData.description,
      category: mainData.category,
      likes: mainData.likes,
      ingredients: mainData.ingredients,
      hero_img: mainData.heroImg,
      preparing_time: mainData.preparingTime,
      is_premium: true,
      recipe_steps: null,
      video_url: null,
      premium_recipe: premiumId,
      steps_count: premiumData.recipeSteps.length,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  if (!data) {
    return {data: null, error: 'Recipe not found'};
  }

  // INSERT в premium table (записи ещё нет)
  const {error: premiumError} = await supabase
    .from("recipes_premium")
    .insert({
      id: premiumId,
      recipe_id: id,
      recipe_steps: premiumData.recipeSteps,
      video_url: premiumData.videoUrl,
    });

  if (premiumError) {
    return {data: null, error: premiumError.message};
  }

  await supabase
    .from("recipes_price")
    .insert({
      price: premiumData.price,
      discount: premiumData.discount,
      recipe_id: id
    });

  return {
    data: {
      newRecipe: {
        id: data.id,
        title: data.title,
        description: data.description,
        likes: data.likes,
        category: data.category,
        ingredients: data.ingredients,
        heroImg: data.hero_img,
        isPremium: true as const,
        preparingTime: data.preparing_time,
        recipeSteps: premiumData.recipeSteps,
        videoUrl: premiumData.videoUrl,
        stepsCount: data.steps_count,
      },
      newPrice: {
        price: premiumData.price,
        discount: premiumData.discount
      }
    },
    error: null,
  };
};

// ===== PREMIUM → PUBLIC =====
// Конвертация premium в public (update main с данными + DELETE из premium table)
export const convertPremiumToPublic = async (
  formData: UpdateRecipeDataPublic,
  id: string
): Promise<{ data: { newRecipe: IRecipePublic, newPrice: RecipePrice } | null; error: string | null }> => {
  // Update main table - добавляем steps/video, ставим is_premium = false, обнуляем premium_recipe
  const {data, error} = await supabase
    .from("recipes")
    .update({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      likes: formData.likes,
      recipe_steps: formData.recipeSteps,
      ingredients: formData.ingredients,
      hero_img: formData.heroImg,
      video_url: formData.videoUrl,
      preparing_time: formData.preparingTime,
      is_premium: false,
      premium_recipe: null,
      steps_count: formData.recipeSteps.length,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {data: null, error: error.message};
  }

  if (!data) {
    return {data: null, error: 'Recipe not found'};
  }

  // DELETE из premium table
  const {error: deleteError} = await supabase
    .from("recipes_premium")
    .delete()
    .eq('recipe_id', id);

  if (deleteError) {
    // Не критично если записи не было
    console.warn('Failed to delete premium record:', deleteError.message);
  }

  await supabase
    .from("recipes_price")
    .delete()
    .eq('recipe_id', id);

  return {
    data: {
      newRecipe: {
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
        stepsCount: data.steps_count,
      },
      newPrice: {
        price: { en: 0, ua: 0 },
        discount: 0
      }
    },
    error: null,
  };
};
