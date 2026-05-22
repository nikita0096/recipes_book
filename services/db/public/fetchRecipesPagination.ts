import {supabase} from "@/lib/supabase/ClientComponentClient";
import {toCamelCase} from "@/utils/parseCamelcase";
import {IRecipe} from "@/types";
import {batchGetPublicUrls} from "@/services/storage/getPublicImageUrl";

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

  const heroPaths = data.map((r) => r.hero_img).filter(Boolean);
  const urlMap = batchGetPublicUrls(heroPaths, 'hero-images');

  const parsedData = data.map((recipe) => {
    const camelCased = toCamelCase<IRecipe>(recipe);
    return {
      ...camelCased,
      heroImg: urlMap[recipe.hero_img] || '',
    };
  });

  return {
    data: parsedData as IRecipe[],
    nextCursor: data.length === 9 ? pageParam + 1 : undefined,
  };
}