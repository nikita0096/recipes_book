import {supabase} from "@/lib/supabase/ClientComponentClient";

export const fetchAllRecipes = async () => {
  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .order("created_at", {ascending: false});

  if (error) throw error;

  return data;
}