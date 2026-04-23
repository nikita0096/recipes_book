import { units } from '@/constants/units';

export type Locale = 'en' | 'ua';

export type LocalizedText = { en: string; ua: string };

export type UnitValue = typeof units[number]['value'];

export interface Ingredient {
  value: { en: string; ua: string };
  quantity: string;
  unit: UnitValue;
  id: string;
}

export interface IFormValues {
  title: { en: string; ua: string };
  description: { en: string; ua: string };
  likes: number;
  category: string;
  recipeSteps: { desc: { en: string; ua: string }; image: File | null }[];
  ingredientEn: string;
  ingredientUa: string;
  ingredients: Ingredient[];
  heroImg: File | null;
  ingredientQuantity: string | null;
  ingredientUnit: UnitValue;
  isPremium: boolean;
  preparingTime: number;
  videoFile: File | null;
}
