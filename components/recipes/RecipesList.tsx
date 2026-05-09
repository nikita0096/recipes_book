import React from 'react';
import {IRecipe} from "@/types/recipe";
import RecipeItem from "@/components/recipes/recipe/RecipeItem";

interface RecipesListProps {
  filteredRecipes: IRecipe[];
}

const RecipesList: React.FC<RecipesListProps> = ({filteredRecipes}) => {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5 lg:gap-5 w-full">
      {filteredRecipes.map((recipe, index) => (
        <RecipeItem key={recipe.id} recipe={recipe} index={index} />
      ))}
    </div>
  );
};

export default RecipesList;
