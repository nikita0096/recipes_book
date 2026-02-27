'use client';

import Image from "next/image";
import {Link} from "@/i18n/navigation";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {IRecipe, parseJson} from "@/types/recipe";
import {fetchRecipe} from "@/services/db/fetchRecipe";
import LoadingPage from "@/components/ui/LoadingPage";
import {useTranslations} from "next-intl";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/deleteRecipe";
import {useRouter} from "next/navigation";
import SortableStep from "@/app/[locale]/admin/recipes/[recipe]/SortableStep";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {CiEdit} from "react-icons/ci";
import {MdDelete} from "react-icons/md";
import {categories} from "@/constants/categories";
import {IoCheckmark, IoClose} from "react-icons/io5";
import {units} from "@/constants/units";
import {IFormValues, Ingredient} from "@/app/[locale]/admin/page";
import {LocalizedText} from "@/services/db/insertRecipeToDatabase";
import AddIngredientForm from "@/components/admin/recipe/AddIngredientForm";
import {Controller, useFieldArray, useForm} from "react-hook-form";

// Types for editing
type EditingField =
  | 'heroImage'
  | 'category'
  | 'title'
  | `ingredient-${string}`
  | `step-${number}`
  | null;

interface EditingValues {
  heroImg: string;
  category: string;
  title: { ua: string; en: string };
  ingredients: Ingredient[];
  recipeSteps: { desc: LocalizedText; imgUrl: File | string | null, id: string }[];
  likes: number;
  ingredientEn: string;
  ingredientUk: string;
  ingredientQuantity: string | null;
  ingredientUnit: UnitValue;
}

const initialEditedValues: EditedValues = {
  heroImage: '',
  category: '',
  title: {ua: '', en: ''},
  ingredient: null,
  step: null,
};

const Page = () => {
  const params = useParams<{ recipe: string }>();
  const [recipe, setRecipe] = useState<IRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [updatedHeroImg, setUpdateHeroImg] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<EditingField>(null);
  const [editedValues, setEditedValues] = useState<EditedValues>(initialEditedValues);

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
    formState: {errors}
  } = useForm<EditingValues>({
    defaultValues: {
      heroImg: recipe?.heroImg,
      category: recipe?.category,
      title: recipe?.title,
      ingredients: recipe?.ingredients,
      recipeSteps: recipe?.recipeSteps,
      likes: recipe?.likes,
      ingredientEn: '',
      ingredientUk: '',
      ingredientQuantity: '',
      ingredientUnit: units[0].value,
    }
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'recipeSteps',
  });

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRecipe(params.recipe);
        const parsedTitle = parseJson(data?.title);

        setRecipe({
          ...data,
          title: parsedTitle
        });

        if (data) {
          setValue('title', parsedTitle);
          setValue('heroImg', data.heroImg);
          setValue('category', data.category);
          setValue('ingredients', data.ingredients);
          setValue('recipeSteps', data.recipeSteps);
          setValue('likes', data.likes);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipe]);

  const titleParsed = parseJson(recipe?.title) as LocalizedText;

  const router = useRouter();

  const queryClient = useQueryClient();

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,

    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ["recipes"]});
    }
  });

  const toggleEditButton = () => {
    setIsEditing(!isEditing);
  }

  const handleDeleteRecipe = (id: number) => {
    deleteRecipeMutation.mutate(id.toString());

    router.push(`/admin/recipes`);
  }

  const handleHeroImgFile = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    setUpdateHeroImg(url);
    setValue('heroImg', file);
  }

  const startEditing = (field: EditingField) => {
    if (!recipe) return;

    setEditedValues({
      heroImage: recipe.recipeSteps[0]?.imgUrl || '',
      category: recipe.category,
      title: titleParsed,
      ingredient: null,
      step: null,
    });
    setEditingField(field);
  };

  const startEditingIngredient = (ingredient: Ingredients) => {
    const valueParsed = typeof ingredient.value === 'string'
      ? parseJson(ingredient.value) as { ua: string; en: string }
      : ingredient.value;

    setEditedValues(prev => ({
      ...prev,
      ingredient: {
        id: ingredient.id,
        value: valueParsed,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
      },
    }));
    setEditingField(`ingredient-${ingredient.id}`);
  };

  const startEditingStep = (step: IRecipe['recipeSteps'][0], index: number) => {
    const descParsed = typeof step.desc === 'string'
      ? parseJson(step.desc) as { ua: string; en: string }
      : step.desc;

    setEditedValues(prev => ({
      ...prev,
      step: {
        index,
        imgUrl: step.imgUrl || '',
        desc: descParsed,
      },
    }));
    setEditingField(`step-${index}`);
  };

  const saveEdit = () => {
    if (!recipe || !editingField) return;

    if (editingField === 'category') {
      setRecipe({...recipe, category: editedValues.category});
    } else if (editingField === 'title') {
      setRecipe({...recipe, title: editedValues.title});
    } else if (editingField === 'heroImage') {
      const updatedSteps = [...recipe.recipeSteps];
      if (updatedSteps[0]) {
        updatedSteps[0] = {...updatedSteps[0], imgUrl: editedValues.heroImage};
      }
      setRecipe({...recipe, recipeSteps: updatedSteps});
    } else if (editingField.startsWith('ingredient-') && editedValues.ingredient) {
      const updatedIngredients = recipe.ingredients.map(ing =>
        ing.id === editedValues.ingredient!.id
          ? {
            ...ing,
            value: editedValues.ingredient!.value,
            quantity: editedValues.ingredient!.quantity,
            unit: editedValues.ingredient!.unit,
          }
          : ing
      );
      setRecipe({...recipe, ingredients: updatedIngredients});
    } else if (editingField.startsWith('step-') && editedValues.step) {
      const updatedSteps = [...recipe.recipeSteps];
      const idx = editedValues.step.index;
      updatedSteps[idx] = {
        ...updatedSteps[idx],
        imgUrl: editedValues.step.imgUrl,
        desc: editedValues.step.desc,
      };
      setRecipe({...recipe, recipeSteps: updatedSteps});
    }

    // TODO: Add API call to save changes
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditedValues(initialEditedValues);
  };

  const updateEditedValue = <K extends keyof EditedValues>(
    key: K,
    value: EditedValues[K]
  ) => {
    setEditedValues(prev => ({...prev, [key]: value}));
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

  console.log(getValues())

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        <Image
          src={updatedHeroImg === null ? recipe.heroImg : updatedHeroImg}
          alt={titleParsed ? titleParsed[locale] : ''}
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <div className='relative'>
              {isEditing ? (
                <div className="flex items-center gap-2 mb-4">
                  <select
                    {...register('category')}
                    value={editedValues.category}
                    onChange={(e) => updateEditedValue('category', e.target.value)}
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
                    {recipe.category}
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
                    {titleParsed && titleParsed[locale]}
                  </h1>
                  {isEditing && (
                    <button
                      onClick={() => startEditing('title')}
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
                <svg className="w-5 h-5"
                     fill="currentColor"
                     viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                </svg>
                {isEditing ? (
                  <div>
                    <label
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tAdmin('form.fields.likes')}</label>
                    <input {...register('likes')}
                           className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                           type="number"
                           placeholder="0"/>
                  </div>
                ) : (
                  <span>{recipe.likes}</span>
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
          </div>
        </div>
        <div className='absolute top-3 right-3 flex flex-col gap-2'>
          {isEditing ? (
            <div className={`flex flex-col items-center gap-2`}>
              <button
                className='flex flex-row items-center gap-2 px-4 py-2 w-full bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-md'
                onClick={toggleEditButton}>
                <CiEdit className="text-xl"/> <span>{tAdmin('list.save')}</span>
              </button>
              <button
                className='flex flex-row items-center gap-2 px-4 py-2 w-full bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-md'
                onClick={toggleEditButton}>
                <CiEdit className="text-xl"/> <span>{tAdmin('list.cancel')}</span>
              </button>
            </div>
          ) : (
            <button
              className='flex flex-row items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md'
              onClick={toggleEditButton}>
              <CiEdit className="text-xl"/> <span>{tAdmin('list.edit')}</span>
            </button>
          )}
          <button
            className='flex flex-row items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-white-600 dark:text-white-400 font-medium rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-md'
            onClick={() => handleDeleteRecipe(recipe.id)}
          >
            <MdDelete/>
            <span>{tAdmin('list.delete')}</span>
          </button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recipe.ingredients.map((item) => (
                <div key={item.id}>
                  {editingField === `ingredient-${item.id}` && editedValues.ingredient ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-gray-700 border-2 border-amber-400">
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-6">UK:</span>
                          <input
                            type="text"
                            value={editedValues.ingredient.value.ua}
                            onChange={(e) => updateEditedValue('ingredient', {
                              ...editedValues.ingredient!,
                              value: {...editedValues.ingredient!.value, ua: e.target.value}
                            })}
                            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-6">EN:</span>
                          <input
                            type="text"
                            value={editedValues.ingredient.value.en}
                            onChange={(e) => updateEditedValue('ingredient', {
                              ...editedValues.ingredient!,
                              value: {...editedValues.ingredient!.value, en: e.target.value}
                            })}
                            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editedValues.ingredient.quantity}
                            onChange={(e) => updateEditedValue('ingredient', {
                              ...editedValues.ingredient!,
                              quantity: e.target.value
                            })}
                            placeholder="Qty"
                            className="w-16 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                          <select
                            value={editedValues.ingredient.unit}
                            onChange={(e) => updateEditedValue('ingredient', {
                              ...editedValues.ingredient!,
                              unit: e.target.value
                            })}
                            className="flex-1 px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            {units.map((u) => (
                              <option key={u.value}
                                      value={u.value}>{u.label[locale]}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={saveEdit}
                          className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        >
                          <IoCheckmark className="text-sm"/>
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <IoClose className="text-sm"/>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-100 dark:border-gray-600">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-amber-500"/>
                        <p className="text-gray-700 dark:text-gray-200 font-medium">{item.value[locale]}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                          {item.quantity} {item.unit}
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => startEditingIngredient(item)}
                            className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-full hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-1"
                          >
                            <CiEdit className="text-lg"/>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
          {isEditing && (
            <div className="space-y-3 mb-4 mt-4">
              <Controller
                name='ingredients'
                control={control}
                rules={{required: 'Ingredients are required'}}
                render={() => (
                  <div className="space-y-3">
                    {/* Ingredient name inputs for both languages */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input {...register('ingredientUk')}
                             className={error !== null && getValues('ingredients').length === 0 ?
                               "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                               "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                             }
                             type="text"
                             placeholder={tAdmin('form.fields.ingredientPlaceholderUk')}/>
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
                        onClick={(e) => handleIngredientsForm(e)}
                      >
                        {tAdmin('form.buttons.add')}
                      </button>
                    </div>
                  </div>
                )}
              />
              {errors.ingredients && <p className='text-red-500'>{t('form.validation.addAtLeastOneIngredient')}</p>}
            </div>
          )}
        </section>

        {/* Steps Section */}
        <section>
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

          <div className="space-y-8">
            {recipe.recipeSteps.map((step, i) => (
              <div key={step.id || i}>
                {editingField === `step-${i}` && editedValues.step ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 border-amber-400">
                    <div className="p-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-4">Step {i + 1}</h4>

                      {/* Image URL */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image
                          URL</label>
                        <input
                          type="text"
                          value={editedValues.step.imgUrl}
                          onChange={(e) => updateEditedValue('step', {
                            ...editedValues.step!,
                            imgUrl: e.target.value
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Description UK */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description
                          (UK)</label>
                        <textarea
                          value={editedValues.step.desc.ua}
                          onChange={(e) => updateEditedValue('step', {
                            ...editedValues.step!,
                            desc: {...editedValues.step!.desc, ua: e.target.value}
                          })}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      {/* Description EN */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description
                          (EN)</label>
                        <textarea
                          value={editedValues.step.desc.en}
                          onChange={(e) => updateEditedValue('step', {
                            ...editedValues.step!,
                            desc: {...editedValues.step!.desc, en: e.target.value}
                          })}
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                    <SortableStep step={step}
                                  id={i}/>
                    {isEditing && (
                      <button
                        onClick={() => startEditingStep(step, i)}
                        className="absolute top-3 right-3 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md p-2 z-10"
                      >
                        <CiEdit className="text-2xl"/>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
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