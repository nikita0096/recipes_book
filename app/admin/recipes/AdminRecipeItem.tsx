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
    <div>
      <RecipeItem recipe={recipe}/>
      <button className='bg-red-400 rounded-xl px-4 py-2'
              onClick={() => deleteRecipeMutation.mutate(recipe.id.toString())}>Delete
      </button>
    </div>
  );
};

export default AdminRecipeItem;