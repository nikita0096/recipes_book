import { Ingredient, LocalizedText } from './forms';

export interface IRecipe {
  id: number;
  title: LocalizedText;
  likes: number;
  category: LocalizedText;
  recipeSteps: { desc: LocalizedText, imgUrl: string | null, id: string }[];
  ingredients: Ingredient[];
  heroImg: string;
  isPremium: boolean;
  preparingTime: number;
  videoUrl?: string;
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
