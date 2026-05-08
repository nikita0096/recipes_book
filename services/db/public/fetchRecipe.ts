import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe, IRecipePublic, IRecipePremiumFull, RecipeStep, RecipePrice} from "@/types/recipe";
import {Ingredient, LocalizedText} from "@/types";

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
      data: mapToPublic(data),
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
      data: mapToPublic(data),
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

  return {
    data: {
      id: data.id,
      title: data.title,
      description: data.description,
      likes: data.likes,
      category: data.category,
      ingredients: data.ingredients,
      heroImg: data.hero_img,
      isPremium: true as const,
      preparingTime: data.preparing_time,
      recipeSteps: premiumData.recipe_steps,
      videoUrl: premiumData.video_url,
    } satisfies IRecipePremiumFull,
    price: null,
    error: null
  }
}

const mapToPublic = (data: FetchRecipe): IRecipePublic => ({
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
})