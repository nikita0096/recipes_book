import {supabase} from "@/lib/supabase/ClientComponentClient";

export const fetchRecipesPagination = async (pageParam: number) => {

  const start = pageParam * 9;
  const end = start + 8;

  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .order("created_at", {ascending: false})
    .range(start, end);

  if (error) throw error;

  return {
    data,
    nextCursor: data.length === 9 ? pageParam + 1 : undefined,
  };
}