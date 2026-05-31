import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe, IRecipePublic, IRecipePremiumFull, RecipeStep, RecipePrice} from "@/types/recipe";
import {Ingredient, LocalizedText} from "@/types";
import {getPublicImageUrl, batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";
import {fetchRecipePrice} from "@/services/db/public/fetchRecipePrice";

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
  slug: string;
}

export const fetchRecipe = async (id: string): Promise<{ data: IRecipe | null, totalPrice: RecipePrice | null, error: Error | null }> => {
  const {data, error} = await supabase.from('recipes')
    .select()
    .eq('id', id)
    .single();

  if (error) return {data: null, totalPrice: null, error};

  const {data: {user}} = await supabase.auth.getUser();

  const recipePrice = await fetchRecipePrice(id);

  if (!user?.id || !data.is_premium) {
    return {
      data: mapToPublic(data),
      totalPrice: {
        price: {
          ...recipePrice?.price
        },
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
      data: mapToPublic(data),
      totalPrice: {
        price: {
          ...recipePrice?.price
        },
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

  const heroImg = getPublicImageUrl(data.hero_img, 'hero-images') || '';

  const stepPaths = (premiumData.recipe_steps as RecipeStep[] | null)
    ?.map((step) => step.imgUrl)
    .filter((url): url is string => Boolean(url)) || [];

  const stepUrlMap = batchGetPublicUrls(stepPaths, 'steps');

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
      slug: data.slug,
    } satisfies IRecipePremiumFull,
    totalPrice: null,
    error: null
  }
}

const mapToPublic = (data: FetchRecipe): IRecipePublic => {
  const heroImg = getPublicImageUrl(data.hero_img, 'hero-images') || '';

  const stepPaths = data.recipe_steps
    ?.map(step => step.imgUrl)
    .filter((url): url is string => Boolean(url)) || [];

  const stepUrlMap = batchGetPublicUrls(stepPaths, 'steps');

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
    slug: data.slug,
  };
}
