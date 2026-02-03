import {supabase} from "@/lib/supabase/ClientComponentClient";

export const fetchRecipesPagination = async (pageParam: number) => {

  const start = pageParam * 9;
  const end = start + 8;

  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .range(start, end);

  if (error) throw error;

  return {
    data,
    nextCursor: data.length === 9 ? pageParam + 1 : undefined,
  };
}