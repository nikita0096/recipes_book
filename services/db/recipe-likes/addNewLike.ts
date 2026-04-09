import {supabase} from "@/lib/supabase/ClientComponentClient";

export const addNewLike = async (recipeId: string, userId: string) => {
  await supabase
    .from('recipe_likes')
    .insert({
      user_id : userId,
      recipe_id : recipeId,
    })
}