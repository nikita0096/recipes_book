import {supabase} from "@/lib/supabase/ClientComponentClient";

export const deleteRecipe = async (id: string) => {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}