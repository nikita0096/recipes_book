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
    <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
      <div className='flex flex-col items-center'>
        <AdminRecipesItems allRecipes={allRecipes}/>
        <button
          className='mt-8 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={isFetching || !hasNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load more' : 'Nothing more to load'}
        </button>
      </div>
    </div>
  );
};

export default Page;