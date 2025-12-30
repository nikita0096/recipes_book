import {supabase} from "@/supabase/ClientComponentClient";

export interface IUploadData {
  title: string;
  likes: number;
  category: string;
  recipeSteps: { desc: string, imgUrl: string | null; }[];
  ingredients: string[];
}

export const insertRecipe = async ({title, category, likes = 0, recipeSteps, ingredients}: IUploadData) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      title: title, category: category, likes: likes, recipeSteps: recipeSteps, ingredients: ingredients
    });

  if (error) {
    console.log(error);
  }

  if(data) {
    console.log(data);
  }
}