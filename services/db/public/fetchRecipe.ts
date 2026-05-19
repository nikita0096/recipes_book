import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe, IRecipePublic, IRecipePremiumFull, RecipeStep, RecipePrice} from "@/types/recipe";
import {Ingredient, LocalizedText} from "@/types";
import {getSignedImageUrl, batchGetSignedUrls} from "@/services/storage/getSignedImageUrl";

interface FetchRecipe {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  likes: number;
  category: LocalizedText;
  ingredients: Ingredient[];
  hero_img: string;
  is_premium: boolean;
  preparing_time: number;
  recipe_steps: RecipeStep[];
  video_url: string;
  steps_count: number;
}

export const fetchRecipe = async (id: string): Promise<{ data: IRecipe | null, price: RecipePrice | null, error: Error | null }> => {
  const {data, error} = await supabase.from('recipes')
    .select()
    .eq('id', id)
    .single();

  if (error) return {data: null, price: null, error};

  const {data: {user}} = await supabase.auth.getUser();

  const {data: recipePrice} = await supabase
    .from('recipes_price')
    .select('price, discount')
    .eq('recipe_id', id)
    .single();

  if (!user?.id || !data.is_premium) {
    return {
      data: await mapToPublic(data),
      price: {
        price: recipePrice?.price,
        discount: recipePrice?.discount
      },
      error: null
    }
  }

  const [{data: role}, {data: purchasedRecipeId}] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single<Record<string, 'admin' | 'user'>>(),
    supabase
      .from('purchases')
      .select('premium_recipe_id')
      .eq('user_id', user.id)
      .eq('recipe_id', id)
      .maybeSingle()
  ]);

  const isAdmin = role?.role === 'admin';
  const premiumId = purchasedRecipeId?.premium_recipe_id;

  const hasAccess = isAdmin || premiumId;

  if (!hasAccess) {
    return {
      data: await mapToPublic(data),
      price: {
        price: recipePrice?.price,
        discount: recipePrice?.discount
      },
      error: null
    };
  }

  const {data: premiumData, error: premiumError} = await supabase
    .from('recipes_premium')
    .select('*')
    .eq('recipe_id', id)
    .single();

  if (premiumError) throw premiumError;

  const heroImg = await getSignedImageUrl(data.hero_img, 'hero-images') || '';

  const stepPaths = (premiumData.recipe_steps as RecipeStep[] | null)
    ?.map((step) => step.imgUrl)
    .filter((url): url is string => Boolean(url)) || [];

  const stepUrlMap = await batchGetSignedUrls(stepPaths, 'steps');

  const recipeSteps = (premiumData.recipe_steps as RecipeStep[] | null)?.map((step) => ({
    ...step,
    imgUrl: step.imgUrl ? (stepUrlMap[step.imgUrl] || step.imgUrl) : null,
  })) || [];

  return {
    data: {
      id: data.id,
      title: data.title,
      description: data.description,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg,
      isPremium: true as const,
      preparingTime: data.preparing_time,
      recipeSteps,
      videoUrl: premiumData.video_url,
      stepsCount: data.steps_count,
    } satisfies IRecipePremiumFull,
    price: null,
    error: null
  }
}

const mapToPublic = async (data: FetchRecipe): Promise<IRecipePublic> => {
  const heroImg = await getSignedImageUrl(data.hero_img, 'hero-images') || '';

  const stepPaths = data.recipe_steps
    ?.map(step => step.imgUrl)
    .filter((url): url is string => Boolean(url)) || [];

  const stepUrlMap = await batchGetSignedUrls(stepPaths, 'steps');

  const recipeSteps = data.recipe_steps?.map(step => ({
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
    recipeSteps,
    videoUrl: data.video_url,
    stepsCount: data.steps_count,
  };
}
