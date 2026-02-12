import React from 'react';
import {IRecipe} from "@/types/recipe";
import RecipeItem from "@/components/recipes/RecipeItem";

interface RecipesListProps {
  filteredRecipes: IRecipe[];
}

const RecipesList: React.FC<RecipesListProps> = ({filteredRecipes}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full mt-8">
      {filteredRecipes.map(recipe => (
        <RecipeItem key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
};

export default RecipesList;