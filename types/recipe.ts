import { Ingredient, LocalizedText } from './forms';

// Тип для шага рецепта
export type RecipeStep = {
  desc: LocalizedText;
  imgUrl: string | null;
  id: string;
};

// Основной интерфейс рецепта (для fetch/отображения)
export interface IRecipe {
  id: string;
  title: LocalizedText;
  likes: number;
  category: LocalizedText;
  recipeSteps: RecipeStep[];
  ingredients: Ingredient[];
  heroImg: string;
  isPremium: boolean;
  preparingTime: number;
  videoUrl: string;
}

// Для загрузки в таблицу recipes (без id, recipeSteps/videoUrl optional для premium)
export type IRecipeUpload = Omit<IRecipe, 'id' | 'recipeSteps' | 'videoUrl'> & {
  recipeSteps?: RecipeStep[];
  videoUrl?: string;
};

// Для загрузки премиум части в отдельную таблицу
export interface IRecipePremiumUpload {
  recipeId: string;
  recipeSteps: RecipeStep[];
  videoUrl: string;
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
