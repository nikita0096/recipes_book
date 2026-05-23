import {supabase} from "@/lib/supabase/ClientComponentClient";

export interface RecipePrice {
  price: {
    en: number;
    ua: number;
  };
  discount: number | null;
}

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
      ua: 0
    },
    discount: 0,
  }
}