'use client'

import React, {useMemo, useState} from 'react';
import RecipesList from "@/components/recipes/RecipesList";
import {useRecipes} from "@/hooks/useRecipes";
import LoadingPage from "@/components/ui/LoadingPage";
import {useTranslations} from "next-intl";
import {useTypedLocale} from "@/hooks/useTypedLocale";

const Recipes = () => {

  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('All recipes');

  const locale = useTypedLocale();

  const tRecipes = useTranslations('recipes');
  const tCommon = useTranslations('common');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    status,
  } = useRecipes();

  const allRecipes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]);

  const filteredRecipes = useMemo(() => {
    let recipes = allRecipes;

    if (searchValue !== '') {
      const search = searchValue.toLowerCase().trim();
      recipes = recipes?.filter((recipe) => recipe.title[locale].toLowerCase().includes(search));
    }

    return recipes;
  }, [allRecipes, searchValue, selectValue, locale]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
          {tRecipes('page.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {tRecipes('page.subtitle')}
        </p>
      </div>

      {/* Search & Filter */}
      <form className="max-w-2xl mx-auto mb-10">
        <div className="flex flex-col sm:flex-row gap-3">

          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              id="search-dropdown"
              className="w-full bg-white dark:bg-gray-800 border-2 border-amber-200 dark:border-gray-600 rounded-xl pl-12 pr-4 py-3 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
              value={searchValue}
              placeholder={tRecipes('search.placeholder')}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
      </form>

      {status === 'pending' ? (
        <LoadingPage/>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-xl text-gray-900 dark:text-white font-semibold mb-2">{tCommon('errors.somethingWentWrong')}</p>
          <p className="text-gray-500 dark:text-gray-400">{tCommon('errors.tryAgainLater')}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <RecipesList filteredRecipes={filteredRecipes}/>

          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetching}
            className={`mt-10 mb-6 inline-flex items-center gap-2 px-8 py-3 rounded-full font-medium transition-all duration-300 shadow-lg ${
              hasNextPage
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-xl hover:scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {isFetching ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {tRecipes('pagination.loading')}
              </>
            ) : hasNextPage ? (
              <>
                {tRecipes('pagination.loadMore')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              tRecipes('pagination.allLoaded')
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Recipes;