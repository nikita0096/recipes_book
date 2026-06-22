import {
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
  IRecipePremiumUpload,
} from "@/types/recipe";

export type CreateRecipePayload =
  | { isPremium: false; recipe: IRecipeUploadPublic }
  | {
      isPremium: true;
      main: IRecipeUploadPremiumMain;
      stepsCount: number;
      premium: IRecipePremiumUpload;
    };

/**
 * Client wrapper that persists a recipe through the admin API route.
 * Images/video are uploaded client-side first; this sends the resulting paths.
 * Throws on failure so the caller's existing try/catch can surface the error.
 */
export const createRecipe = async (
  payload: CreateRecipePayload
): Promise<void> => {
  const res = await fetch("/api/admin/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create recipe");
  }
};
