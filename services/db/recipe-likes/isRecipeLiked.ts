import {supabase} from "@/lib/supabase/ClientComponentClient";

export const isRecipeLiked = async (recipeId: string, userId: string) => {
  const {data, error } = await supabase
    .from('recipe_likes')
    .select('id')
    .eq('recipe_id',  recipeId)
    .eq('user_id', userId)
    .single();

    if(error) return false;

    const isLiked = !!data;
    return isLiked;
}