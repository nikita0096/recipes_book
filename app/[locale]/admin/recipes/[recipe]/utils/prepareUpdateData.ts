import {v4 as uuidv4} from "uuid";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {uploadVideoToStorage} from "@/services/storage/uploadVideoToStorage";
import {EditingValues} from "../page";
import {IRecipe} from "@/types/recipe";
import {UpdateRecipeData} from "@/services/db/updateRecipe";

export interface PrepareUpdateDataParams {
  formData: EditingValues;
  recipe: IRecipe;
  updatedHeroImg: string | null;
}

export interface PrepareUpdateDataResult {
  success: boolean;
  data?: UpdateRecipeData;
  error?: string;
}

export const prepareUpdateData = async ({
  formData,
  recipe,
  updatedHeroImg,
}: PrepareUpdateDataParams): Promise<PrepareUpdateDataResult> => {
  try {
    const folder = recipe.title.en;

    // Process steps - upload new images if needed
    const processedSteps = [];
    for (const step of formData.recipeSteps) {
      let imgUrl = step.imgUrl;

      // If there's a new image file, upload it
      if (step.imgFile) {
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

    // Process hero image if changed (starts with blob:)
    let heroImgUrl = formData.heroImg;
    if (formData.heroImg.startsWith('blob:') && updatedHeroImg) {
      heroImgUrl = recipe.heroImg;
    }

    // Process video if there's a new file
    let videoUrl = formData.videoUrl;
    if (formData.videoFile) {
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

    // Prepare data for update
    const updateData: UpdateRecipeData = {
      title: formData.title,
      category: formData.category,
      likes: Number(formData.likes),
      recipeSteps: processedSteps,
      ingredients: formData.ingredients.map(ing => ({
        id: ing.id,
        value: ing.value,
        quantity: ing.quantity,
        unit: ing.unit
      })),
      heroImg: heroImgUrl,
      videoUrl: videoUrl || undefined,
      preparingTime: formData.preparingTime,
      isPremium: formData.isPremium
    };

    return {success: true, data: updateData};
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