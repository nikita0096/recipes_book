'use client'
import React, {useEffect, useMemo, useState} from 'react';
import {useRecipesStore} from "@/store/useRecipesStore";
import RecipesList from "@/components/recipes/RecipesList";
import LoadingPage from "@/components/ui/LoadingPage";

export interface IRecipe {
  id: number;
  title: string;
  category: string;
  recipeSteps: {desc: string; imgUrl: string}[];
  likes: number;
  ingredients: string[];
}

const Recipes = () => {
  const {recipes, isLoading, error, getRecipes} = useRecipesStore();

  const [searchValue, setSearchValue] = useState('');
  const [selectValue, setSelectValue] = useState('All recipes');
  const [allRecipes, setAllRecipes] = useState<IRecipe[]>([]);



  const filteredRecipes = useMemo(() => {
    if (!searchValue.trim() && selectValue === 'All recipes') return allRecipes;

    const sortedList =  allRecipes.filter(recipe => recipe.category !== 'All recipes' && recipe.category === selectValue);

    if(searchValue.trim()) {
      if(sortedList.length > 0){
        const filteredList = sortedList.filter(item =>
          item.title.toLowerCase().includes(searchValue.trim().toLowerCase())
        );

        return filteredList;
      }

      const filteredList = allRecipes.filter(item =>
        item.title.toLowerCase().includes(searchValue.trim().toLowerCase())
      );

      return filteredList;
    }

    return sortedList;
  }, [searchValue, allRecipes, selectValue]);

  useEffect(() => {
    getRecipes();
  }, []);

  useEffect(() => {
    setAllRecipes(recipes);
  }, [recipes]);


  return (
    <div className="max-w-5xl lg:max-w-7xl mx-auto px-8 lg:p">
      <form className="max-w-3xl mx-auto mt-8">
        <div className="flex shadow-xs space-x-0.5">
          <select name="Category"
                  id="category-select"
                  className="border rounded-l-xl p-2 w-1/3"
                  onChange={(e) => setSelectValue(e.target.value)}
          >
            {['All recipes', 'Appetizers','Breakfast', 'Dinner', 'Soups', 'Salads', 'Main dishes', 'Side dishes', 'Desserts'].map((item, i) => (
              <option value={item} key={i}>{item}</option>
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

      {isLoading
        ? (
        <LoadingPage/>
      )
      : (<RecipesList filteredRecipes={filteredRecipes}/>)}


      {error ?? (<div>{error}</div>)}


    </div>
  );
};

export default Recipes;