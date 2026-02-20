import {Ingredients} from "@/app/[locale]/admin/page";
import {LocalizedText} from "@/services/db/insertRecipeToDatabase";
import {useTranslations} from "next-intl";

export interface IRecipe {
  id: number;
  title: LocalizedText;
  likes: number;
  category: string;
  recipeSteps: { desc: LocalizedText, imgUrl: string | null, id: string }[];
  ingredients: Ingredients[];
  heroImg: string;
  isPremium: boolean;
  preparingTime: number;
}

export const parseJson = <T>(value: T | string): T => {
  if(typeof value === 'string') {
    try{
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  return value;
}