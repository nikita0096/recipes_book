import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe, IRecipePublic, IRecipePremiumFull, RecipeStep} from "@/types/recipe";
import {getPublicImageUrl, batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";

export const fetchRecipeAdmin = async (id: string): Promise<IRecipe> => {
  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Public recipe - all data in main table
  if (!data.is_premium) {
    const heroImg = getPublicImageUrl(data.hero_img, 'hero-images') || '';

    const stepPaths = (data.recipe_steps as RecipeStep[] | null)
      ?.map(step => step.imgUrl)
      .filter((url): url is string => Boolean(url)) || [];

    const stepUrlMap = batchGetPublicUrls(stepPaths, 'steps');

    const recipeSteps = (data.recipe_steps as RecipeStep[] | null)?.map(step => ({
      ...step,
      imgUrl: step.imgUrl ? (stepUrlMap[step.imgUrl] || step.imgUrl) : null,
    })) || [];

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg,
      isPremium: false as const,
      preparingTime: data.preparing_time,
      weight: data.weight,
      diameter: data.diameter,
      calories: data.calories,
      recipeSteps,
      videoUrl: data.video_url,
      stepsCount: data.steps_count,
      slug: data.slug,
      isPublished: data.is_published,
    } satisfies IRecipePublic;
  }

  // Premium recipe - fetch from premium table
  const {data: premiumData, error: premiumError} = await supabase
    .from('recipes_premium')
    .select('*')
    .eq('recipe_id', id)
    .single();

  if (premiumError) {
    throw premiumError;
  }

  const heroImg = getPublicImageUrl(data.hero_img, 'hero-images') || '';

  const stepPaths = (premiumData.recipe_steps as RecipeStep[] | null)
    ?.map(step => step.imgUrl)
    .filter((url): url is string => Boolean(url)) || [];

  const stepUrlMap = batchGetPublicUrls(stepPaths, 'steps');

  const recipeSteps = (premiumData.recipe_steps as RecipeStep[] | null)?.map(step => ({
    ...step,
    imgUrl: step.imgUrl ? (stepUrlMap[step.imgUrl] || step.imgUrl) : null,
  })) || [];

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    likes: data.likes,
    category: data.category,
    ingredients: data.ingredients,
    heroImg,
    isPremium: true as const,
    preparingTime: data.preparing_time,
    weight: data.weight,
    diameter: data.diameter,
    calories: data.calories,
    recipeSteps,
    videoUrl: premiumData.video_url,
    stepsCount: data.steps_count,
    slug: data.slug,
    isPublished: data.is_published,
  } satisfies IRecipePremiumFull;
}