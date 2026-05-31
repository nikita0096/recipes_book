import {v4 as uuidv4} from "uuid";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {uploadVideoToStorage} from "@/services/storage/uploadVideoToStorage";
import {deleteFileByPath} from "@/services/storage/deleteImageFromStorage";
import {EditingValues} from "../page";
import {
  IRecipe,
  RecipeStep,
  UpdateRecipeDataPublic,
  UpdateRecipeDataPremiumMain,
  UpdateRecipeDataPremiumPart,
} from "@/types/recipe";
import {deleteVideo} from "@/services/storage/deleteVideoR2Bucket";

// Extract path from Supabase public URL
const extractPathFromUrl = (urlOrPath: string, bucket: string): string => {
  // If it's already a path (doesn't start with http), return as is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  // Parse URL to extract path
  // Format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{path}
  const urlParts = urlOrPath.split(`/public/${bucket}/`);
  if (urlParts.length === 2) {
    return urlParts[1];
  }

  // If parsing failed, return original (shouldn't happen)
  return urlOrPath;
};

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
      let imgPath = step.imgUrl;

      // If there's a new image file, upload it
      if (step.imgFile) {
        // Find old image path for this step and delete it
        const oldStep = recipe.recipeSteps.find(s => s.id === step.id);
        if (oldStep?.imgUrl) {
          await deleteFileByPath(oldStep.imgUrl, 'steps');
        }

        const filePath = `${folder}/step-img-${uuidv4()}`;
        const {imagePath, error: uploadError} = await uploadImage({
          file: step.imgFile,
          bucket: 'steps',
          filePath: filePath
        });

        if (uploadError) {
          return {success: false, error: 'Failed to upload step image'};
        }

        imgPath = imagePath;
      } else if (imgPath) {
        // Extract path from URL if needed
        imgPath = extractPathFromUrl(imgPath, 'steps');
      }

      processedSteps.push({
        desc: step.desc,
        imgUrl: imgPath,
        id: step.id
      });
    }

    // Find and delete images from removed steps
    const newStepIds = new Set(formData.recipeSteps.map(s => s.id));
    for (const oldStep of recipe.recipeSteps) {
      if (!newStepIds.has(oldStep.id) && oldStep.imgUrl) {
        await deleteFileByPath(oldStep.imgUrl, 'steps');
      }
    }

    // Process hero image if there's a new file
    let heroImgPath = formData.heroImg;
    if (formData.heroImgFile) {
      // Delete old hero image before uploading new one
      if (recipe.heroImg) {
        await deleteFileByPath(recipe.heroImg, 'hero-images');
      }

      const filePath = `${folder}/hero-img-${uuidv4()}`;
      const {imagePath, error: heroError} = await uploadImage({
        file: formData.heroImgFile,
        bucket: 'hero-images',
        filePath: filePath
      });

      if (heroError) {
        return {success: false, error: 'Failed to upload hero image'};
      }

      heroImgPath = imagePath;
    } else {
      // Extract path from URL if needed
      heroImgPath = extractPathFromUrl(formData.heroImg, 'hero-images');
    }

    // Process video if there's a new file


    let videoUrl = recipe.videoUrl;
    if (formData.videoFile) {
      // Delete old video before uploading new one
      if (recipe.videoUrl) {
        await deleteVideo(recipe.videoUrl);
      }

      const {videoUrl: newVideoUrl, error: videoError} = await uploadVideoToStorage({
        videoFile: formData.videoFile,
        folder: folder,
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
        description: formData.description,
        category: formData.category,
        likes: Number(formData.likes),
        ingredients,
        heroImg: heroImgPath,
        preparingTime: formData.preparingTime,
        isPremium: true as const,
        stepsCount: processedSteps.length,
        slug: formData.slug,
      };

      const premiumData: UpdateRecipeDataPremiumPart = {
        recipeId: recipe.id,
        recipeSteps: processedSteps,
        videoUrl: videoUrl,
        price: formData.price,
        discount: formData.discount > 0 ? formData.discount : null,
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
      description: formData.description,
      category: formData.category,
      likes: Number(formData.likes),
      recipeSteps: processedSteps,
      ingredients,
      heroImg: heroImgPath,
      videoUrl: videoUrl,
      preparingTime: formData.preparingTime,
      isPremium: false as const,
      stepsCount: processedSteps.length,
      slug: formData.slug,
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

  // Check description
  if (formData.description.ua !== recipe.description.ua || formData.description.en !== recipe.description.en) {
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