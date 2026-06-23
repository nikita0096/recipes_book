import { units } from '@/constants/units';

export type Locale = 'en' | 'uk';

export type LocalizedText = { en: string; uk: string };

export type UnitValue = typeof units[number]['value'];

export interface Ingredient {
  value: { en: string; uk: string };
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
  uk: string;
  en: string;
  quantity: string;
  unit: UnitValue;
}

export interface IngredientGroupFormValues extends IngredientGroup {
  draft: IngredientDraft;
}

export interface IFormValues {
  title: { en: string; uk: string };
  description: { en: string; uk: string };
  likes: number;
  category: string;
  price: { en: number; uk: number };
  discount: number;
  recipeSteps: { desc: { en: string; uk: string }; image: File | null }[];
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
