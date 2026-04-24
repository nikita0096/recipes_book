'use client';

import {AdminRecipesItems} from "@/components/admin";
import LoadingPage from "@/components/ui/LoadingPage";
import {useRecipes} from "@/hooks/useRecipes";
import React, {useMemo} from "react";
import {IRecipe} from "@/types/recipe";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";

const Page = () => {
  const t = useTranslations('admin');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage
  } = useRecipes();

  const allRecipes: IRecipe[] = useMemo(() => data?.pages.flatMap((page) => page.data) ?? [], [data]);

  if (error) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-base text-red-500 mb-4">{t('list.error')}</p>
        <Link href="/admin" className="text-sm text-muted hover:text-text">
          ← Back to Admin
        </Link>
      </div>
    </div>
  );

  if (isFetching) {
    return <LoadingPage/>;
  }

  return (
    <div className='min-h-screen bg-bg'>
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl italic font-normal text-text mb-1">
              {t('form.title')}
            </h1>
            <p className="text-sm text-muted">{allRecipes.length} recipes</p>
          </div>
          <Link
            href="/admin"
            className="text-sm border border-border text-text px-4 py-2 hover:bg-surface transition-colors"
          >
            + {t('form.buttons.create')}
          </Link>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8'>
        <AdminRecipesItems allRecipes={allRecipes}/>

        {/* Load More Button */}
        <div className="flex justify-center mt-10">
          <button
            className='px-6 py-3 border border-border text-text text-sm tracking-wide hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isFetching || !hasNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? t('list.loading') : hasNextPage ? t('list.loadMore') : t('list.allLoaded')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;