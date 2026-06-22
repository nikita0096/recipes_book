import {
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
  IRecipePublic,
  IRecipePremiumFull,
  RecipePrice,
} from "@/types/recipe";

type PublicResult = { data: IRecipePublic | null; error: string | null };
type PremiumResult = {
  data: { newRecipe: IRecipePremiumFull; newPrice: RecipePrice } | null;
  error: string | null;
};

// Shared client transport for the recipe update route. Mirrors the previous
// direct-Supabase return shape ({ data, error }) so call sites only change
// their import path.
const patchRecipe = async <T extends { data: unknown; error: string | null }>(
  id: string,
  body: unknown,
  fallbackError: string
): Promise<T> => {
  try {
    const res = await fetch(`/api/admin/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { data: null, error: json?.error || fallbackError } as T;
    }

    return json as T;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : fallbackError,
    } as T;
  }
};

// public → public
export const updateRecipePublic = (
  formData: UpdateRecipeDataPublic,
  id: string
): Promise<PublicResult> =>
  patchRecipe<PublicResult>(
    id,
    { isPremium: false, wasPremium: false, data: formData },
    "Failed to update recipe"
  );

// premium → public
export const convertPremiumToPublic = (
  formData: UpdateRecipeDataPublic,
  id: string
): Promise<PublicResult> =>
  patchRecipe<PublicResult>(
    id,
    { isPremium: false, wasPremium: true, data: formData },
    "Failed to convert to public"
  );

// premium → premium
export const updateRecipePremium = (
  mainData: UpdateRecipeDataPremiumMain,
  premiumData: UpdateRecipeDataPremiumPart,
  id: string
): Promise<PremiumResult> =>
  patchRecipe<PremiumResult>(
    id,
    { isPremium: true, wasPremium: true, mainData, premiumData },
    "Failed to update recipe"
  );

// public → premium
export const convertPublicToPremium = (
  mainData: UpdateRecipeDataPremiumMain,
  premiumData: UpdateRecipeDataPremiumPart,
  id: string
): Promise<PremiumResult> =>
  patchRecipe<PremiumResult>(
    id,
    { isPremium: true, wasPremium: false, mainData, premiumData },
    "Failed to convert to premium"
  );
