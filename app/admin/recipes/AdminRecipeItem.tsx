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
    <div className='relative flex items-center justify-center gap-2'>
      <RecipeItem recipe={recipe}/>
      <div className='absolute top-5 right-5 flex flex-col gap-2'>
        <button className='bg-blue-400 rounded-xl px-4 py-2 w-30 cursor-pointer'
                >Edit
        </button>
        <button className='bg-red-400 rounded-xl px-4 py-2 w-30 cursor-pointer'
                onClick={() => deleteRecipeMutation.mutate(recipe.id.toString())}>Delete
        </button>
      </div>
    </div>
  );
};

export default AdminRecipeItem;