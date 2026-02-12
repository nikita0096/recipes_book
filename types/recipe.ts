export interface IRecipe {
  id: number;
  title: string;
  category: string;
  recipeSteps: { desc: string; imgUrl: string }[];
  likes: number;
  ingredients: string[];
}