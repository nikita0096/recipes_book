import {supabase} from "@/lib/supabase/ClientComponentClient";

export const fetchRecipes = async (pageParam: number) => {

  const start = pageParam * 10;
  const end = start + 9;

  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .range(start, end);

  if (error) throw error;

  return {
    data,
    nextCursor: data.length === 10 ? pageParam + 1 : undefined,
  };
}