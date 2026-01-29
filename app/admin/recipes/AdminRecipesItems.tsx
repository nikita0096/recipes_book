'use client';

import React from 'react';
import AdminRecipeItem from "@/app/admin/recipes/AdminRecipeItem";
import {IRecipe} from "@/app/recipes/page";

interface IAdminRecipesProps {
  allRecipes: IRecipe[];
}

const AdminRecipesItems: React.FC<IAdminRecipesProps> = ({allRecipes}) => {

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-2 w-full'>
      {allRecipes.map((recipe) => (<AdminRecipeItem key={recipe.id}
                                                    recipe={recipe}/>))}
    </div>
  );
};

export default AdminRecipesItems;