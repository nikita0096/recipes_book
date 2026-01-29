'use client';

import AdminRecipesItems from "@/app/admin/recipes/AdminRecipesItems";
import LoadingPage from "@/components/ui/LoadingPage";
import {useRecipes} from "@/hooks/useRecipes";
import React, {useMemo} from "react";
import {IRecipe} from "@/app/recipes/page";

const Page = () => {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useRecipes();

  const allRecipes: IRecipe[] = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  if (error) return (
    <div>
      Error
    </div>
  );

  if (isFetching) {
    return <LoadingPage/>;
  }

  return (
    <div className='flex flex-col items-center my-10'>
      <AdminRecipesItems allRecipes={allRecipes}/>
      <button className='bg-blue-400 rounded-xl px-4 py-2 min-w-30 cursor-pointer mt-5'
              disabled={isFetching || !hasNextPage}
              onClick={() => fetchNextPage()}>{isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : 'Nothing more to load'}</button>
    </div>
  );
};

export default Page;