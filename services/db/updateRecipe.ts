import {supabase} from "@/lib/supabase/ClientComponentClient";
import {Ingredient, LocalizedText} from "@/types/forms";
import {fetchAllRecipes} from "@/services/db/fetchAllRecipes";
import {fetchRecipe} from "@/services/db/fetchRecipe";

export interface UpdateRecipeData {
  title: LocalizedText;
  category: LocalizedText;
  likes: number;
  recipeSteps: { desc: LocalizedText; imgUrl: string | null; id: string }[];
  ingredients: Ingredient[];
  heroImg: string;
  videoUrl?: string;
  preparingTime: number;
  isPremium: boolean;
}

export const updateRecipeData = async (formData: UpdateRecipeData, id: string) => {
  const {data, error} = await supabase
    .from("recipes")
    .update({
      title: formData.title,
      category: formData.category,
      likes: formData.likes,
      recipeSteps: formData.recipeSteps,
      ingredients: formData.ingredients,
      heroImg: formData.heroImg,
      videoUrl: formData.videoUrl,
    })
    .eq('id', id)
    .select()
    .single();


  if (error) {
    return {data: null, error: error.message};
  }

  if (!data ) {
    return {data: null, error: 'Recipe not found'};
  }

  return {data, error: null};
}