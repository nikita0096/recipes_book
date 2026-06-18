'use client'

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import RecipesList from "@/components/recipes/RecipesList";
import {useRecipes} from "@/hooks/useRecipes";
import LoadingPage from "@/components/ui/LoadingPage";
import {useLocale, useTranslations} from "next-intl";
import {useSearchRecipe} from "@/hooks/useSearchRecipe";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import LoadingCircle from "@/components/ui/LoadingCircle";
import {useUserStore} from "@/store/useUserStore";
import {getAllLikedRecipesByUser} from "@/services/db/recipe-likes/getAllLikedRecipesByUser";
import {getAllPurchasesByUser} from "@/services/db/purchases/getAllPurchasesByUser";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import {useQueryClient, InfiniteData} from "@tanstack/react-query";
import {IRecipe} from "@/types/recipe";

type RecipesPageData = {
  data: IRecipe[];
  nextCursor?: number;
};

const Recipes = () => {
  const [userLikedRecipes, setUserLikedRecipes] = useState<string[]>([]);
  const [userPurchasedRecipes, setUserPurchasedRecipes] = useState<string[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const {user} = useUserStore();
  const queryClient = useQueryClient();

  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? '');

  const sentinelRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();

  const tRecipes = useTranslations('recipes');
  const tCommon = useTranslations('common');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    status,
  } = useRecipes();

  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    setSearchValue(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    const userLikesAndPurchases = async (id: string) => {
      const likes = await getAllLikedRecipesByUser(id);

      if(likes) setUserLikedRecipes(likes.map(r => r.recipe_id));

      const purchases = await getAllPurchasesByUser(id);
      if(purchases) setUserPurchasedRecipes(purchases.map(r => r.recipe_id));
    }

    if(user) {
      userLikesAndPurchases(user.id);
    }
  }, [user]);


  useEffect(() => {
    if (searchValue !== '') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    }, {
      threshold: 0.1,
      rootMargin: '200px',
    });

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [searchValue, hasNextPage, fetchNextPage, isFetching]);

  const {data: searchResult, loading: searchLoading} = useSearchRecipe(searchValue, locale);

  const recipesList = useMemo(() => {
    if (searchValue !== '' && searchResult) {
      return [searchResult];
    }

    if (data?.pages) {
      return data.pages.map((page) => page.data);
    }

    return [[]];
  }, [searchValue, searchResult, data, userLikedRecipes]);

  const handleSearchChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }

    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, searchParams, router]);

  useEffect(() => {
    const searchUrl = searchParams.get("search") ?? '';

    if (searchUrl === searchValue) return;

    const timeout = setTimeout(() => {
      handleSearchChange(searchValue)
    });

    return () => window.clearTimeout(timeout);
  }, [searchValue, handleSearchChange, searchParams]);

  const handleUnlikeRecipe = async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if(!user) return;

    // Optimistically update the recipe likes count in React Query cache
    queryClient.setQueryData<InfiniteData<RecipesPageData>>(['recipes'], (oldData) => {
      if (!oldData?.pages) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((recipe) =>
            recipe.id === id
              ? { ...recipe, likes: Math.max(0, recipe.likes - 1) }
              : recipe
          )
        }))
      };
    });

    // Update local liked recipes state
    setUserLikedRecipes(prev => prev.filter(rId => rId !== id));

    // Call API to delete like
    await deleteLike(id, user.id);
  }

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
            <RecipesList key={searchValue || 'all'}
                         recipesList={recipesList}
                         userLikes={userLikedRecipes}
                         userPurchases={userPurchasedRecipes}
                         handleUnlikeRecipe={handleUnlikeRecipe}
            />

            {isFetching && hasNextPage && (
              <div className="pt-50 flex items-center justify-center">
                <LoadingCircle/>
              </div>
            )}
          </div>

          {/* No search results */}
          {searchValue && !searchLoading && !recipesList[0]?.length && (
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

          {/* No recipes at all */}
          {!searchValue && !isFetching && !recipesList[0]?.length && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <p className='mt-4 text-lg text-text font-medium'>
                {tRecipes('empty.title')}
              </p>
              <p className='mt-1 text-muted'>
                {tRecipes('empty.description')}
              </p>
            </div>
          )}

          {searchValue === '' && <div ref={sentinelRef}
                                      className="h-4"/>}

          {!hasNextPage && !searchValue && recipesList[0].length > 0 && (
            <div className='mb-10 text-muted'>
              {tRecipes('pagination.allLoaded')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};



export default Recipes;
