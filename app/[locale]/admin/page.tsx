'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "@/i18n/navigation";
import {useLocale, useTranslations} from "next-intl";
import {Controller, SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from 'uuid';
import {insertRecipe, IUploadData, LocalizedText} from "@/services/db/insertRecipeToDatabase";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {MdDeleteForever} from "react-icons/md";
import {Spinner} from "@/components/ui/spinner";
import {units} from "@/constants/units";
import {categories} from "@/constants/categories";
import AddIngredientForm from "@/components/admin/recipe/AddIngredientForm";

type Locale = 'en' | 'ua';

type UnitValue = typeof units[number]['value'];

export interface Ingredient {
  value: { en: string; ua: string };
  quantity: string;
  unit: UnitValue;
  id: string;
}

export interface IFormValues {
  title: { en: string; ua: string };
  likes: number;
  category: string;
  recipeSteps: { desc: { en: string; ua: string }; image: File | null }[];
  ingredientEn: string;
  ingredientUk: string;
  ingredients: Ingredient[];
  heroImg: File | null;
  ingredientQuantity: string | null;
  ingredientUnit: UnitValue;
  isPremium: boolean;
  preparingTime: number;
  videoUrl: string;
}

const Page = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [stepImageUrls, setStepImageUrls] = useState<string[]>([]);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [validationErrorIngredients, setValidationErrorIngredients] = useState('');
  const locale = useLocale();

  const t = useTranslations('admin');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    resetField,
    getValues,
    formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: {
      recipeSteps: [],
      title: {en: '', ua: ''},
      likes: 0,
      category: categories.find(cat => cat.en === 'Desserts')?.en,
      ingredientEn: '',
      ingredientUk: '',
      ingredientQuantity: '',
      ingredientUnit: units[0].value,
      ingredients: [],
      heroImg: null,
      isPremium: true,
      preparingTime: 0,
      videoUrl: ''
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

  const {user} = useUserStore();

  const router = useRouter();

  const handleIngredientsForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const ingredientUk = getValues('ingredientUk')?.trim();
    const ingredientEn = getValues('ingredientEn')?.trim();
    const quantity = getValues('ingredientQuantity')?.trim();
    const unit = getValues('ingredientUnit');

    if (!ingredientUk || !ingredientEn || !quantity || !unit) {
      setValidationErrorIngredients(t('form.validation.fillAllIngredientFields'));
      return;
    }

    appendIngredient({
      value: {en: ingredientEn, ua: ingredientUk},
      quantity: quantity,
      unit: unit,
      id: uuidv4()
    });
    resetField('ingredientUk');
    resetField('ingredientEn');
    resetField('ingredientQuantity');
    resetField('ingredientUnit');
    setValidationErrorIngredients('');
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] ?? null;

    if (file !== null) {
      const url = URL.createObjectURL(file);
      setStepImageUrls(prevState => {
        const newUrls = [...prevState];
        newUrls[index] = url;
        return newUrls;
      });
    }

    setValue(`recipeSteps.${index}.image`, file, {
      shouldValidate: true,
    });
  };

  const deleteStepsImg = (index: number) => {
    const newSteps = stepImageUrls.map((step, i) => i === index ? '' : step);
    setStepImageUrls(newSteps);
    setValue(`recipeSteps.${index}.image`, null);
  };

  const deleteStep = (index: number) => {
    const newSteps = stepImageUrls.filter((_, i) => i !== index);
    setStepImageUrls(newSteps);
    removeStep(index);
  };

  const handleHeroImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setValue('heroImg', file);

    if (file !== null) {
      const url = URL.createObjectURL(file);
      setHeroImg(url);
    }
  };

  const deleteHeroImg = () => {
    setHeroImg(null);
    setValue('heroImg', null);
  };

  const handleFormData = async (data: IFormValues, folder: string) => {
    setError(null);

    if (data.ingredients.length === 0 || data.heroImg === null || data.recipeSteps.length === 0) {
      setError(t('form.validation.fillAllFields'));
      return null;
    }

    if (!data.title.en || !data.title.ua) {
      setError(t('form.validation.enterTitleBothLanguages'));
      return null;
    }

    for (const step of data.recipeSteps) {
      if (!step.desc.en || !step.desc.ua) {
        setError(t('form.validation.enterStepsBothLanguages'));
        return null;
      }
    }

    const steps = [];
    const category = categories.find(cat => cat.en === data.category);

    if (!category) {
      setError(t('form.validation.enterCategory'));
      return null;
    }

    for (const step of data.recipeSteps) {
      const {desc, image} = step;
      let imgUrl = null;

      const filePath = `${folder}/${uuidv4()}`;

      if (image !== null) {
        const {imageUrl, error} = await uploadImage({
          file: image,
          bucket: 'images',
          filePath: filePath
        });

        if (error) {
          return null;
        }

        imgUrl = imageUrl;
      }
      steps.push({
        desc,
        imgUrl,
        id: uuidv4(),
      });
    }

    let heroImgResult = null;

    const fileHeroPath = `${folder}/${"heroImg" + uuidv4()}`;

    try {
      heroImgResult = await uploadImage({
        file: data.heroImg,
        bucket: 'images',
        filePath: fileHeroPath
      });
    } catch {
      setError(t('form.validation.reloadHeroImage'));
      return null;
    }

    return {
      title: data.title,
      category: category,
      likes: data.likes,
      recipeSteps: steps,
      ingredients: data.ingredients,
      heroImgUrl: heroImgResult.imageUrl,
      isPremium: data.isPremium,
      preparingTime: data.preparingTime,
      videoUrl: ''
    };
  };

  const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
    setIsPending(true);

    try {
      const recipeData: IUploadData | null = await handleFormData(formData, formData.title.en);

      if (recipeData === null) {
        setIsPending(false);
        return;
      }

      // await insertRecipe(recipeData);
      console.log(recipeData);
      reset();
      setStepImageUrls([]);
      setHeroImg(null);
    } catch {
      setError(t('form.validation.recipeNotUploaded'));
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user === null && mounted) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('form.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}
            id="add-new-recipe-form"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 border border-amber-100 dark:border-gray-700">

        {/* Basic Info Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">1</span>
            {t('form.sections.basicInfo')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('form.fields.title')}
              </label>
              <input {...register('title.ua', {required: true})}
                     className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                     type="text"
                     placeholder={t('form.fields.titlePlaceholderUk')}/>
              <input {...register('title.en', {required: true})}
                     className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors mt-2"
                     type="text"
                     placeholder={t('form.fields.titlePlaceholderEn')}/>
            </div>

            <div className="flex gap-3 items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.fields.premiumContent')}:</label>
              <input className="text-2xl"
                     type="checkbox" {...register('isPremium')}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.fields.likes')}</label>
                <input {...register('likes')}
                       className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                       type="number"
                       placeholder="0"/>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.fields.category')}</label>
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors cursor-pointer"
                  {...register('category')}
                >
                  {categories.filter(cat => cat.en !== "All recipes").map((category, i) => (
                    <option key={i}
                            value={category.en}>{category[locale as Locale]}</option>
                  ))}
                </select>
              </div>

              <div className='relative'>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('form.fields.preparingTime')}
                </label>
                <div className='relative'>
                  <input {...register('preparingTime', {required: true, min: 1, max: 1000})}
                         name="preparingTime"
                         aria-invalid={errors.preparingTime ? "true" : "false"}
                         className="relative z-0 w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                         type="number"/>
                  <span
                    className='absolute top-0 right-0 w-2/10 h-full text-center flex justify-center items-center text-xs sm:text-md pr-3'>{t('form.fields.minutes')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">2</span>
            {t('form.sections.ingredients')}
          </h2>

          <div className="space-y-3 mb-4">
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
                           placeholder={t('form.fields.ingredientPlaceholderUk')}/>
                    <input {...register('ingredientEn')}
                           className={error !== null && getValues('ingredients').length === 0 ?
                             "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                             "w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                           }
                           type="text"
                           placeholder={t('form.fields.ingredientPlaceholderEn')}/>
                  </div>

                  {/* Quantity and Unit */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input {...register('ingredientQuantity')}
                           className={error !== null && getValues('ingredients').length === 0 ?
                             "flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-red-400 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors" :
                             "flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                           }
                           type="text"
                           placeholder={t('form.fields.quantity')}/>
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
                      {t('form.buttons.add')}
                    </button>
                  </div>
                </div>
              )}
            />
            {errors.ingredients && <p className='text-red-500'>{t('form.validation.addAtLeastOneIngredient')}</p>}
          </div>

          {validationErrorIngredients && (
            <div className='p-2 pb-4 text-red-500'>{validationErrorIngredients}</div>
          )}

          <div className="flex items-center justify-start gap-2 flex-wrap">
            {ingredientFields.map((item, index) => (
              <div
                className="flex flex-row items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-200 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                key={item.id}
              >
                <span className="font-medium">{item.value.ua}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500 dark:text-gray-400">{item.value.en}</span>
                <span className="text-amber-600">-</span>
                <span>{item.quantity} {item.unit}</span>
                <MdDeleteForever
                  className="text-red-500 cursor-pointer hover:text-red-600 transition-colors"
                  onClick={() => removeIngredient(index)}
                />
              </div>
            ))}
          </div>
        </div>

        {/*Hero Image section*/}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">3</span>
            {t('form.sections.heroImage')}
          </h2>
          <div>
            {heroImg ? (
              <div className="relative mb-3">
                <Image
                  className="rounded-xl w-full object-cover"
                  width={300}
                  height={200}
                  src={heroImg}
                  alt="Uploaded image"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                  onClick={deleteHeroImg}
                >
                  <MdDeleteForever className="text-xl"/>
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 w-full h-40 border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-3 bg-white dark:bg-gray-800">
                <label
                  className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
                  <Controller
                    name='heroImg'
                    control={control}
                    rules={{required: 'Main image is required'}}
                    render={() => (
                      <input
                        type="file"
                        hidden
                        multiple={false}
                        onChange={(e) => handleHeroImg(e)}
                      />
                    )}
                  />
                  {t('form.buttons.addPicture')}
                </label>
                {errors.heroImg && <p className='text-red-500'>{errors.heroImg.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Steps Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">4</span>
            {t('form.sections.steps')}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {stepFields.map((field, index) => (
              <div
                key={field.id}
                className="bg-amber-50/50 dark:bg-gray-700/50 border-2 border-amber-100 dark:border-gray-600 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <h5 className="font-medium text-gray-900 dark:text-white">{t('form.fields.step')} {index + 1}</h5>
                </div>

                {stepImageUrls[index] ? (
                  <div className="relative mb-3">
                    <Image
                      className="rounded-xl w-full object-cover"
                      width={300}
                      height={200}
                      src={stepImageUrls[index]}
                      alt="Uploaded image"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                      onClick={() => deleteStepsImg(index)}
                    >
                      <MdDeleteForever className="text-xl"/>
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-3 bg-white dark:bg-gray-800">
                    <label
                      className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
                      <input
                        type="file"
                        hidden
                        multiple={false}
                        onChange={(e) => handleFiles(e, index)}
                      />
                      {t('form.buttons.addPicture')}
                    </label>
                  </div>
                )}

                {/* Step description with language tabs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('form.fields.stepDescLabelUk')}
                    </label>
                    <textarea
                      {...register(`recipeSteps.${index}.desc.ua`, {required: t('form.validation.addAtLeastOneStep')})}
                      placeholder={t('form.fields.stepDescPlaceholderUk')}
                      rows={3}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 ${errors.recipeSteps?.[index]?.desc?.ua ? 'border-red-400' : 'border-amber-200 dark:border-gray-600'} rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {t('form.fields.stepDescLabelEn')}
                    </label>
                    <textarea
                      {...register(`recipeSteps.${index}.desc.en`, {required: 'Add description in English'})}
                      placeholder={t('form.fields.stepDescPlaceholderEn')}
                      rows={3}
                      className={`w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 ${errors.recipeSteps?.[index]?.desc?.en ? 'border-red-400' : 'border-amber-200 dark:border-gray-600'} rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 w-full py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  onClick={() => deleteStep(index)}
                >
                  {t('form.buttons.deleteStep')}
                </button>
              </div>
            ))}
          </div>

          <button
            className={`mt-4 w-full py-3 rounded-xl border-2 border-dashed ${error && stepFields.length === 0 ? 'border-red-400' : 'border-amber-300 dark:border-gray-500'} text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors`}
            type="button"
            onClick={() => appendStep({desc: {en: '', ua: ''}, image: null})}
          >
            + {t('form.buttons.addNewStep')}
          </button>
          {error && stepFields.length === 0 && (
            <p className='text-center pt-2 text-red-500'>{t('form.validation.addAtLeastOneStep')}</p>
          )}
        </div>

        {/*Video section*/}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">5</span>
            {t('form.sections.video')}
          </h2>
          <div
            className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-3 bg-white dark:bg-gray-800">
            <label
              className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
              <input
                type="file"
                hidden
                multiple={false}
              />
              {t('form.buttons.addVideo')}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          type="submit"
          disabled={isPending}
        >
          {isPending ? <Spinner/> : t('form.buttons.create')}
        </button>
        {error !== null && <p className='text-center pt-2 text-red-500'>{error}</p>}
      </form>
    </div>
  );
};

export default Page;
