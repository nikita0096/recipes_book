import { Ingredient, LocalizedText } from './forms';

// ===== БАЗОВЫЕ ТИПЫ =====

export type RecipeStep = {
  desc: LocalizedText;
  imgUrl: string | null;
  id: string;
};

// Общие поля для всех рецептов
interface IRecipeBase {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  likes: number;
  category: LocalizedText;
  ingredients: Ingredient[];
  heroImg: string;
  preparingTime: number;
}

// ===== FETCH ТИПЫ =====

// Public рецепт (все данные в main table)
export interface IRecipePublic extends IRecipeBase {
  isPremium: false;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Premium рецепт (полный, после merge с premium table)
export interface IRecipePremiumFull extends IRecipeBase {
  isPremium: true;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Union type для полных рецептов (после fetch)
export type IRecipe = IRecipePublic | IRecipePremiumFull;

// Premium рецепт из main table (неполный, до merge с premium table)
export interface IRecipePremiumIncomplete extends IRecipeBase {
  isPremium: true;
  recipeSteps: RecipeStep[] | null;
  videoUrl: string | null;
}

// ===== TYPE GUARDS =====

export const isPublicRecipe = (recipe: IRecipe): recipe is IRecipePublic => {
  return recipe.isPremium === false;
};

export const isPremiumRecipe = (recipe: IRecipe): recipe is IRecipePremiumFull => {
  return recipe.isPremium === true;
};

// ===== CREATE/UPLOAD ТИПЫ =====

// Public рецепт для загрузки (все поля обязательны)
export interface IRecipeUploadPublic extends Omit<IRecipeBase, 'id'> {
  id: string; // Generated on frontend before upload
  isPremium: false;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Premium рецепт для загрузки в main table (без steps/video)
export interface IRecipeUploadPremiumMain extends Omit<IRecipeBase, 'id'> {
  id: string; // Generated on frontend before upload
  isPremium: true;
}

// Premium часть для загрузки в premium table
export interface IRecipePremiumUpload {
  recipeId: string;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Union для upload в main table
export type IRecipeUpload = IRecipeUploadPublic | IRecipeUploadPremiumMain;

// ===== UPDATE ТИПЫ =====

// Общие поля для update
interface UpdateRecipeBase {
  title: LocalizedText;
  description: LocalizedText;
  category: LocalizedText;
  likes: number;
  ingredients: Ingredient[];
  heroImg: string;
  preparingTime: number;
}

// Public рецепт update (все поля)
export interface UpdateRecipeDataPublic extends UpdateRecipeBase {
  isPremium: false;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Premium рецепт update для main table (без steps/video)
export interface UpdateRecipeDataPremiumMain extends UpdateRecipeBase {
  isPremium: true;
}

// Premium рецепт update для premium table
export interface UpdateRecipeDataPremiumPart {
  recipeId: string;
  recipeSteps: RecipeStep[];
  videoUrl: string;
}

// Union для update main table
export type UpdateRecipeData = UpdateRecipeDataPublic | UpdateRecipeDataPremiumMain;

// ===== LEGACY SUPPORT (временно для совместимости) =====

// @deprecated - использовать IRecipeUploadPublic или IRecipeUploadPremiumMain
export type IRecipeUploadLegacy = Omit<IRecipeBase, 'id'> & {
  isPremium: boolean;
  recipeSteps?: RecipeStep[];
  videoUrl?: string;
};

// ===== УТИЛИТЫ =====

export const parseJson = <T>(value: T | string): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value as T;
    }
  }

  return value;
};