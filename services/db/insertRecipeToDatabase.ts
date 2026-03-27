import {supabase} from "@/lib/supabase/ClientComponentClient";
import {Ingredient, LocalizedText} from "@/types/forms";

export type { LocalizedText };

export interface IUploadData {
  title: LocalizedText;
  likes: number;
  category: LocalizedText;
  ingredients: Ingredient[];
  heroImgUrl: string | null;
  isPremium: boolean;
  preparingTime: number;
  videoUrl?: string;
  recipeSteps?: { desc: LocalizedText, imgUrl: string | null, id: string }[];
}

export const insertRecipe = async (recipeData: IUploadData) => {
  const { data, error} = await supabase
    .from('recipes')
    .insert({
      title: recipeData.title,
      category: recipeData.category,
      likes: recipeData.likes,
      ingredients: recipeData.ingredients,
      hero_img: recipeData.heroImgUrl,
      is_premium: recipeData.isPremium,
      preparing_time: recipeData.preparingTime,
      video_url: recipeData.videoUrl ? recipeData.videoUrl : null,
      recipe_steps: recipeData.recipeSteps ? recipeData.recipeSteps : null,
    })
    .select('id')   // <-- запрашиваем id обратно
    .single();

  if (error) {
    throw error;
  }

  return data;
}
