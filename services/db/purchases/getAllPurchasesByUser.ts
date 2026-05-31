import {supabase} from "@/lib/supabase/ClientComponentClient";

export const getAllPurchasesByUser = async (userId: string) => {
  if (!userId) return;
  const { data } = await supabase
    .from('purchases')
    .select('recipe_id')
    .eq('user_id', userId);

  if(data) return data;

  return [];
}