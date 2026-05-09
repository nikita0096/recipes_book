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
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <div className="text-center pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 px-4 sm:px-6 lg:px-10">
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl italic font-normal text-text mb-3">
          {tRecipes('page.title')}
        </h1>
        <p className="text-sm sm:text-base text-muted tracking-wide uppercase">
          {tRecipes('page.subtitle')}
        </p>
      </div>

      {/* Search */}
      <div className="flex justify-center px-4 sm:px-6 lg:px-10 pb-8 sm:pb-10 lg:pb-12">
        <div className="w-full max-w-xl flex items-center gap-3 border-b border-border py-3">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            className="text-muted shrink-0"
          >
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            id="search-dropdown"
            className="w-full bg-transparent text-base text-text placeholder:text-muted placeholder:opacity-50 focus:outline-none"
            value={searchValue}
            placeholder={tRecipes('search.placeholder')}
            onChange={(e) => setSearchValue(e.target.value.trim())}
          />
        </div>
      </div>

      {status === 'pending' ? (
        <LoadingPage/>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg text-text font-medium mb-2">{tCommon('errors.somethingWentWrong')}</p>
          <p className="text-base text-muted">{tCommon('errors.tryAgainLater')}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Cards Grid */}
          <div className="w-full px-4 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-14">
            <RecipesList filteredRecipes={filteredRecipes}/>
          </div>

          {/* Load More Button */}
          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetching}
            className={`mb-10 px-8 py-3 text-sm border transition-all ${
              hasNextPage
                ? 'border-border text-text hover:bg-surface'
                : 'border-border text-muted cursor-not-allowed opacity-50'
            }`}
          >
            {isFetching ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {tRecipes('pagination.loading')}
              </span>
            ) : hasNextPage ? (
              tRecipes('pagination.loadMore')
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
