import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe} from "@/types/recipe";

export const fetchRecipe = async (id: string): Promise<IRecipe> => {
  const {data, error} = await supabase.from('recipes')
    .select()
    .eq('id', Number(id))
    .single();

  if (error) throw error;

  return data;
}