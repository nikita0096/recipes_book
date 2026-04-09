import {supabase} from "@/lib/supabase/ClientComponentClient";

export const deleteLike = async (recipeId: string, userId: string) => {
  const {data} = await supabase
    .from('recipe_likes')
    .select()
    .eq('recipe_id',  recipeId)

  return data;
}