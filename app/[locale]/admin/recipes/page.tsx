'use client';

import {AdminRecipesItems} from "@/components/admin";
import LoadingPage from "@/components/ui/LoadingPage";
import {useRecipes} from "@/hooks/useRecipes";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {IRecipe} from "@/types/recipe";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {useSearchParams} from "next/navigation";
import LoadingCircle from "@/components/ui/LoadingCircle";
import {useSearchRecipe} from "@/hooks/useSearchRecipe";

const Page = () => {
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? '');

  const sentinelRef = useRef(null);

  const t = useTranslations('admin');
  const tRecipes = useTranslations('recipes');

  const locale = useLocale();

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching
  } = useRecipes();

  const {
    data: searchResult,
    loading: searchLoading
  } = useSearchRecipe(searchValue, locale);

  const recipesList = useMemo(() => {
    if(searchValue) {
      return [searchResult];
    }

    if(data?.pages) {
      return data?.pages.map((page) => page.data);
    }

    return [[]];
  }, [searchValue, data, searchResult]);

  useEffect(() => {
    if(searchValue !== '') return;

    const observer = new IntersectionObserver(entries => {
      if(hasNextPage && !isFetching && entries[0].isIntersecting) {
        fetchNextPage();
      }
    },{
      threshold: 0.1,
      rootMargin: '200px',
    });

    if(sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [searchValue, hasNextPage, fetchNextPage, isFetching])

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

  return (
    <div className='min-h-screen bg-bg'>
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl italic font-normal text-text mb-1">
              {t('form.title')}
            </h1>
            <p className="text-sm text-muted">{data?.pages.flatMap(page => page.data).length} recipes</p>
          </div>
          <Link
            href="/admin"
            className="text-sm border border-border text-text px-4 py-2 hover:bg-surface transition-colors"
          >
            + {t('form.buttons.create')}
          </Link>
        </div>
      </div>

      <div className="flex justify-center px-4 sm:px-6 lg:px-10 py-5">
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
            type="text"
            id="search"
            className="w-full bg-transparent text-base text-text placeholder:text-muted placeholder:opacity-50 focus:outline-none"
            value={searchValue}
            placeholder={tRecipes('search.placeholder')}
            onChange={(e) => setSearchValue(prev => prev != e.target.value.trim() ? e.target.value.trim() : prev)}
          />
          {searchLoading && (
            <div className='flex items-center justify-center'>
              <LoadingCircle/>
            </div>
          )}
          {searchValue && (
            <button className='cursor-pointer' onClick={() => setSearchValue('')}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 6h16M9 6V4h6v2M6 6v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Recipes Grid */}
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8'>
        <AdminRecipesItems allRecipes={recipesList}/>

        {isFetching && hasNextPage && (
          <div className="pt-50 flex items-center justify-center">
            <LoadingCircle/>
          </div>
        )}
      </div>

      {searchValue && !recipesList[0]?.length && !searchLoading && (
        <div className="flex flex-col items-center justify-center py-5 px-4">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M8 8l6 6M14 8l-6 6" />
          </svg>
          <p className='mt-4 text-muted'>
            {tRecipes('search.noResults')}
          </p>
        </div>
      )}

      {searchValue === '' && <div ref={sentinelRef}
                                  className="h-4"/>}

      {!hasNextPage && !searchValue && !isFetching && (
        <div className='flex flex-col items-center mb-10 text-muted'>
          {tRecipes('pagination.allLoaded')}
        </div>
      )}
    </div>
  );
};

export default Page;