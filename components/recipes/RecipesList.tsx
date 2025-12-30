import React from 'react';
import {IRecipe} from "@/app/recipes/page";
import RecipeItem from "@/components/recipes/RecipeItem";

interface RecipesListProps {
  filteredRecipes: IRecipe[];
}

const RecipesList: React.FC<RecipesListProps> = ({filteredRecipes}) => {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:gap-x-7 xl:gap-y-4 lg:grid-cols-1 w-full mt-3">
      {filteredRecipes.map(recipe => <RecipeItem key={recipe.id}
                                             recipe={recipe}/>)}
    </div>
  );
};

export default RecipesList;