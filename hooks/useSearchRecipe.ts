import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {IRecipe} from "@/types";
import {toCamelCase} from "@/utils/parseCamelcase";
import {batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";

const fetchSearchRecipes = async (query: string, locale: string): Promise<IRecipe[]> => {
  if (!query) return [];

  const {data, error} = await supabase
    .from('recipes')
    .select('*')
    .ilike(`title->>${locale}`, `%${query}%`);

  if (error) throw error;

  const heroPaths = data.map(r => r.hero_img).filter(Boolean);
  const urlsMap = batchGetPublicUrls(heroPaths, 'hero-images');

  return data.map(recipe => {
    const parsedRecipe = toCamelCase<IRecipe>(recipe);

    return {
      ...parsedRecipe,
      heroImg: urlsMap[recipe.hero_img],
    }
  });
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