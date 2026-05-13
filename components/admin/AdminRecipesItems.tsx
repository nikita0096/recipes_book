'use client';

import React from 'react';
import AdminRecipeItem from "./AdminRecipeItem";
import {IRecipe} from "@/types/recipe";

interface IAdminRecipesProps {
  allRecipes: IRecipe[][];
}

const AdminRecipesItems: React.FC<IAdminRecipesProps> = ({allRecipes}) => {

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full'>
      {allRecipes.map((page) => (
        page.map((recipe, index) => (
          <AdminRecipeItem
            key={recipe.id}
            recipe={recipe}
            index={index}
          />
        ))
      ))}
    </div>
  );
};

export default AdminRecipesItems;
