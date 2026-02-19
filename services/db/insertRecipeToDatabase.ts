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
  preparingTime: number;
}

export const insertRecipe = async (recipeData: IUploadData) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      title: recipeData.title, category: recipeData.category, likes: recipeData.likes, recipe_steps: recipeData.recipeSteps, ingredients: recipeData.ingredients, hero_img: recipeData.heroImgUrl, is_premium: recipeData.isPremium, preparing_time: recipeData.preparingTime,
    });

  if (error) {
    throw error;
  }

  if(data) {
    return "success";
  }
}