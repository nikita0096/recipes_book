'use client';

import React, {useEffect, useState} from 'react';
import {useParams} from "next/navigation";
import {IRecipe} from "@/app/recipes/page";
import {useRecipesStore} from "@/store/useRecipesStore";
import Image from "next/image";
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
      <div className="mx-auto w-full max-w-lg rounded-md border border-blue-300 p-4">
        <div className="flex animate-pulse space-x-4">
          <div className="size-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
              </div>
              <div className="h-2 rounded bg-gray-200"></div>
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