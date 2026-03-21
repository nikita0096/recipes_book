import { useQuery } from "@tanstack/react-query";
import { fetchFeaturedRecipes } from "@/services/db/fetchFeaturedRecipes";

export const useFeaturedRecipes = () => {
  return useQuery({
    queryKey: ['featuredRecipes'],
    queryFn: fetchFeaturedRecipes,
    staleTime: 1000 * 60 * 5,
  });
};
