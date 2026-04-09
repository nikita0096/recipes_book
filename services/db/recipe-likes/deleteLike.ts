import {supabase} from "@/lib/supabase/ClientComponentClient";

export const deleteLike = async (recipeId: string, userId: string) => {
  await supabase
    .from('recipe_likes')
    .delete()
    .eq('recipe_id',  recipeId)
    .eq('user_id', userId);
}