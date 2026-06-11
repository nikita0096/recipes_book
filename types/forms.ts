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

export interface IngredientGroup {
  id: string;
  title: LocalizedText;
  ingredients: Ingredient[];
}

// Draft inputs for adding a new ingredient inside a group form
export interface IngredientDraft {
  ua: string;
  en: string;
  quantity: string;
  unit: UnitValue;
}

export interface IngredientGroupFormValues extends IngredientGroup {
  draft: IngredientDraft;
}

export interface IFormValues {
  title: { en: string; ua: string };
  description: { en: string; ua: string };
  likes: number;
  category: string;
  price: { en: number; ua: number };
  discount: number;
  recipeSteps: { desc: { en: string; ua: string }; image: File | null }[];
  ingredientGroups: IngredientGroupFormValues[];
  heroImg: File | null;
  isPremium: boolean;
  preparingTime: number;
  weight: number | null;
  diameter: number | null;
  calories: number | null;
  videoFile: File | null;
  slug: string;
}
