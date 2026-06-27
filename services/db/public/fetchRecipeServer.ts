import type {SupabaseClient} from "@supabase/supabase-js";
import {IRecipe, IRecipePublic, IRecipePremiumFull, RecipeStep, RecipePrice} from "@/types/recipe";
import {IngredientGroup, LocalizedText} from "@/types";
import {getPublicImageUrl, batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";

interface FetchRecipe {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  likes: number;
  category: LocalizedText;
  ingredients: IngredientGroup[];
  hero_img: string;
  is_premium: boolean;
  preparing_time: number;
  weight: number | null;
  diameter: number | null;
  calories: number | null;
  recipe_steps: RecipeStep[];
  video_url: string;
  steps_count: number;
  slug: string;
  is_published: boolean;
}

/**
 * Server-side counterpart of `fetchRecipe`. It mirrors the same access logic but
 * runs against the SSR Supabase client so the recipe (and its image URLs) can be
 * resolved on the server and streamed as initial props — letting Next.js optimize
 * the hero and step images instead of waiting on a client fetch waterfall.
 */
export const fetchRecipeServer = async (
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: IRecipe | null, totalPrice: RecipePrice | null, error: Error | null }> => {
  const {data, error} = await supabase.from('recipes')
    .select()
    .eq('id', id)
    .single();

  if (error) return {data: null, totalPrice: null, error};

  const {data: {user}} = await supabase.auth.getUser();

  const recipePrice = await fetchRecipePriceServer(supabase, id);

  if (!user?.id || !data.is_premium) {
    return {
      data: mapToPublic(data),
      totalPrice: {
        price: {
          ...recipePrice.price
        },
        discount: recipePrice.discount
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
          ...recipePrice.price
        },
        discount: recipePrice.discount
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
      weight: data.weight,
      diameter: data.diameter,
      calories: data.calories,
      recipeSteps,
      videoUrl: premiumData.video_url,
      stepsCount: data.steps_count,
      slug: data.slug,
      isPublished: data.is_published,
    } satisfies IRecipePremiumFull,
    totalPrice: null,
    error: null
  }
}

const fetchRecipePriceServer = async (supabase: SupabaseClient, id: string): Promise<RecipePrice> => {
  const {data, error} = await supabase
    .from('recipes_price')
    .select('price, discount')
    .eq('recipe_id', id)
    .maybeSingle<RecipePrice>();

  if (error) throw error;

  if (data) return data;

  return {
    price: {
      en: 0,
      uk: 0
    },
    discount: 0,
  };
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
    weight: data.weight,
    diameter: data.diameter,
    calories: data.calories,
    recipeSteps,
    videoUrl: data.video_url,
    stepsCount: data.steps_count,
    slug: data.slug,
    isPublished: data.is_published,
  };
}
