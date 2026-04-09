import {supabase} from "@/lib/supabase/ClientComponentClient";

export const getAllLikedRecipesByUser = async (recipeId: string, userId: string) => {
  const { data } = await supabase
    .from('recipe_likes')
    .select('recipe_id, recipes(*)')
    .eq('user_id', userId);

  return data;
}