import {supabase} from "@/lib/supabase/ClientComponentClient";
import {Ingredients} from "@/app/[locale]/admin/page";

export interface IUploadData {
  title: string;
  likes: number;
  category: string;
  recipeSteps: { desc: string, imgUrl: string | null, id: string}[];
  ingredients: Ingredients[];
  heroImgUrl: string | null;
  isPremium: boolean;
}

export const insertRecipe = async ({title, category, likes = 0, recipeSteps, ingredients}: IUploadData) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      title: title, category: category, likes: likes, recipe_steps: recipeSteps, ingredients: ingredients
    });

  if (error) {
    console.log(error);
  }

  if(data) {
    console.log(data);
  }
}