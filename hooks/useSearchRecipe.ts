import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe} from "@/types";
import {toCamelCase} from "@/utils/parseCamelcase";

const fetchSearchRecipes = async (query: string, locale: string): Promise<IRecipe[]> => {
  if (!query) return [];

  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .ilike(`title->>${locale}`, `%${query}%`);

  if (error) throw error;

  return data.map(recipe => toCamelCase(recipe));
};

export function useSearchRecipe(query: string, locale: string) {
  const {data, isLoading, isFetching} = useQuery({
    queryKey: ['recipes', 'search', query, locale],
    queryFn: () => fetchSearchRecipes(query, locale),
    enabled: !!query,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    data: data ?? [],
    loading: isLoading || isFetching,
  };
}