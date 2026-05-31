import React from 'react';
import {IRecipe} from "@/types/recipe";
import RecipeItem from "@/components/recipes/recipe/RecipeItem";

interface RecipesListProps {
  recipesList: IRecipe[][];
  userLikes: string[];
  userPurchases: string[];
  handleUnlikeRecipe: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void;
}

const RecipesList: React.FC<RecipesListProps> = ({recipesList, userLikes, userPurchases, handleUnlikeRecipe}) => {

  if (!recipesList || !recipesList.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5 md:gap-3.5 lg:gap-5 w-full">
      {recipesList.map((page) => (
        page.map((recipe, index) => (
          <RecipeItem key={recipe.id}
                      recipe={recipe}
                      index={index}
                      userLikes={userLikes}
                      userPurchases={userPurchases}
                      handleUnlikeRecipe={handleUnlikeRecipe}/>
        ))
      ))}
    </div>
  );
};

export default RecipesList;
