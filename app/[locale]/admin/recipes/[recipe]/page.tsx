'use client';

import Image from "next/image";
import {Link} from "@/i18n/navigation";
import React, {useEffect, useMemo, useState} from "react";
import {useParams} from "next/navigation";
import {IRecipe} from "@/types/recipe";
import LoadingPage from "@/components/ui/LoadingPage";
import {useTranslations} from "next-intl";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/deleteRecipe";
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete, MdDeleteForever} from "react-icons/md";
import {categories} from "@/constants/categories";
import {IoCheckmark, IoClose} from "react-icons/io5";
import {units} from "@/constants/units";
import {Ingredient, LocalizedText, UnitValue} from "@/types/forms";
import {SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from "uuid";
import SortableIngredient from "@/components/admin/SortableIngredient";
import {
  updateRecipePublic,
  updateRecipePremium,
  convertPublicToPremium,
  convertPremiumToPublic,
} from "@/services/db/updateRecipe";
import {prepareUpdateData} from "./utils/prepareUpdateData";
import {fetchRecipeAdmin} from "@/services/db/fetchRecipeAdmin";
import {SecureVideoPlayer} from "@/components/video/SecureVideoPlayer";

type StepFields = { desc: LocalizedText; imgUrl: string | null; imgFile: File | null; id: string }

export interface EditingValues {
  heroImg: string;
  heroImgFile: File | null;
  category: { ua: string; en: string };
  title: { ua: string; en: string };
  ingredients: Ingredient[];
  recipeSteps: StepFields[];
  likes: number;
  ingredientEn: string;
  ingredientUa: string;
  ingredientQuantity: string | null;
  ingredientUnit: UnitValue;
  videoUrl: string;
  videoFile: File | null;
  preparingTime: number;
  isPremium: boolean;
}


const Page = () => {
  const params = useParams<{ recipe: string }>();

  const [recipe, setRecipe] = useState<IRecipe | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isEditingIngredient, setIsEditingIngredient] = useState<Record<string, boolean>>({});
  const [editingIngredientsData, setEditingIngredientsData] = useState<Record<string, Ingredient>>({});
  const [isEditingStep, setIsEditingStep] = useState<Record<string, boolean>>({});
  const [prevStepChanges, setPrevStepChanges] = useState<Record<string, StepFields[]>>({});

  const [updatedHeroImg, setUpdateHeroImg] = useState<string | null>(null);

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
    resetField,
    getValues,
    watch,
    formState: {errors}
  } = useForm<EditingValues>({
    defaultValues: {
      heroImg: '',
      heroImgFile: null,
      category: {ua: '', en: ''},
      title: {ua: '', en: ''},
      ingredients: [],
      recipeSteps: [],
      likes: 0,
      ingredientEn: '',
      ingredientUa: '',
      ingredientQuantity: '',
      ingredientUnit: units[0].value,
      videoUrl: '',
      videoFile: null,
      preparingTime: 0,
      isPremium: false
    }
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
    move: moveIngredient,
    update: updateIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
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

        setRecipe({
          ...data
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipe]);

  const router = useRouter();

  const queryClient = useQueryClient();

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,

    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ["recipes"]});
    }
  });

  const toggleEditButton = () => {
    if (recipe) {
      setValue('title', recipe.title);
      setValue('heroImg', recipe.heroImg);
      setValue('category', recipe.category);
      setValue('ingredients', recipe.ingredients);
      setValue('recipeSteps', recipe.recipeSteps.map(step => ({...step, imgFile: null})));
      setValue('likes', recipe.likes);
      setValue('videoUrl', recipe.videoUrl ?? '');
      setValue('preparingTime', recipe.preparingTime);
      setValue('isPremium', recipe.isPremium);
    }

    setIsEditing(true);
  }

  const cancelEditButton = () => {
    setIsEditing(false);
    setUpdateHeroImg(null);
    setIsEditingStep({});
    setIsEditingIngredient({})
    reset();
  }

  const handleDeleteRecipe = (id: string) => {
    deleteRecipeMutation.mutate(id);

    router.push(`/admin/recipes`);
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

  const addNewIngredient = () => {
    const ingredientUa = getValues('ingredientUa')?.trim();
    const ingredientEn = getValues('ingredientEn')?.trim();
    const quantity = getValues('ingredientQuantity')?.trim();
    const unit = getValues('ingredientUnit');

    if (!ingredientUa || !ingredientEn || !quantity || !unit) {
      return;
    }

    const newIngredient = {
      value: {en: ingredientEn, ua: ingredientUa},
      quantity: quantity,
      unit: unit,
      id: uuidv4()
    };

    appendIngredient(newIngredient);

    resetField('ingredientUa');
    resetField('ingredientEn');
    resetField('ingredientQuantity');
    resetField('ingredientUnit');
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

    const index = ingredientFields.findIndex(item => item.id === id);
    if (index !== -1) {
      updateIngredient(index, updatedIngredient);
    }

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
    const newStep = {desc: {en: '', ua: ''}, imgUrl: null, imgFile: null, id: newId};
    appendStep(newStep);
    startEditingStep(newStep.id);
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
    const index = stepFields.findIndex(item => item.id === id);
    if (index === -1) return;

    setValue(`recipeSteps.${index}.desc.${field}`, value);
  };

  const handleStepImageChange = (id: string, file: File) => {
    const index = stepFields.findIndex(item => item.id === id);
    if (index === -1) return;

    const previewUrl = URL.createObjectURL(file);
    setValue(`recipeSteps.${index}.imgUrl`, previewUrl);
    setValue(`recipeSteps.${index}.imgFile`, file);
  };

  const deleteStepImage = (id: string) => {
    const index = stepFields.findIndex(item => item.id === id);
    if (index === -1) return;

    setValue(`recipeSteps.${index}.imgUrl`, null);
    setValue(`recipeSteps.${index}.imgFile`, null);
  };

  const saveStepChanges = (id: string) => {
    const index = stepFields.findIndex(item => item.id === id);
    if (index === -1) return;

    const currentStep = stepFields.find(item => item.id === id);
    // setPrevStepChanges(prev => prev[id]: [...prev[id], currentStep]);
    handleCloseStepEditing(id);
  };

  const handleDragEnd = (event: DragEndEvent, fields: StepFields[] | Ingredient[], type: 'steps' | 'ingredients') => {
    if (!isEditing) return;
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((step) => step.id === active.id);
    const newIndex = fields.findIndex((step) => step.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    if (type === 'ingredients') {
      moveIngredient(oldIndex, newIndex);
    } else {
      moveStep(oldIndex, newIndex);
    }
  };


  if (isLoading) {
    return <LoadingPage/>;
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500"
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24">
            <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <p className="text-xl text-gray-900 dark:text-white font-semibold mb-2">{error || tCommon('errors.recipeNotFound')}</p>
        <Link href="/admin/recipes"
              className="text-amber-500 hover:text-amber-600">
          {tRecipes("singlePage.backButton")}
        </Link>
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

      let updatedRecipe: IRecipe | null = null;

      if (result.isPremium && result.wasPremium) {
        // Premium → Premium: update both tables
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
        updatedRecipe = data;

      } else if (result.isPremium && !result.wasPremium) {
        // Public → Premium: update main + INSERT premium
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
        updatedRecipe = data;

      } else if (!result.isPremium && result.wasPremium) {
        // Premium → Public: update main + DELETE premium
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
        updatedRecipe = data;

      } else {
        // Public → Public: update main table only
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
        updatedRecipe = data;
      }

      // Update local state with new data
      setRecipe(updatedRecipe);
      setIsEditing(false);
      setUpdateHeroImg(null);
      setIsEditingStep({});
      setIsEditingIngredient({});
      setSaveError(null);

    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  const watchedSteps = watch('recipeSteps');
  const stepsToRender = isEditing
    ? stepFields.map((field, i) => ({...watchedSteps[i], id: field.id}))
    : recipe?.recipeSteps;
  const stepIds = stepFields.map((step) => step.id);

  const mainImage = watch('heroImg');

  const isVideoChanged = watch('videoFile');

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={mainImage === '' ? recipe.heroImg : mainImage}
          alt={recipe.title[locale]}
          fill
          className="object-cover"
          priority
        />
        {isEditing && (
          <div className='absolute top-10 left-10 z-10 pointer'>
            <label
              className='flex flex-row items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md'>
              <CiEdit className="text-xl"/> <span>{tAdmin('list.update')}</span>
              <input
                onChange={(e) => handleHeroImgFile(e)}
                type="file"
                hidden
                multiple={false}
              />
            </label>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <div className='relative'>
              {isEditing ? (
                <div className="flex items-center gap-2 mb-4">
                  <select
                    value={watch('category')?.en || ''}
                    onChange={(e) => {
                      const selected = categories.find(cat => cat.en === e.target.value);
                      if (selected) {
                        setValue('category', selected);
                      }
                    }}
                    className="px-4 py-1 text-sm font-medium text-amber-900 bg-amber-100 rounded-full border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter(cat => cat.en !== 'All recipes').map((category) => (
                      <option key={category.en}
                              value={category.en}>
                        {category[locale]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-start justify-start gap-2">
                  <span className="inline-block px-4 py-1 mb-4 text-sm font-medium text-amber-900 bg-amber-100 rounded-full">
                    {recipe.category[locale]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-start gap-2">
              {isEditing ? (
                <div className="flex flex-col gap-2 mb-4 w-full max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium w-8">UK:</span>
                    <input
                      type="text"
                      {...register('title.ua')}
                      className="flex-1 px-3 py-2 text-lg font-bold text-gray-900 bg-white rounded-lg border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium w-8">EN:</span>
                    <input
                      type="text"
                      {...register('title.en')}
                      className="flex-1 px-3 py-2 text-lg font-bold text-gray-900 bg-white rounded-lg border-2 border-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                    {recipe.title[locale]}
                  </h1>
                  {isEditing && (
                    <button

                      className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-1"
                    >
                      <CiEdit className="text-2xl"/>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                {isEditing ? (
                  <div>
                    <label
                      className="block text-sm font-medium text-white mb-1">{tAdmin('form.fields.likes')}
                    </label>
                    <input {...register('likes')}
                           className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                           type="number"
                           placeholder="0"/>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5"
                         fill="currentColor"
                         viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                    </svg>
                    <span>{recipe.likes}</span>
                  </>
                )}

              </span>

              <span className="flex items-center gap-2">
                <svg className="w-5 h-5"
                     fill="none"
                     stroke="currentColor"
                     viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                {recipe.recipeSteps.length}<span>{tRecipes('singlePage.steps')}</span>
              </span>

            </div>
            <div className='flex items-center gap-5 my-2'>
              {isEditing ? (
                <div className='relative'>
                  <label className="block text-sm font-medium text-white mb-1">
                    {tAdmin('form.fields.preparingTime')}
                  </label>
                  <div className='relative'>
                    <input {...register('preparingTime', {required: true, min: 1, max: 1000})}
                           name="preparingTime"
                           aria-invalid={errors.preparingTime ? "true" : "false"}
                           className="relative z-0 w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                           type="number"/>
                    <span
                      className='absolute top-0 right-0 w-2/10 h-full text-center flex justify-center items-center text-xs sm:text-md pr-3'>{tAdmin('form.fields.minutes')}</span>
                  </div>
                </div>
              ) : (
                <span>Preparing Time: {recipe.preparingTime} {tAdmin('form.fields.minutes')}</span>
              )}
              {isEditing ? (
                <div className="flex gap-3 items-center">
                  <label className="block text-sm font-medium text-white">{tAdmin('form.fields.premiumContent')}:</label>
                  <input className="w-5 h-5 accent-green-500"
                         type="checkbox" {...register('isPremium')}/>
                </div>
              ) : (
                <span>{recipe.isPremium ? 'Premium content' : null}</span>
              )}
            </div>
          </div>
        </div>
        <div className='absolute top-3 right-3 flex flex-col gap-7'>
          <button
            className='flex flex-row items-center gap-2 px-4 py-2 bg-red-500 font-medium rounded-xl hover:bg-red-400 transition-colors shadow-md'
            onClick={() => handleDeleteRecipe(recipe.id)}
          >
            <MdDelete/>
            <span>{tAdmin('list.delete')}</span>
          </button>
          {isEditing ? (
            <div className={`flex flex-col items-center gap-2`}>
              <button
                className='flex flex-row items-center gap-2 px-4 py-2 w-full bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md disabled:opacity-50'
                onClick={handleSubmit(onSaveChanges)}
                disabled={isSaving}>
                <CiEdit className="text-xl"/>
                <span>{isSaving ? 'Saving...' : tAdmin('list.save')}</span>
              </button>
              <button
                className='flex flex-row items-center gap-2 px-4 py-2 w-full bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-md disabled:opacity-50'
                onClick={cancelEditButton}
                disabled={isSaving}>
                <CiEdit className="text-xl"/> <span>{tAdmin('list.cancel')}</span>
              </button>
              {saveError && (
                <div className='px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-xl text-sm max-w-xs text-center'>
                  {saveError}
                </div>
              )}
            </div>
          ) : (
            <button
              className='flex flex-row items-center gap-2 px-6 py-2 bg-amber-700 text-white font-medium rounded-xl hover:bg-amber-500 transition-colors shadow-md'
              onClick={toggleEditButton}>
              <CiEdit className="text-xl"/> <span>{tAdmin('list.edit')}</span>
            </button>
          )}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Ingredients Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-300"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.428 15.428a2 4 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tRecipes('singlePage.keyIngredients')}</h2>

          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, ingredientFields, 'ingredients')}>
              <SortableContext items={ingredientFields.map(f => f.id)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(!isEditing ? recipe.ingredients : ingredientFields).map((ingredient, i) => (
                    <div key={ingredient.id}>
                      {isEditingIngredient[ingredient.id] ? (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-gray-700 border-2 border-amber-400">
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 w-6">UA:</span>
                              <input
                                type="text"
                                name='value.ua'
                                onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                value={editingIngredientsData[ingredient.id].value.ua}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500 w-6">EN:</span>
                              <input
                                type="text"
                                name='value.en'
                                onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                value={editingIngredientsData[ingredient.id].value.en}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                name='quantity'
                                onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                value={editingIngredientsData[ingredient.id].quantity}
                                placeholder="Qty"
                                className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <select
                                name='unit'
                                onChange={(e) => handleIngredientChange(ingredient.id, e.target.name, e.target.value)}
                                value={editingIngredientsData[ingredient.id].unit}
                                className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              >
                                {units.map((u) => (
                                  <option key={u.value}
                                          value={u.value}>{u.label[locale]}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-5 justify-end">
                            <button
                              onClick={() => saveIngredientsChanges(ingredient.id)}
                              className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                              <IoCheckmark className="text-sm"/>
                            </button>
                            <button
                              onClick={() => cancelIngredientsEditing(ingredient.id)}
                              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <IoClose className="text-sm"/>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <SortableIngredient key={ingredient.id}
                                            ingredient={ingredient}
                                            ingredientId={ingredient.id}
                                            index={i}
                                            isEditing={isEditing}
                                            startEditingIngredient={startEditingIngredient}
                                            removeIngredient={removeIngredient}/>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          {isEditing && (
            <div className="space-y-3 mb-4 mt-4">
              <h3>{tAdmin('form.sections.addIngredient')}</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input {...register('ingredientUa')}
                         className={error !== null && getValues('ingredients').length === 0 ?
                           "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                           "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                         }
                         type="text"
                         placeholder={tAdmin('form.fields.ingredientPlaceholderUa')}/>
                  <input {...register('ingredientEn')}
                         className={error !== null && getValues('ingredients').length === 0 ?
                           "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                           "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                         }
                         type="text"
                         placeholder={tAdmin('form.fields.ingredientPlaceholderEn')}/>
                </div>

                {/* Quantity and Unit */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input {...register('ingredientQuantity')}
                         className={error !== null && getValues('ingredients').length === 0 ?
                           "flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                           "flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                         }
                         type="text"
                         placeholder={tAdmin('form.fields.quantity')}/>
                  <select
                    {...register('ingredientUnit')}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                  >
                    {units.map((unit) => (
                      <option key={unit.value}
                              value={unit.value}>
                        {unit.label.ua} / {unit.label.en} ({unit.title.ua})
                      </option>
                    ))}
                  </select>
                  <button
                    className="px-6 py-3 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
                    onClick={addNewIngredient}
                  >
                    {tAdmin('form.buttons.add')}
                  </button>
                </div>
              </div>
              {errors.ingredients &&
                <p className='text-red-500'>{tAdmin('form.validation.addAtLeastOneIngredient')}</p>}
            </div>
          )}
        </section>

        {/* Steps Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-300"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tRecipes('singlePage.preparationSteps')}</h2>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, stepFields, 'steps')}
          >
            <SortableContext items={stepIds}
                             strategy={verticalListSortingStrategy}>
              <div className='space-y-4'>
                {stepsToRender.map((step, i) => (
                  <div key={step.id}>
                    {isEditingStep[step.id] ? (
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 border-amber-400">
                        <div className="p-6">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-4">{tRecipes('singlePage.step')} {i + 1}</h4>

                          {/* Image */}
                          {step.imgUrl ? (
                            <div className="relative mb-4">
                              <Image
                                className="rounded-xl w-full object-cover max-h-64"
                                width={500}
                                height={300}
                                src={step.imgUrl}
                                alt={`Step ${i + 1} image`}
                              />
                              {isVideoChanged !== null && (
                                <button
                                  type="button"
                                  onClick={() => deleteStepImage(step.id)}
                                  className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                >
                                  <MdDeleteForever className="text-xl"/>
                                </button>
                              )}
                              <label className="absolute bottom-2 right-2 cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg">
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
                            <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-4 bg-gray-50 dark:bg-gray-700">
                              <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
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

                          {/* Description UK */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {tAdmin('form.fields.descriptionUa')}
                            </label>
                            <textarea
                              value={typeof step.desc === 'string' ? '' : step.desc.ua}
                              onChange={(e) => handleStepChange(step.id, 'ua', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Description EN */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {tAdmin('form.fields.descriptionEn')}
                            </label>
                            <textarea
                              value={typeof step.desc === 'string' ? '' : step.desc.en}
                              onChange={(e) => handleStepChange(step.id, 'en', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="flex gap-3 justify-end">
                            <button
                              onClick={() => saveStepChanges(step.id)}
                              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                              <IoCheckmark className="text-lg"/>
                            </button>
                            <button
                              onClick={() => cancelStepEditing(step.id)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <IoClose className="text-lg"/>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <SortableStep step={step}
                                    stepId={step.id}
                                    index={i}
                                    isEditing={isEditing}
                                    onEdit={() => startEditingStep(step.id)}
                                    onRemove={() => removeStep(i)}/>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {isEditing && (
            <button
              className={`mt-4 w-full py-3 rounded-xl border-2 border-dashed ${error && stepFields.length === 0 ? 'border-red-400' : 'border-amber-300 dark:border-gray-500'} text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors`}
              type="button"
              onClick={addNewStep}
            >
              + {tAdmin('form.buttons.addNewStep')}
            </button>
          )}
        </section>

        {/* Video Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-300"
                   fill="none"
                   stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tAdmin('form.fields.videoUrl')}</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            {isEditing ? (
              <div className="space-y-4">
                {watch('videoUrl') ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <video
                      className="w-full h-full object-cover"
                      src={watch('videoUrl')}
                      controls
                    />
                    <button
                      type="button"
                      onClick={removeVideoFile}
                      className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <MdDeleteForever className="text-xl"/>
                    </button>
                    <label className="absolute bottom-2 right-2 cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg">
                      <input
                        type="file"
                        hidden
                        accept="video/*"
                        onChange={handleVideoFile}
                      />
                      {tAdmin('form.buttons.changeVideo')}
                    </label>
                  </div>
                ) : (
                  <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
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
            ) : (
              recipe?.videoUrl ? (
                <div className="relative rounded-xl overflow-hidden">
                  <SecureVideoPlayer recipeId={recipe.id}
                                     videoKey={recipe.videoUrl}
                                     className={'w-full max-h-[500px] object-contain'}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {tAdmin('form.fields.noVideo')}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link
            href="/admin/recipes"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-full transition-colors shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            {tRecipes("singlePage.backButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
