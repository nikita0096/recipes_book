import {supabase} from "@/lib/supabase/ClientComponentClient";
import {toCamelCase} from "@/utils/parseCamelcase";
import {IRecipe} from "@/types";

export const fetchRecipesPagination = async (pageParam: number) => {

  const start = pageParam * 9;
  const end = start + 8;

  const {data, error} = await supabase
    .from("recipes")
    .select('*')
    .order("created_at", {ascending: false})
    .order("id", {ascending: false}) // Secondary sort for stable pagination
    .range(start, end);

  if (error) throw error;

  const parsedData = data.map((recipe) => toCamelCase(recipe));

  return {
    data: parsedData as IRecipe[],
    nextCursor: data.length === 9 ? pageParam + 1 : undefined,
  };
}