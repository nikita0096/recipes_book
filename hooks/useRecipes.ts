import {fetchRecipesPagination} from "@/services/db/public/fetchRecipesPagination";
import {useInfiniteQuery} from "@tanstack/react-query";
import {keepPreviousData} from "@tanstack/query-core";

export const useRecipes = () => {
  return useInfiniteQuery({
    queryKey: ['recipes'],
    queryFn: ({pageParam}) => fetchRecipesPagination(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
  });
}