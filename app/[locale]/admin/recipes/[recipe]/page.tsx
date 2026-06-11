'use client';

import Image from "next/image";
import {Link} from "@/i18n/navigation";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {IRecipe, RecipePrice} from "@/types/recipe";
import LoadingPage from "@/components/ui/LoadingPage";
import {useTranslations} from "next-intl";
import {useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/admin/deleteRecipe";
import {useRouter} from "next/navigation";
import {SortableStep} from "@/components/admin";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors, TouchSensor
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete, MdDeleteForever} from "react-icons/md";
import {categories} from "@/constants/categories";
import {IoCheckmark, IoClose} from "react-icons/io5";
import {units} from "@/constants/units";
import {Ingredient, IngredientGroupFormValues, LocalizedText} from "@/types/forms";
import {SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from "uuid";
import SortableIngredient from "@/components/admin/SortableIngredient";
import SortableItem from "@/components/admin/SortableItem";
import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from "@/services/db/admin/updateRecipe";
import {prepareUpdateData} from "./utils/prepareUpdateData";
import {fetchRecipeAdmin} from "@/services/db/admin/fetchRecipeAdmin";
import {SecureVideoPlayer} from "@/components/video/SecureVideoPlayer";
import {fetchRecipePrice} from "@/services/db/public/fetchRecipePrice";
import {getPublicImageUrl} from "@/services/storage/getPublicImageUrl";

type StepFields = { desc: LocalizedText; imgUrl: string | null; imgFile: File | null; id: string }

const createEmptyDraft = () => ({ua: '', en: '', quantity: '', unit: units[0].value});

const createEmptyGroup = (): IngredientGroupFormValues => ({
  id: uuidv4(),
  title: {en: '', ua: ''},
  ingredients: [],
  draft: createEmptyDraft(),
});

type EditingSteps = {desc: LocalizedText; imgUrl: string | null; imgFile: File | null; id: string ;fieldId: string};

export interface EditingValues {
  heroImg: string;
  heroImgFile: File | null;
  category: { ua: string; en: string };
  title: { ua: string; en: string };
  description: { ua: string; en: string };
  ingredientGroups: IngredientGroupFormValues[];
  recipeSteps: StepFields[];
  price: { en: number; ua: number },
  discount: number,
  likes: number;
  videoUrl: string;
  videoFile: File | null;
  preparingTime: number;
  weight: number | null;
  diameter: number | null;
  calories: number | null;
  isPremium: boolean;
  slug: string;
}


const Page = () => {
  const params = useParams<{ recipe: string }>();

  const [recipe, setRecipe] = useState<IRecipe | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [recipePrice, setRecipePrice] = useState<RecipePrice | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stepFieldError, setStepFieldError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState<Record<string, boolean>>({});
  const [editingIngredientsData, setEditingIngredientsData] = useState<Record<string, Ingredient>>({});
  const [isEditingStep, setIsEditingStep] = useState<Record<string, boolean>>({});
  const [isVideoProcessing, setIsVideoProcessing] = useState<boolean>(false);
  const [videoProcessingProgress, setVideoProcessingProgress] = useState<number>(0);

  const locale = useTypedLocale();

  const tRecipes = useTranslations('recipes');
  const tAdmin = useTranslations('admin');
  const tCommon = useTranslations('common');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    getValues,
    watch,
    formState: {errors}
  } = useForm<EditingValues>({
    defaultValues: {
      heroImg: '',
      heroImgFile: null,
      category: {ua: '', en: ''},
      title: {ua: '', en: ''},
      description: {ua: '', en: ''},
      price: { en: 0, ua: 0 },
      discount: 0,
      ingredientGroups: [],
      recipeSteps: [],
      likes: 0,
      videoUrl: '',
      videoFile: null,
      preparingTime: 0,
      weight: null,
      diameter: null,
      calories: null,
      isPremium: false,
      slug: ''
    }
  });

  const {
    fields: groupFields,
    append: appendGroup,
    remove: removeGroup,
    move: moveGroup,
  } = useFieldArray({
    control,
    name: 'ingredientGroups',
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({
    control,
    name: 'recipeSteps',
  });

  const watchedSteps = watch('recipeSteps');
  const watchedGroups = watch('ingredientGroups');
  const mainImage = watch('heroImg');
  const isPremium = watch('isPremium');
  const isVideoChanged = watch('videoFile');
  const engTitle = watch('title.en');

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    useSensor(TouchSensor, {activationConstraint: {distance: 8}}),
  );

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRecipeAdmin(params.recipe);

        if(data.isPremium) {
          const price = await fetchRecipePrice(params.recipe);
          setRecipePrice(price);
        }

        setRecipe({
          ...data
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found');

        setRecipe(null);
        setRecipePrice(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipe]);

  useEffect(() => {
    if(!recipe || !recipe.videoUrl) return;

    // Check if this is a Cloudflare Stream video (no '/' in the key)
    const isStreamVideo = !recipe.videoUrl.includes('/');

    let pollInterval: NodeJS.Timeout | null = null;

    const checkVideoStatus = async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/stream/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoUid: recipe.videoUrl }),
        });

        if (!response.ok) {
          return false;
        }

        const { readyToStream, status } = await response.json();
        setVideoProcessingProgress(status?.pctComplete ? Math.round(status.pctComplete) : 0);
        return readyToStream;
      } catch {
        return false;
      }
    };

    const fetchVideoUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (isStreamVideo) {
          // First check if video is ready
          const isReady = await checkVideoStatus();

          if (!isReady) {
            // Video is still processing, start polling
            setIsVideoProcessing(true);
            setIsLoading(false);

            pollInterval = setInterval(async () => {
              const ready = await checkVideoStatus();
              if (ready) {
                setIsVideoProcessing(false);
                if (pollInterval) clearInterval(pollInterval);

                // Now fetch the token
                const response = await fetch('/api/stream/view-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ videoKey: recipe.videoUrl, recipeId: recipe.id }),
                });

                if (response.ok) {
                  const { token } = await response.json();
                  setVideoSrc(token);
                }
              }
            }, 3000); // Poll every 3 seconds

            return;
          }

          // Video is ready, fetch the token
          const response = await fetch('/api/stream/view-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoKey: recipe.videoUrl, recipeId: recipe.id }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to load video');
          }

          const { token } = await response.json();
          setVideoSrc(token);
        } else {
          // For legacy R2 videos, use the R2 API
          const response = await fetch('/api/video/view-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoKey: recipe.videoUrl, recipeId: recipe.id }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to load video');
          }

          const { viewUrl } = await response.json();
          setVideoSrc(viewUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoUrl();

    // Cleanup interval on unmount or when recipe changes
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [recipe?.videoUrl, recipe?.id]);


  const editingSteps: EditingSteps[] = stepFields.map((field, i) => {
    const step = watchedSteps[i];
    const imgUrl = step.imgUrl && !step.imgUrl.startsWith('blob:') && !step.imgUrl.startsWith('http')
      ? getPublicImageUrl(step.imgUrl, 'steps')
      : step.imgUrl;
    return {...step, imgUrl, fieldId: field.id};
  });


  const stepIds = isEditing
    ? editingSteps.map(step => step.fieldId)  // Use react-hook-form field IDs for drag-and-drop
    : recipe?.recipeSteps.map(step => step.id) || [];

  const generateSlug = (str: string): string => {
    if(str.trim() !== '') {
      return engTitle.trim().toLowerCase().split(' ').join('-');
    }

    return '';
  };

  useEffect(() => {
    if(engTitle.trim()) {
      const slug = generateSlug(engTitle);

      setValue('slug', slug);
    }
  }, [engTitle, generateSlug]);

  const router = useRouter();

  const queryClient = useQueryClient();

  if(!recipe) return null;

  // Translation function
  type TranslateInputs =
    | 'title.ua'
    | 'description.ua'
    | `ingredientGroups.${number}.draft.ua`
    | `ingredientGroups.${number}.title.ua`
    | `recipeSteps.${number}.desc.ua`;

  const handleTranslateText = async (flag: string, index?: number) => {
    const inputFields: Record<string, TranslateInputs> = {
      title: 'title.ua',
      description: 'description.ua',
      ...(index !== undefined && {
        ingredient: `ingredientGroups.${index}.draft.ua`,
        groupTitle: `ingredientGroups.${index}.title.ua`,
        stepDescription: `recipeSteps.${index}.desc.ua`
      })
    }

    const textUa = getValues(inputFields[flag]);

    if (!textUa) return;

    const res = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({text: textUa})
    });

    const {translated} = await res.json();

    switch (flag) {
      case 'title':
        setValue('title.en', translated);
        break;
      case 'description':
        setValue('description.en', translated);
        break;
      case 'ingredient':
        if (index !== undefined) {
          setValue(`ingredientGroups.${index}.draft.en`, translated);
        }
        break;
      case 'groupTitle':
        if (index !== undefined) {
          setValue(`ingredientGroups.${index}.title.en`, translated);
        }
        break;
      case 'stepDescription':
        if (index !== undefined) {
          setValue(`recipeSteps.${index}.desc.en`, translated);
        }
        break;
    }
  }

  const toggleEditButton = () => {
    if (recipe) {
      setValue('title', recipe.title);
      setValue('description', recipe.description);
      setValue('heroImg', recipe.heroImg);
      setValue('category', recipe.category);
      setValue('ingredientGroups', recipe.ingredients.map(group => ({...group, draft: createEmptyDraft()})));
      setValue('recipeSteps', recipe.recipeSteps.map(step => ({...step, imgFile: null})));
      setValue('likes', recipe.likes);
      setValue('videoUrl', videoSrc ?? '');
      setValue('preparingTime', recipe.preparingTime);
      setValue('weight', recipe.weight);
      setValue('diameter', recipe.diameter);
      setValue('calories', recipe.calories);
      setValue('isPremium', recipe.isPremium);
      setValue('price', recipePrice?.price || { en: 0, ua: 0 });
      setValue('discount', recipePrice?.discount || 0);
      setValue('slug', recipe.slug)
    }

    setIsEditing(true);
  }

  const cancelEditButton = () => {
    setIsEditing(false);
    setIsEditingStep({});
    setIsEditingIngredient({})
    reset();
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const result = await deleteRecipe({ id, videoKey: recipe.videoUrl });

      if (result.error) {
        setSaveError(typeof result.error === 'string' ? result.error : 'Failed to delete recipe');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["recipes"] });
      router.push(`/admin/recipes`);
    } catch (err) {
      setSaveError('Failed to delete recipe');
    }
  }

  const handleHeroImgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setValue('heroImgFile', file);
    setValue('heroImg', url);
  }

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setValue('videoFile', file);
    setValue('videoUrl', url);
  }

  const removeVideoFile = () => {
    setValue('videoFile', null);
    setValue('videoUrl', recipe?.videoUrl ?? '');
  }

  const addNewIngredient = (groupIndex: number) => {
    const draft = getValues(`ingredientGroups.${groupIndex}.draft`);
    const ingredientUa = draft.ua?.trim();
    const ingredientEn = draft.en?.trim();
    const quantity = draft.quantity?.trim();
    const unit = draft.unit;

    if (!ingredientUa || !ingredientEn || !quantity || !unit) {
      return;
    }

    const newIngredient = {
      value: {en: ingredientEn, ua: ingredientUa},
      quantity: quantity,
      unit: unit,
      id: uuidv4()
    };

    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    setValue(`ingredientGroups.${groupIndex}.ingredients`, [...ingredients, newIngredient]);
    setValue(`ingredientGroups.${groupIndex}.draft`, createEmptyDraft());
  }

  const removeIngredientFromGroup = (groupIndex: number, ingredientId: string) => {
    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    setValue(
      `ingredientGroups.${groupIndex}.ingredients`,
      ingredients.filter((ingredient) => ingredient.id !== ingredientId)
    );
  }

  const startEditingIngredient = (ingredient: Ingredient) => {
    setIsEditingIngredient(prev => ({
      ...prev,
      [ingredient.id]: true
    }))

    setEditingIngredientsData(prev => ({
      ...prev,
      [ingredient.id]: {...ingredient},
    }));
  }

  const cancelIngredientsEditing = (id: string) => {
    setIsEditingIngredient(prev => (
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== id)
      )
    ))
  }

  const handleIngredientChange = (id: string, name: string, value: string) => {
    if (name === 'quantity' || name === 'unit') {
      setEditingIngredientsData(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [name]: value,
        }
      }))
    } else {
      const locale = name.split('.')[1];
      setEditingIngredientsData(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          value: {
            ...prev[id].value,
            [locale]: value,
          },
        }
      }))
    }
  }

  const saveIngredientsChanges = (id: string) => {
    const updatedIngredient = {...editingIngredientsData[id]}

    const groups = getValues('ingredientGroups');
    groups.forEach((group, groupIndex) => {
      const index = group.ingredients.findIndex(item => item.id === id);
      if (index !== -1) {
        const ingredients = [...group.ingredients];
        ingredients[index] = updatedIngredient;
        setValue(`ingredientGroups.${groupIndex}.ingredients`, ingredients);
      }
    });

    cancelIngredientsEditing(id);
  }

  const startEditingStep = (stepId: string) => {
    setIsEditingStep(prev => ({
      ...prev,
      [stepId]: true
    }));
  };

  const addNewStep = () => {
    const newId = uuidv4();
    startEditingStep(newId);
    const newStep = {desc: {en: '', ua: ''}, imgUrl: null, imgFile: null, id: newId};
    appendStep(newStep);
  };

  const handleCloseStepEditing = (id: string) => {
    setIsEditingStep(prev =>
      Object.fromEntries(
        Object.entries(prev).filter(([key]) => key !== id)
      )
    );
  }

  const cancelStepEditing = (id: string) => {
    handleCloseStepEditing(id);
  };

  const handleStepChange = (id: string, field: 'ua' | 'en', value: string) => {
    const index = watchedSteps.findIndex(item => item.id === id);
    if (index === -1) return;

    setValue(`recipeSteps.${index}.desc.${field}`, value);
  };

  const handleStepImageChange = (id: string, file: File) => {
    const index = watchedSteps.findIndex(item => item.id === id);
    if (index === -1) return;

    const previewUrl = URL.createObjectURL(file);
    setValue(`recipeSteps.${index}.imgUrl`, previewUrl);
    setValue(`recipeSteps.${index}.imgFile`, file);
  };

  const deleteStepImage = (id: string) => {
    const index = watchedSteps.findIndex(item => item.id === id);
    if (index === -1) return;

    setValue(`recipeSteps.${index}.imgUrl`, null);
    setValue(`recipeSteps.${index}.imgFile`, null);
  };

  const saveStepChanges = (id: string, i: number) => {
    if(stepFields[i].desc.en && stepFields[i].desc.ua) {
      handleCloseStepEditing(id);
      setStepFieldError(null);
    } else setStepFieldError(locale === 'ua' ? "Додайте хоча б опис" : "Add at least description");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stepFields.findIndex((step) => step.id === active.id);
    const newIndex = stepFields.findIndex((step) => step.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    moveStep(oldIndex, newIndex);
  };

  const handleIngredientDragEnd = (event: DragEndEvent, groupIndex: number) => {
    if (!isEditing) return;
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    const oldIndex = ingredients.findIndex((item) => item.id === active.id);
    const newIndex = ingredients.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setValue(`ingredientGroups.${groupIndex}.ingredients`, arrayMove(ingredients, oldIndex, newIndex));
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    if (!isEditing) return;
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const groups = getValues('ingredientGroups');
    const oldIndex = groups.findIndex((group) => group.id === active.id);
    const newIndex = groups.findIndex((group) => group.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    moveGroup(oldIndex, newIndex);
  };


  if (isLoading) {
    return <LoadingPage/>;
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-base mb-4">{error || tCommon('errors.recipeNotFound')}</p>
          <Link href="/admin/recipes" className="text-sm text-muted hover:text-text">
            ← {tRecipes("singlePage.backButton")}
          </Link>
        </div>
      </div>
    );
  }

  const onSaveChanges: SubmitHandler<EditingValues> = async (formData) => {
    if (!recipe) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await prepareUpdateData({
        formData,
        recipe,
      });

      if (!result.success) {
        setSaveError(result.error || 'Failed to prepare data');
        setIsSaving(false);
        return;
      }

      if (result.isPremium && result.wasPremium) {
        const premiumResult = result as import('./utils/prepareUpdateData').PrepareUpdateDataResultPremium;
        const {data, error: updateError} = await updateRecipePremium(
          premiumResult.mainData,
          premiumResult.premiumData,
          recipe.id
        );

        if (updateError || !data) {
          setSaveError(updateError || 'Failed to update recipe');
          setIsSaving(false);
          return;
        }

        setRecipe(data.newRecipe);
        setRecipePrice(data.newPrice);

      } else if (result.isPremium && !result.wasPremium) {
        const premiumResult = result as import('./utils/prepareUpdateData').PrepareUpdateDataResultPremium;
        const {data, error: updateError} = await convertPublicToPremium(
          premiumResult.mainData,
          premiumResult.premiumData,
          recipe.id
        );

        if (updateError || !data) {
          setSaveError(updateError || 'Failed to convert to premium');
          setIsSaving(false);
          return;
        }

        setRecipe(data.newRecipe);
        setRecipePrice(data.newPrice);

      } else if (!result.isPremium && result.wasPremium) {
        const publicResult = result as import('./utils/prepareUpdateData').PrepareUpdateDataResultPublic;
        const {data, error: updateError} = await convertPremiumToPublic(
          publicResult.data,
          recipe.id
        );

        if (updateError || !data) {
          setSaveError(updateError || 'Failed to convert to public');
          setIsSaving(false);
          return;
        }

        setRecipe(data);
        setRecipePrice(null);

      } else {
        const publicResult = result as import('./utils/prepareUpdateData').PrepareUpdateDataResultPublic;
        const {data, error: updateError} = await updateRecipePublic(
          publicResult.data,
          recipe.id
        );

        if (updateError || !data) {
          setSaveError(updateError || 'Failed to update recipe');
          setIsSaving(false);
          return;
        }

        setRecipe(data);
        setRecipePrice(null);
      }


      setIsEditing(false);
      setIsEditingStep({});
      setIsEditingIngredient({});
      setSaveError(null);

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative h-[280px] sm:h-[360px] lg:h-[480px] w-full">
        <Image
          src={mainImage === '' ? recipe.heroImg : mainImage}
          alt={recipe.title[locale]}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/[0.88] via-black/[0.1] to-transparent pointer-events-none"/>

        {/* Back link */}
        <Link
          href="/admin/recipes"
          className="absolute top-4 left-4 sm:left-6 lg:left-10 text-sm text-white/70 tracking-wide hover:text-white/90 transition-colors z-10"
        >
          ← {tRecipes('singlePage.backButton')}
        </Link>

        {/* Action buttons */}
        <div className='absolute top-4 right-4 sm:right-6 lg:right-10 flex items-center gap-3 z-10'>
          {isEditing ? (
            <>
              <button
                className='px-4 py-2 bg-green-500/90 hover:bg-green-600 text-white text-sm tracking-wide transition-colors disabled:opacity-50'
                onClick={handleSubmit(onSaveChanges)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : tAdmin('list.save')}
              </button>
              <button
                className='px-4 py-2 bg-red-500/90 hover:bg-red-400/80 text-white text-sm tracking-wide transition-colors disabled:opacity-50'
                onClick={cancelEditButton}
                disabled={isSaving}
              >
                {tAdmin('list.cancel')}
              </button>
            </>
          ) : (
            <>
              <button
                className='px-4 py-2 bg-green-400/90 hover:bg-green-600/80 text-white text-sm tracking-wide transition-colors'
                onClick={toggleEditButton}
              >
                <CiEdit className="inline-block mr-1.5 text-lg"/> {tAdmin('list.edit')}
              </button>
              <button
                className='px-4 py-2 bg-red-500/90 hover:bg-red-600 text-white text-sm tracking-wide transition-colors'
                onClick={() => handleDeleteRecipe(recipe.id)}
              >
                <MdDelete className="inline-block mr-1.5 text-lg"/> {tAdmin('list.delete')}
              </button>
            </>
          )}
        </div>

        {/* Hero image upload button */}
        {isEditing && (
          <label className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer px-5 py-3 bg-white/20 hover:bg-white/30 text-white text-sm tracking-wide transition-colors'>
            <CiEdit className="inline-block mr-1.5 text-lg"/> {tAdmin('list.update')} Image
            <input
              onChange={(e) => handleHeroImgFile(e)}
              type="file"
              hidden
              multiple={false}
              accept="image/*"
            />
          </label>
        )}

        {/* Hero content */}
        <div className="absolute bottom-6 left-4 sm:left-6 lg:left-10 right-4 sm:right-6 lg:right-10">
          {/* Category */}
          {isEditing ? (
            <select
              value={watch('category')?.en || ''}
              onChange={(e) => {
                const selected = categories.find(cat => cat.en === e.target.value);
                if (selected) {
                  setValue('category', selected);
                }
              }}
              className="inline-block text-xs tracking-widest uppercase text-accent border border-accent px-3 py-1 mb-3 bg-bg/80 focus:outline-none cursor-pointer"
            >
              {categories.filter(cat => cat.en !== 'All recipes').map((category) => (
                <option key={category.en} value={category.en}>
                  {category[locale]}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-block text-xs tracking-widest uppercase text-accent border border-accent px-3 py-1 mb-3 bg-bg/40">
              {recipe.category[locale]}
            </span>
          )}

          {/* Title - View mode */}
          {!isEditing && (
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-5xl italic font-normal text-white leading-tight mb-3">
              {recipe.title[locale]}
            </h1>
          )}

          {/* Stats - simplified in hero */}
          <div className="flex gap-5 flex-wrap">
            {isEditing ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">♡</span>
                  <input
                    {...register('likes')}
                    type="number"
                    className="w-16 px-2 py-1 text-sm text-white bg-white/20 border border-white/30 focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Premium:</span>
                  <input
                    type="checkbox"
                    {...register('isPremium')}
                    className="w-4 h-4 accent-accent"
                  />
                </div>
              </>
            ) : (
              <>
                <span className="text-sm text-white/60">
                  ♡ {recipe.likes}
                </span>
                {recipe.isPremium && (
                  <>
                    <span className="text-sm text-accent font-medium">
                      Premium
                    </span>
                    {recipePrice && (
                      <span className="text-sm text-white/80">
                        {recipePrice.discount && recipePrice.discount > 0 ? (
                          <>
                            <div className="line-through text-white/40 mr-1.5 flex gap-2">
                              <span>${recipePrice.price.en}</span>
                              /
                              <span>{recipePrice.price.ua}₴</span>
                            </div>
                            <div className="text-accent font-medium flex gap-2">
                              <span>${(recipePrice.price.en * (1 - recipePrice.discount / 100)).toFixed(2)}</span>
                              /
                              <span>{(recipePrice.price.ua * (1 - recipePrice.discount / 100)).toFixed(2)}₴</span>
                            </div>
                            <span className="ml-1.5 text-xs text-green-400">-{recipePrice.discount}%</span>
                          </>
                        ) : (
                          <div className="text-accent font-medium flex gap-2">
                            <span>${recipePrice.price.en}</span>
                            /
                            <span>{recipePrice.price.ua}₴</span>
                          </div>
                        )}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Recipe Meta Section */}
      <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-5 sm:py-6 lg:py-8">
        {isEditing ? (
          /* Edit mode - input fields in grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border border border-border">
            {/* Time */}
            <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>◷</span>
              <div className="flex items-baseline gap-2">
                <input
                  {...register('preparingTime', {required: true, min: 1, max: 1000, valueAsNumber: true})}
                  type="number"
                  className="w-20 px-2 py-1 font-serif text-xl sm:text-2xl lg:text-3xl text-text bg-surface border border-border focus:outline-none focus:border-accent"
                />
                <span className="font-sans text-sm sm:text-base text-muted">{tRecipes('singlePage.meta.minUnit')}</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{tRecipes('singlePage.meta.time')}</div>
            </div>

            {/* Steps (display only, calculated) */}
            <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>☰</span>
              <div className="font-serif text-xl sm:text-2xl lg:text-3xl text-text leading-none">
                {stepFields.length} <span className="font-sans text-sm sm:text-base text-muted">{stepFields.length === 1 ? tRecipes('singlePage.meta.stepUnit') : tRecipes('singlePage.meta.stepsUnit')}</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{tRecipes('singlePage.meta.preparation')}</div>
            </div>

            {/* Weight */}
            <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>⚖︎</span>
              <div className="flex items-baseline gap-2">
                <input
                  {...register('weight', {min: 0, valueAsNumber: true})}
                  type="number"
                  placeholder="—"
                  className="w-20 px-2 py-1 font-serif text-xl sm:text-2xl lg:text-3xl text-text bg-surface border border-border focus:outline-none focus:border-accent"
                />
                <span className="font-sans text-sm sm:text-base text-muted">{tRecipes('singlePage.meta.gramUnit')}</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{tRecipes('singlePage.meta.weight')}</div>
            </div>

            {/* Diameter */}
            <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>⌀</span>
              <div className="flex items-baseline gap-2">
                <input
                  {...register('diameter', {min: 0, valueAsNumber: true})}
                  type="number"
                  placeholder="—"
                  className="w-20 px-2 py-1 font-serif text-xl sm:text-2xl lg:text-3xl text-text bg-surface border border-border focus:outline-none focus:border-accent"
                />
                <span className="font-sans text-sm sm:text-base text-muted">{tRecipes('singlePage.meta.cmUnit')}</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{tRecipes('singlePage.meta.diameter')}</div>
            </div>

            {/* Calories */}
            <div className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
              <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>◉</span>
              <div className="flex items-baseline gap-2">
                <input
                  {...register('calories', {min: 0, valueAsNumber: true})}
                  type="number"
                  placeholder="—"
                  className="w-20 px-2 py-1 font-serif text-xl sm:text-2xl lg:text-3xl text-text bg-surface border border-border focus:outline-none focus:border-accent"
                />
                <span className="font-sans text-sm sm:text-base text-muted">{tRecipes('singlePage.meta.kcalUnit')}</span>
              </div>
              <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{tRecipes('singlePage.meta.perServing')}</div>
            </div>
          </div>
        ) : (
          /* View mode - display cards like RecipeMeta */
          (() => {
            const metaCards: Array<{icon: string; value: number; unit: string; label: string}> = [
              {
                icon: '◷',
                value: recipe.preparingTime,
                unit: tRecipes('singlePage.meta.minUnit'),
                label: tRecipes('singlePage.meta.time'),
              },
              {
                icon: '☰',
                value: recipe.stepsCount,
                unit: recipe.stepsCount === 1 ? tRecipes('singlePage.meta.stepUnit') : tRecipes('singlePage.meta.stepsUnit'),
                label: tRecipes('singlePage.meta.preparation'),
              },
            ];

            if (recipe.weight) {
              metaCards.push({
                icon: '⚖︎',
                value: recipe.weight,
                unit: tRecipes('singlePage.meta.gramUnit'),
                label: tRecipes('singlePage.meta.weight'),
              });
            }

            if (recipe.diameter) {
              metaCards.push({
                icon: '⌀',
                value: recipe.diameter,
                unit: tRecipes('singlePage.meta.cmUnit'),
                label: tRecipes('singlePage.meta.diameter'),
              });
            }

            if (recipe.calories) {
              metaCards.push({
                icon: '◉',
                value: recipe.calories,
                unit: tRecipes('singlePage.meta.kcalUnit'),
                label: tRecipes('singlePage.meta.perServing'),
              });
            }

            const gridColsClass = metaCards.length <= 2
              ? 'grid-cols-2'
              : metaCards.length === 3
                ? 'grid-cols-2 sm:grid-cols-3'
                : metaCards.length === 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

            return (
              <div className={`grid ${gridColsClass} gap-px bg-border border border-border`}>
                {metaCards.map((card, index) => (
                  <div key={index} className="bg-bg p-4 sm:p-5 lg:p-6 flex flex-col gap-2 sm:gap-2.5">
                    <span className="text-base text-accent leading-none" style={{ fontFamily: 'sans-serif' }}>{card.icon}</span>
                    <div className="font-serif text-xl sm:text-2xl lg:text-3xl text-text leading-none">
                      {card.value} <span className="font-sans text-sm sm:text-base text-muted">{card.unit}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs tracking-widest uppercase text-muted">{card.label}</div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </section>

      {/* Title, Price, Description Section (Edit Mode) */}
      {isEditing && (
        <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7 lg:py-8">
          {/*price*/}
          {isPremium && (
            <div className='mb-6'>
              <h2 className="text-sm tracking-widest uppercase text-accent mb-4">
                {tAdmin('form.fields.price')}
              </h2>
              <div className="mt-3.5">
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {tAdmin('form.fields.price')} (USD)
                </label>
                <div className="relative">
                  <input {...register('price.en', {required: true, min: 1, max: 10000, valueAsNumber: true})}
                         name="price.en"
                         aria-invalid={errors.price?.en ? "true" : "false"}
                         className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">$</span>
                </div>
              </div>
              <div className="mt-3.5">
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {tAdmin('form.fields.price')} (UAH)
                </label>
                <div className="relative">
                  <input {...register('price.ua', {required: false, min: 1, max: 100000, valueAsNumber: true})}
                         name="price.ua"
                         aria-invalid={errors.price?.ua ? "true" : "false"}
                         className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">₴</span>
                </div>
              </div>
              <div className="mt-3.5">
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {tAdmin('form.fields.discount')}
                </label>
                <div className="relative">
                  <input {...register('discount', {required: false, min: 0, max: 100})}
                         name="discount"
                         className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">%</span>
                </div>
              </div>
            </div>
          )}
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-sm tracking-widest uppercase text-accent mb-4">
              {tAdmin('form.fields.title')}
            </h2>
            <div className="space-y-3 max-w-2xl">
              <input
                type="text"
                {...register('title.ua')}
                placeholder={tAdmin('form.fields.titlePlaceholderUa')}
                className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => handleTranslateText('title')}
                className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
              >
                Translate to English →
              </button>
              <input
                type="text"
                {...register('title.en')}
                placeholder={tAdmin('form.fields.titlePlaceholderEn')}
                className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/*Slug*/}
          <div className="mb-6">
            <h2 className="text-sm tracking-widest uppercase text-accent mb-4">
              URL Slug
            </h2>
            <input {...register('slug', {required: true})}
                   className="w-full px-3.5 py-2.5 max-w-2xl bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                   type="text"
                   placeholder='URL slug'/>
          </div>
          {/* Description */}
          <div>
            <h2 className="text-sm tracking-widest uppercase text-accent mb-4">
              {tAdmin('form.fields.description')}
            </h2>
            <div className="space-y-3 max-w-2xl">
              <textarea
                cols={5}
                {...register('description.ua')}
                placeholder={tAdmin('form.fields.descriptionPlaceholderUa')}
                className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
              />
              <button
                type="button"
                onClick={() => handleTranslateText('description')}
                className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
              >
                Translate to English →
              </button>
              <textarea
                {...register('description.en')}
                placeholder={tAdmin('form.fields.descriptionPlaceholderEn')}
                className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* Description Section (View Mode) */}
      {!isEditing && recipe.description && recipe.description[locale] && (
        <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7 lg:py-8">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {tRecipes('singlePage.description')}
          </h2>
          <p className="text-base text-text leading-relaxed">
            {recipe.description[locale]}
          </p>
        </section>
      )}

      {/* Key Ingredients Section */}
      <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7 lg:py-8">
        <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
          {tRecipes('singlePage.keyIngredients')}
        </h2>

        {!isEditing ? (
          <div className="space-y-6">
            {recipe.ingredients.map((group) => (
              <div key={group.id}>
                {group.title[locale] && (
                  <h3 className="font-serif text-lg italic text-text mb-3">
                    {group.title[locale]}
                  </h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
                  {group.ingredients.map((ingredient) => (
                    <div
                      key={ingredient.id}
                      className="relative bg-bg p-3 sm:p-4 flex justify-between items-start gap-3"
                    >
                      <span className="text-sm sm:text-base text-text">
                        {ingredient.value[locale]}
                      </span>
                      <span className="text-sm text-accent font-medium whitespace-nowrap">
                        {ingredient.quantity} {units.find((u) => u.value === ingredient.unit)?.label[locale]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DndContext
            id="ingredient-groups"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext items={watchedGroups.map(group => group.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {groupFields.map((groupField, groupIndex) => {
                  const group = watchedGroups[groupIndex];
                  if (!group) return null;

                  return (
                    <SortableItem
                      key={groupField.id}
                      itemId={group.id}
                      className="border border-border p-4 sm:p-5 bg-surface"
                    >
                      {(dragHandle) => (
                        <>
                          {/* Group header */}
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2 min-w-0">
                              {dragHandle}
                              <span className="text-sm text-muted italic truncate">
                                {group.title[locale] || `${tAdmin('form.fields.group')} ${groupIndex + 1}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="p-1 text-muted hover:text-red-500 transition-colors"
                              onClick={() => removeGroup(groupIndex)}
                            >
                              <MdDeleteForever className="text-lg"/>
                            </button>
                          </div>

                          {/* Group title inputs */}
                          <div className="space-y-3 mb-5 max-w-2xl">
                            <input
                              {...register(`ingredientGroups.${groupIndex}.title.ua`)}
                              className="w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                              type="text"
                              placeholder={tAdmin('form.fields.groupTitlePlaceholderUa')}
                            />
                            <button
                              type="button"
                              onClick={() => handleTranslateText('groupTitle', groupIndex)}
                              className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
                            >
                              Translate to English →
                            </button>
                            <input
                              {...register(`ingredientGroups.${groupIndex}.title.en`)}
                              className="w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                              type="text"
                              placeholder={tAdmin('form.fields.groupTitlePlaceholderEn')}
                            />
                          </div>

                          <DndContext
                            id={`group-ingredients-${groupIndex}`}
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleIngredientDragEnd(e, groupIndex)}
                          >
                            <SortableContext items={group.ingredients.map(ingredient => ingredient.id)}>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
                                {group.ingredients.map((ingredient, i) => (
                                  <div key={ingredient.id}>
                                    {isEditingIngredient[ingredient.id] ? (
                                      <div className="bg-surface p-3 sm:p-4 space-y-2">
                                        <div className="space-y-2">
                                          <input
                                            type="text"
                                            name='value.ua'
                                            onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                            value={editingIngredientsData[ingredient.id].value.ua}
                                            placeholder="UA"
                                            className="w-full px-2 py-1.5 text-sm bg-bg border border-border focus:outline-none focus:border-accent"
                                          />
                                          <input
                                            type="text"
                                            name='value.en'
                                            onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                            value={editingIngredientsData[ingredient.id].value.en}
                                            placeholder="EN"
                                            className="w-full px-2 py-1.5 text-sm bg-bg border border-border focus:outline-none focus:border-accent"
                                          />
                                          <div className="flex gap-1">
                                            <input
                                              type="text"
                                              name='quantity'
                                              onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                              value={editingIngredientsData[ingredient.id].quantity}
                                              placeholder="Qty"
                                              className="w-12 px-2 py-1.5 text-sm bg-bg border border-border focus:outline-none focus:border-accent"
                                            />
                                            <select
                                              name='unit'
                                              onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                              value={editingIngredientsData[ingredient.id].unit}
                                              className="flex-1 px-1 py-1.5 text-xs bg-bg border border-border focus:outline-none focus:border-accent"
                                            >
                                              {units.map((u) => (
                                                <option key={u.value} value={u.value}>{u.label[locale]}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                          <button
                                            onClick={() => saveIngredientsChanges(ingredient.id)}
                                            className="p-1.5 bg-green-500 text-white hover:bg-green-600 transition-colors"
                                          >
                                            <IoCheckmark className="text-sm"/>
                                          </button>
                                          <button
                                            onClick={() => cancelIngredientsEditing(ingredient.id)}
                                            className="p-1.5 bg-red-500 text-white hover:bg-red-600 transition-colors"
                                          >
                                            <IoClose className="text-sm"/>
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <SortableIngredient
                                        key={ingredient.id}
                                        ingredient={ingredient}
                                        ingredientId={ingredient.id}
                                        index={i}
                                        isEditing={isEditing}
                                        startEditingIngredient={startEditingIngredient}
                                        removeIngredient={() => removeIngredientFromGroup(groupIndex, ingredient.id)}
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>

                          {/* Add new ingredient form */}
                          <div className="mt-6 p-4 sm:p-5 bg-bg border border-border">
                            <h3 className="text-sm tracking-widest uppercase text-muted mb-4">{tAdmin('form.sections.addIngredient')}</h3>
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3">
                                <input
                                  {...register(`ingredientGroups.${groupIndex}.draft.ua`)}
                                  className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                                  type="text"
                                  placeholder={tAdmin('form.fields.ingredientPlaceholderUa')}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleTranslateText('ingredient', groupIndex)}
                                  className="self-start px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-surface transition-colors"
                                >
                                  Translate to EN →
                                </button>
                                <input
                                  {...register(`ingredientGroups.${groupIndex}.draft.en`)}
                                  className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                                  type="text"
                                  placeholder={tAdmin('form.fields.ingredientPlaceholderEn')}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                                <div>
                                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">{tAdmin('form.fields.quantity')}</label>
                                  <input
                                    {...register(`ingredientGroups.${groupIndex}.draft.quantity`)}
                                    className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                                    type="text"
                                    placeholder={tAdmin('form.fields.quantity')}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">Unit</label>
                                  <select
                                    {...register(`ingredientGroups.${groupIndex}.draft.unit`)}
                                    className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                  >
                                    {units.map((unit) => (
                                      <option key={unit.value} value={unit.value}>
                                        {unit.label.ua} / {unit.label.en}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  className="px-4 py-2.5 bg-text text-bg text-[11px] tracking-[0.06em] uppercase whitespace-nowrap hover:opacity-90 transition-opacity"
                                  onClick={() => addNewIngredient(groupIndex)}
                                >
                                  + {tAdmin('form.buttons.add')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </SortableItem>
                  );
                })}

                {/* Add new group button */}
                <button
                  className="w-full py-5 border border-dashed border-border flex items-center justify-center gap-2.5 text-[11px] tracking-[0.06em] text-accent hover:bg-surface transition-colors"
                  type="button"
                  onClick={() => appendGroup(createEmptyGroup())}
                >
                  + {tAdmin('form.buttons.addGroup')}
                </button>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Preparation Steps Section */}
      <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8">
        <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
          {tRecipes('singlePage.preparationSteps')}
        </h2>

        {isEditing ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-px bg-border">
                {editingSteps.map((step, i) => (
                  <div key={step.fieldId} className="bg-bg">
                    {isEditingStep[step.id] ? (
                    // Edit mode for step
                    <div className=" p-4 sm:p-5 lg:p-6 border border-accent">

                      {/* Step image */}
                      <div className="w-full">
                        {step.imgUrl ? (
                          <div className="relative w-full mb-4">
                            <div className="relative w-full aspect-video">
                              <Image
                                src={step.imgUrl}
                                alt={`Step ${i + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteStepImage(step.id)}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              <MdDeleteForever className="text-lg"/>
                            </button>
                            <label className="absolute bottom-2 right-2 cursor-pointer px-3 py-1.5 bg-white/80 text-accent text-xs tracking-wide hover:bg-white transition-colors">
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleStepImageChange(step.id, file);
                                }}
                              />
                              {tAdmin('form.buttons.changeImage')}
                            </label>
                          </div>
                        ) : (
                          <div className="w-full py-8 flex items-center justify-center border border-dashed border-border">
                            <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleStepImageChange(step.id, file);
                                }}
                              />
                              {tAdmin('form.buttons.addPicture')}
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Step description with translation */}
                      <div>
                        <div className="space-y-3 p-3">
                          <div>
                            <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                              {tAdmin('form.fields.descriptionUa')}
                            </label>
                            <textarea
                              value={typeof step.desc === 'string' ? '' : step.desc.ua}
                              onChange={(e) => handleStepChange(step.id, 'ua', e.target.value)}
                              rows={3}
                              required={true}
                              className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTranslateText('stepDescription', i)}
                            className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-surface transition-colors"
                          >
                            Translate to English →
                          </button>
                          <div>
                            <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                              {tAdmin('form.fields.descriptionEn')}
                            </label>
                            <textarea
                              value={typeof step.desc === 'string' ? '' : step.desc.en}
                              onChange={(e) => handleStepChange(step.id, 'en', e.target.value)}
                              rows={3}
                              required={true}
                              className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {stepFieldError && (
                        <div className='flex items-center justify-center'>
                          <p className='text-center text-xs bg-red-400 text-white px-3 py-1'>{stepFieldError}</p>
                        </div>
                      )}

                      <div className="flex gap-5 justify-end mt-4 col-span-2 place-self-center">
                        <button
                          onClick={() => saveStepChanges(step.id, i)}
                          className="p-2 bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <IoCheckmark className="text-lg"/>
                        </button>
                        <button
                          onClick={() => cancelStepEditing(step.id)}
                          className="p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <IoClose className="text-lg"/>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode for step (using SortableStep for drag)
                      <SortableStep
                        step={step}
                        stepId={step.fieldId}
                        index={i}
                        isEditing={isEditing}
                        onEdit={() => startEditingStep(step.id)}
                        onRemove={() => removeStep(i)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="flex flex-col gap-px bg-border">
            {recipe?.recipeSteps.map((step, i) => {
              const imgUrl = step.imgUrl && !step.imgUrl.startsWith('http')
                ? getPublicImageUrl(step.imgUrl, 'steps')
                : step.imgUrl;
              return (
                <div key={step.id} className="bg-bg">
                  <SortableStep
                    step={{...step, imgUrl}}
                    stepId={step.id}
                    index={i}
                    isEditing={false}
                    onEdit={() => {}}
                    onRemove={() => {}}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Add new step button */}
        {isEditing && (
          <button
            className={`mt-4 w-full py-5 border border-dashed ${error && stepFields.length === 0 ? 'border-red-400' : 'border-border'} flex items-center justify-center gap-2.5 text-[11px] tracking-[0.06em] text-accent hover:bg-surface transition-colors`}
            type="button"
            onClick={addNewStep}
          >
            + {tAdmin('form.buttons.addNewStep')}
          </button>
        )}
      </section>

      {/* Video Tutorial Section */}
      <section className="border-t border-border mt-6 sm:mt-7 lg:mt-8 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8 pb-10 sm:pb-12 lg:pb-14">
        <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
          {tRecipes('singlePage.videoSection')}
        </h2>

        {isEditing ? (
          <div className="relative bg-surface border border-border overflow-hidden">
            {watch('videoUrl') ? (
              <>
                {/* For new files (blob URLs), use regular video element */}
                {/* For existing videos, use SecureVideoPlayer */}
                {watch('videoUrl').startsWith('blob:') ? (
                  <video
                    className="w-full h-full object-contain"
                    src={watch('videoUrl')}
                    controls
                  />
                ) : recipe?.videoUrl ? (
                  <SecureVideoPlayer
                    recipeId={recipe.id}
                    videoKey={recipe.videoUrl}
                    className="w-full h-full"
                    thumbnail={recipe.heroImg}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={removeVideoFile}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white hover:bg-red-600 transition-colors z-10"
                >
                  <MdDeleteForever className="text-lg"/>
                </button>
                <label className="absolute bottom-2 right-2 cursor-pointer px-3 py-1.5 bg-white/80 text-accent text-xs tracking-wide hover:bg-white transition-colors z-10">
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={handleVideoFile}
                  />
                  {tAdmin('form.buttons.changeVideo')}
                </label>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3.5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={handleVideoFile}
                  />
                  + {tAdmin('form.buttons.addVideo')}
                </label>
              </div>
            )}
          </div>
        ) : isVideoProcessing ? (
          <div className="relative aspect-video bg-surface border border-border overflow-hidden flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
            <div className="text-center">
              <p className="text-sm text-text mb-2">{tCommon('video.processing')}</p>
              {videoProcessingProgress > 0 && (
                <p className="text-xs text-muted">{videoProcessingProgress}%</p>
              )}
            </div>
          </div>
        ) : recipe?.videoUrl ? (
          <div className="relative bg-[#0d0d0a] overflow-hidden">
            <SecureVideoPlayer
              recipeId={recipe.id}
              videoKey={recipe.videoUrl}
              className="w-full h-full"
              thumbnail={recipe.heroImg}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-muted">
            {tAdmin('form.fields.noVideo')}
          </div>
        )}
      </section>

      {/* Save error message */}
      {saveError && (
        <div className="fixed bottom-4 right-4 px-4 py-3 bg-red-500 text-white text-sm">
          {saveError}
        </div>
      )}

      {/* Back link */}
      <div className='flex items-center justify-center pb-10'>
        <Link
          href="/admin/recipes"
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← {tRecipes('singlePage.backButton')}
        </Link>
      </div>
    </div>
  );
};

export default Page;