import {supabase} from "@/lib/supabase/ClientComponentClient";
import {Ingredients} from "@/app/[locale]/admin/page";

export type LocalizedText = { en: string; uk: string };

export interface IUploadData {
  title: LocalizedText;
  likes: number;
  category: string;
  recipeSteps: { desc: LocalizedText, imgUrl: string | null, id: string }[];
  ingredients: Ingredients[];
  heroImgUrl: string | null;
  isPremium: boolean;
  preparingTime: number;
}

export const insertRecipe = async (recipeData: IUploadData) => {
  const {data, error} = await supabase
    .from('recipes')
    .insert({
      title: recipeData.title,
      category: recipeData.category,
      likes: recipeData.likes,
      recipeSteps: recipeData.recipeSteps,
      ingredients: recipeData.ingredients,
      heroImg: recipeData.heroImgUrl,
      isPremium: recipeData.isPremium,
      preparingTime: recipeData.preparingTime,
    });

  if (error) {
    throw error;
  }

  if(data) {
    return "success";
  }
}