import {fetchRecipes} from "@/services/db/fetchRecipes";
import {useInfiniteQuery} from "@tanstack/react-query";

export const useRecipes = () => {
  return useInfiniteQuery({
    queryKey: ['recipes'],
    queryFn: ({pageParam}) => fetchRecipes(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  });
}