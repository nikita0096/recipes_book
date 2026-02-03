'use client';

import React, {useEffect, useState} from 'react';
import {useParams} from "next/navigation";
import {useRecipesStore} from "@/store/useRecipesStore";
import RecipePage from "@/components/recipes/RecipePage";

const Page = () => {
  const params = useParams<{ recipe: string }>();
  const {selectedRecipe, setSelectedRecipe} = useRecipesStore();

  useEffect(() => {
    setSelectedRecipe(params.recipe);
  }, []);

  console.log(selectedRecipe);

  if(!selectedRecipe){
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="rounded-2xl border border-amber-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
          <div className="flex animate-pulse space-x-4">
            <div className="size-12 rounded-full bg-amber-100 dark:bg-gray-700"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-3 rounded-full bg-amber-100 dark:bg-gray-700 w-3/4"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 h-3 rounded-full bg-amber-100 dark:bg-gray-700"></div>
                  <div className="col-span-1 h-3 rounded-full bg-amber-100 dark:bg-gray-700"></div>
                </div>
                <div className="h-3 rounded-full bg-amber-100 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RecipePage recipe={selectedRecipe}/>
  );
};

export default Page;