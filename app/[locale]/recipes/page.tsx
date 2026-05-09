'use client'

import React, {useEffect, useMemo, useRef, useState} from 'react';
import RecipesList from "@/components/recipes/RecipesList";
import {useRecipes} from "@/hooks/useRecipes";
import LoadingPage from "@/components/ui/LoadingPage";
import {useLocale, useTranslations} from "next-intl";
import {useSearchRecipe} from "@/hooks/useSearchRecipe";

const Recipes = () => {

  const [searchValue, setSearchValue] = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();

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


  useEffect(() => {
    if (searchValue !== '') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    }, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [searchValue, hasNextPage, fetchNextPage, isFetching]);

  const {data: searchResult, loading: searchLoading} = useSearchRecipe(searchValue, locale);

  const allRecipes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]);

  const filteredRecipes = useMemo(() => {

    if (searchValue !== '' && searchResult) {
      return searchResult;
    }

    return allRecipes;
  }, [allRecipes, searchValue, searchResult]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <div className="text-center pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 px-4 sm:px-6 lg:px-10">
        <h1 className="text-sm sm:text-base text-muted tracking-wide uppercase">
          {tRecipes('page.subtitle')}
        </h1>
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
            <circle cx="11"
                    cy="11"
                    r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            id="search"
            className="w-full bg-transparent text-base text-text placeholder:text-muted placeholder:opacity-50 focus:outline-none"
            value={searchValue}
            placeholder={tRecipes('search.placeholder')}
            onChange={(e) => setSearchValue(e.target.value.trim())}
          />
          {searchLoading && (
            <div className='flex items-center justify-center'>
              <LoadingCircle/>
            </div>
          )}
        </div>
      </div>

      {status === 'pending' ? (
        <LoadingPage/>
      ) : status === 'error' ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <LoadingCircle/>
          </div>
          <p className="text-lg text-text font-medium mb-2">{tCommon('errors.somethingWentWrong')}</p>
          <p className="text-base text-muted">{tCommon('errors.tryAgainLater')}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Cards Grid */}
          <div className="w-full px-4 sm:px-6 lg:px-10 pb-10 sm:pb-12 lg:pb-14">
            <RecipesList filteredRecipes={filteredRecipes}/>

            {isFetching && hasNextPage && (
              <div className="pt-50 flex items-center justify-center">
                <LoadingCircle />
              </div>
            )}
          </div>

          {searchValue === '' && <div ref={sentinelRef} className="h-4" />}

          {!hasNextPage && (
            <div className='mb-10 text-muted'>
              {tRecipes('pagination.allLoaded')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LoadingCircle = () => {
  return (
    <svg className="animate-spin w-4 h-4"
         fill="none"
         viewBox="0 0 24 24">
      <circle className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"/>
      <path className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  )
}

export default Recipes;
