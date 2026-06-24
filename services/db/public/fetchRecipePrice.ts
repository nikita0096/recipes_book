import {supabase} from "@/lib/supabase/ClientComponentClient";
import {RecipePrice} from "@/types/recipe";

export type {RecipePrice};

export const fetchRecipePrice = async (id: string): Promise<RecipePrice> => {
  const {data, error} = await supabase
    .from('recipes_price')
    .select('price, discount')
    .eq('recipe_id', id)
    .maybeSingle<RecipePrice>();

  if (error) throw error;

  if(data) return data;

  return {
    price: {
      en: 0,
      uk: 0
    },
    discount: 0,
  }
}