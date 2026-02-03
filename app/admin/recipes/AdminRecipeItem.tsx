'use client';

import React from 'react';
import RecipeItem from "@/components/recipes/RecipeItem";
import {IRecipe} from "@/app/recipes/page";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/deleteRecipe";

interface AdminRecipeItem {
  recipe: IRecipe;
}

const AdminRecipeItem: React.FC<AdminRecipeItem> = ({recipe}) => {

  const queryClient = useQueryClient();

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['recipes']});
    },
  });

  return (
    <div className='relative'>
      <RecipeItem recipe={recipe}/>
      <div className='absolute top-3 right-3 flex flex-col gap-2'>
        <button className='px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md'>
          Edit
        </button>
        <button
          className='px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-md'
          onClick={() => deleteRecipeMutation.mutate(recipe.id.toString())}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default AdminRecipeItem;