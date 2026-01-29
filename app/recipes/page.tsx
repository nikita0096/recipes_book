'use client'
import React, {useMemo, useState} from 'react';
import RecipesList from "@/components/recipes/RecipesList";
import {useRecipes} from "@/hooks/useRecipes";

export interface IRecipe {
  id: number;
  title: string;
  category: string;
  recipeSteps: { desc: string; imgUrl: string }[];
  likes: number;
  ingredients: string[];
}

const Recipes = () => {

  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('All recipes');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useRecipes();

  const allRecipes = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]);

  const filteredRecipes = useMemo(() => {
    let recipes = allRecipes;

    if (selectValue !== 'All recipes') {
      recipes = recipes.filter((recipe) => recipe.category === selectValue);
    }

    if (searchValue !== '') {
      const search = searchValue.toLowerCase().trim();
      recipes = recipes?.filter((recipe) => recipe.title.toLowerCase().includes(search));
    }

    return recipes;
  }, [allRecipes, searchValue, selectValue]);

  return (
    <div className="max-w-5xl lg:max-w-7xl mx-auto px-8">
      <form className="max-w-3xl mx-auto mt-8">
        <div className="flex shadow-xs space-x-0.5">
          <select name="Category"
                  id="category-select"
                  className="border rounded-l-xl p-2 w-1/3"
                  onChange={(e) => setSelectValue(e.target.value)}
          >
            {['All recipes', 'Appetizers', 'Breakfast', 'Dinner', 'Soups', 'Salads', 'Main dishes', 'Side dishes', 'Desserts'].map((item, i) => (
              <option value={item}
                      key={i}>{item}</option>
            ))}
          </select>

          <input
            type="search"
            id="search-dropdown"
            className="px-3 bg-neutral-secondary-medium border rounded-r-xl text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body"
            value={searchValue}
            placeholder='Find a recipe'
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </form>

      {status === 'pending' ? (
        <p>Loading...</p>
      ) : status === 'error' ? (
        <p>Error: {error.message}</p>
      ) : <div className='flex flex-col items-center'>
        <RecipesList filteredRecipes={filteredRecipes}/>

        <button onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetching}
                className='bg-blue-400 rounded-xl px-4 py-2 min-w-30 cursor-pointer my-5'>{hasNextPage ? 'Load more' : 'Nothing to load'}</button>
      </div>}


    </div>
  );
};

export default Recipes;