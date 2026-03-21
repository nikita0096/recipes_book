import { supabase } from "@/lib/supabase/ClientComponentClient";
import { IRecipe } from "@/types/recipe";

export const fetchFeaturedRecipes = async (): Promise<IRecipe[]> => {
  const { data, error } = await supabase
    .from("recipes")
    .select('*')
    .order("likes", { ascending: false })
    .limit(3);

  if (error) throw error;

  return data || [];
};
