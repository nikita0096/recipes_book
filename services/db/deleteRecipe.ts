import {supabase} from "@/lib/supabase/ClientComponentClient";

export const deleteRecipe = async (id: string) => {
  let { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;

   ({ error } = await supabase
    .from('recipes_premium')
    .delete()
    .eq('recipe_id', id));

  if (error) throw error;
}