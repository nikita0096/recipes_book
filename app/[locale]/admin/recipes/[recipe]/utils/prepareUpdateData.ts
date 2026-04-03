import {v4 as uuidv4} from "uuid";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {uploadVideoToStorage} from "@/services/storage/uploadVideoToStorage";
import {deleteImage, deleteVideo} from "@/services/storage/deleteFromStorage";
import {EditingValues} from "../page";
import {
  IRecipe,
  RecipeStep,
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
} from "@/types/recipe";

export interface PrepareUpdateDataParams {
  formData: EditingValues;
  recipe: IRecipe;
}

// Результат для public рецепта (остаётся или становится public)
export interface PrepareUpdateDataResultPublic {
  success: true;
  isPremium: false;
  wasPremium: boolean; // true если был premium → public
  data: UpdateRecipeDataPublic;
}

// Результат для premium рецепта (остаётся или становится premium)
export interface PrepareUpdateDataResultPremium {
  success: true;
  isPremium: true;
  wasPremium: boolean; // false если был public → premium
  mainData: UpdateRecipeDataPremiumMain;
  premiumData: UpdateRecipeDataPremiumPart;
}

// Результат с ошибкой
export interface PrepareUpdateDataResultError {
  success: false;
  error: string;
}

export type PrepareUpdateDataResult =
  | PrepareUpdateDataResultPublic
  | PrepareUpdateDataResultPremium
  | PrepareUpdateDataResultError;

export const prepareUpdateData = async ({
  formData,
  recipe,
}: PrepareUpdateDataParams): Promise<PrepareUpdateDataResult> => {
  try {
    // Use recipe.id as folder name - it never changes
    const folder = recipe.id;

    // Process steps - upload new images if needed
    const processedSteps: RecipeStep[] = [];
    for (const step of formData.recipeSteps) {
      let imgUrl = step.imgUrl;

      // If there's a new image file, upload it
      if (step.imgFile) {
        // Find old image URL for this step and delete it
        const oldStep = recipe.recipeSteps.find(s => s.id === step.id);
        if (oldStep?.imgUrl) {
          await deleteImage(oldStep.imgUrl);
        }

        const filePath = `${folder}/${uuidv4()}`;
        const {imageUrl, error: uploadError} = await uploadImage({
          file: step.imgFile,
          bucket: 'images',
          filePath: filePath
        });

        if (uploadError) {
          return {success: false, error: 'Failed to upload step image'};
        }

        imgUrl = imageUrl;
      }

      processedSteps.push({
        desc: step.desc,
        imgUrl: imgUrl,
        id: step.id
      });
    }

    // Find and delete images from removed steps
    const newStepIds = new Set(formData.recipeSteps.map(s => s.id));
    for (const oldStep of recipe.recipeSteps) {
      if (!newStepIds.has(oldStep.id) && oldStep.imgUrl) {
        await deleteImage(oldStep.imgUrl);
      }
    }

    // Process hero image if there's a new file
    let heroImgUrl = formData.heroImg;
    if (formData.heroImgFile) {
      // Delete old hero image before uploading new one
      if (recipe.heroImg) {
        await deleteImage(recipe.heroImg);
      }

      const filePath = `${folder}/heroImg-${uuidv4()}`;
      const {imageUrl, error: heroError} = await uploadImage({
        file: formData.heroImgFile,
        bucket: 'images',
        filePath: filePath
      });

      if (heroError) {
        return {success: false, error: 'Failed to upload hero image'};
      }

      heroImgUrl = imageUrl;
    }

    // Process video if there's a new file
    let videoUrl = recipe.videoUrl;
    if (formData.videoFile) {
      // Delete old video before uploading new one
      if (recipe.videoUrl) {
        await deleteVideo(recipe.videoUrl);
      }

      const filePath = `${folder}/${uuidv4()}`;
      const {videoUrl: newVideoUrl, error: videoError} = await uploadVideoToStorage({
        videoFile: formData.videoFile,
        bucket: 'videos',
        filePath: filePath
      });

      if (videoError) {
        return {success: false, error: 'Failed to upload video'};
      }

      videoUrl = newVideoUrl;
    }

    // Prepare ingredients
    const ingredients = formData.ingredients.map(ing => ({
      id: ing.id,
      value: ing.value,
      quantity: ing.quantity,
      unit: ing.unit
    }));

    // Return different structure based on target isPremium
    if (formData.isPremium) {
      // Target: Premium
      const mainData: UpdateRecipeDataPremiumMain = {
        title: formData.title,
        category: formData.category,
        likes: Number(formData.likes),
        ingredients,
        heroImg: heroImgUrl,
        preparingTime: formData.preparingTime,
        isPremium: true as const,
      };

      const premiumData: UpdateRecipeDataPremiumPart = {
        recipeId: recipe.id,
        recipeSteps: processedSteps,
        videoUrl: videoUrl,
      };

      return {
        success: true,
        isPremium: true,
        wasPremium: recipe.isPremium, // false = public→premium, true = premium→premium
        mainData,
        premiumData,
      };
    }

    // Target: Public
    const data: UpdateRecipeDataPublic = {
      title: formData.title,
      category: formData.category,
      likes: Number(formData.likes),
      recipeSteps: processedSteps,
      ingredients,
      heroImg: heroImgUrl,
      videoUrl: videoUrl,
      preparingTime: formData.preparingTime,
      isPremium: false as const,
    };

    return {
      success: true,
      isPremium: false,
      wasPremium: recipe.isPremium, // true = premium→public, false = public→public
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to prepare update data'
    };
  }
};

// Helper to check if data has changed
export const hasDataChanged = (formData: EditingValues, recipe: IRecipe): boolean => {
  // Check title
  if (formData.title.ua !== recipe.title.ua || formData.title.en !== recipe.title.en) {
    return true;
  }

  // Check category
  if (formData.category.ua !== recipe.category.ua || formData.category.en !== recipe.category.en) {
    return true;
  }

  // Check likes
  if (Number(formData.likes) !== recipe.likes) {
    return true;
  }

  // Check hero image
  if (formData.heroImg !== recipe.heroImg) {
    return true;
  }

  // Check video
  if (formData.videoUrl !== (recipe.videoUrl || '') || formData.videoFile !== null) {
    return true;
  }

  // Check steps count
  if (formData.recipeSteps.length !== recipe.recipeSteps.length) {
    return true;
  }

  // Check each step
  for (let i = 0; i < formData.recipeSteps.length; i++) {
    const formStep = formData.recipeSteps[i];
    const recipeStep = recipe.recipeSteps[i];

    if (formStep.desc.ua !== recipeStep.desc.ua || formStep.desc.en !== recipeStep.desc.en) {
      return true;
    }
    if (formStep.imgUrl !== recipeStep.imgUrl || formStep.imgFile !== null) {
      return true;
    }
  }

  // Check ingredients count
  if (formData.ingredients.length !== recipe.ingredients.length) {
    return true;
  }

  // Check each ingredient
  for (let i = 0; i < formData.ingredients.length; i++) {
    const formIng = formData.ingredients[i];
    const recipeIng = recipe.ingredients[i];

    if (
      formIng.value.ua !== recipeIng.value.ua ||
      formIng.value.en !== recipeIng.value.en ||
      formIng.quantity !== recipeIng.quantity ||
      formIng.unit !== recipeIng.unit
    ) {
      return true;
    }
  }

  return false;
};