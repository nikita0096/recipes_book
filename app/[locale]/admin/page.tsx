'use client';

import React, {ChangeEvent, useEffect, useState} from 'react';
import Image from 'next/image';
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "@/i18n/navigation";
import {useLocale, useTranslations} from "next-intl";
import {Controller, SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from 'uuid';
import {insertRecipePublic, insertRecipePremiumMain} from "@/services/db/admin/insertRecipeToDatabase";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {MdDeleteForever} from "react-icons/md";
import {Spinner} from "@/components/ui/spinner";
import {units} from "@/constants/units";
import {categories} from "@/constants/categories";
import {IFormValues, Ingredient, Locale} from "@/types/forms";
import {uploadVideoToStorage} from "@/services/storage/uploadVideoToStorage";
import {insertPremiumRecipePart} from "@/services/db/admin/insertPremiumRecipeToDb";
import {
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
  IRecipePremiumUpload,
  RecipeStep,
} from "@/types/recipe";

const Page = () => {
  const [mounted, setMounted] = useState<boolean>(false);

  const [stepImageUrls, setStepImageUrls] = useState<string[]>([]);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const [isSuccess, setIsSuccess] = useState(false);
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
    watch,
    formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: {
      recipeSteps: [],
      title: {en: '', ua: ''},
      description: {en: '', ua: ''},
      likes: 0,
      category: categories.find(cat => cat.en === 'Desserts')?.en,
      price: 0,
      discount: 0,
      ingredientEn: '',
      ingredientUa: '',
      ingredientQuantity: '',
      ingredientUnit: units[0].value,
      ingredients: [],
      heroImg: null,
      isPremium: true,
      preparingTime: 0,
      videoFile: null
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user === null && mounted) {
      router.push('/');
    }
  }, [user, router]);

  const handleIngredientsForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const ingredientUa = getValues('ingredientUa')?.trim();
    const ingredientEn = getValues('ingredientEn')?.trim();
    const quantity = getValues('ingredientQuantity')?.trim();
    const unit = getValues('ingredientUnit');

    if (!ingredientUa || !ingredientEn || !quantity || !unit) {
      setValidationErrorIngredients(t('form.validation.fillAllIngredientFields'));
      return;
    }

    appendIngredient({
      value: {en: ingredientEn, ua: ingredientUa},
      quantity: quantity,
      unit: unit,
      id: uuidv4()
    });
    resetField('ingredientUa');
    resetField('ingredientEn');
    resetField('ingredientQuantity');
    resetField('ingredientUnit');
    setValidationErrorIngredients('');
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] ?? null;
    const type = e.target.files?.[0]?.type.split('/')[0];

    if (!file) return;

    if (type === 'image') {
      const url = URL.createObjectURL(file);
      setStepImageUrls(prevState => {
        const newUrls = [...prevState];
        newUrls[index] = url;
        return newUrls;
      });

      setValue(`recipeSteps.${index}.image`, file, {
        shouldValidate: true,
      });
    } else if (type === 'video') {
      const originalUrl = URL.createObjectURL(file);
      setVideoUrl(originalUrl);
      setValue('videoFile', file);
    }
  };

  type TranslateInputs = 'title.ua' | 'description.ua' | 'ingredientUa' | `recipeSteps.${number}.desc.ua`;

  const handleTranslateText = async (e: React.MouseEvent<HTMLButtonElement>, flag: string, index?: number) => {
    e.preventDefault();
    const inputFields: Record<string, TranslateInputs> = {
      title: 'title.ua',
      description: 'description.ua',
      ingredient: 'ingredientUa',
      ...(index !== undefined && {stepDescription: `recipeSteps.${index}.desc.ua`})
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
        setValue('ingredientEn', translated);
        break;
      case 'stepDescription':
        if (index !== undefined) {
          setValue(`recipeSteps.${index}.desc.en`, translated);
        }
        break;
    }

  }

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

    if (!data.description.en || !data.description.ua) {
      setError(t('form.validation.enterDescriptionBothLanguages'));
      return null;
    }

    for (const step of data.recipeSteps) {
      if (!step.desc.en || !step.desc.ua) {
        setError(t('form.validation.enterStepsBothLanguages'));
        return null;
      }
    }

    if (!data.videoFile) {
      setError(t('form.validation.enterVideoFile'));
      return null;
    }

    if(data.isPremium && data.price === 0) {
      setError(t('form.validation.enterPrice'));
      return null;
    }

    const steps = [];
    const category = categories.find(cat => cat.en === data.category);

    if (!category) {
      setError(t('form.validation.enterCategory'));
      return null;
    }

    let videoUrl;

    try {
      setIsVideoUploading(true);
      const {videoUrl: videoKey, error} = await uploadVideoToStorage({
        videoFile: data.videoFile,
        folder: folder,
        onProgress: (percentage) => setVideoUploadProgress(percentage)
      });

      if(error) throw new Error(error);

      videoUrl = videoKey;

      setIsVideoUploading(false);
    } catch(error) {
      setVideoError(t('form.validation.videoUploadingError'));
      console.log(error)
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
      description: data.description,
      category: category,
      price: data.price,
      discount: data.discount ? data.discount : null,
      likes: data.likes,
      recipeSteps: steps as RecipeStep[],
      ingredients: data.ingredients,
      heroImg: heroImgResult.imageUrl,
      preparingTime: data.preparingTime,
      videoUrl: videoUrl,  // R2 key stored as videoUrl
    };
  };


  const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
    setIsPending(true);

    try {
      // Generate recipe ID before upload - used as folder name in storage
      const recipeId = uuidv4();
      const premiumRecipeId = uuidv4();

      const recipeData = await handleFormData(formData, recipeId);

      if (recipeData === null) {
        setIsPending(false);
        throw new Error();
      }

      if (formData.isPremium) {

        // Premium рецепт: insert в main table + premium table
        const stepsCount = recipeData.recipeSteps.length;
        const premiumMainData: IRecipeUploadPremiumMain = {
          id: recipeId,
          title: recipeData.title,
          description: recipeData.description,
          likes: recipeData.likes,
          category: recipeData.category,
          ingredients: recipeData.ingredients,
          heroImg: recipeData.heroImg,
          isPremium: true as const,
          preparingTime: recipeData.preparingTime,
          premiumId: premiumRecipeId,
          stepsCount,
        };

        await insertRecipePremiumMain(premiumMainData, stepsCount);

        const premiumPartData: IRecipePremiumUpload = {
          id: premiumRecipeId,
          recipeId: recipeId,
          recipeSteps: recipeData.recipeSteps,
          videoUrl: recipeData.videoUrl,
          price: recipeData.price,
          discount: recipeData.discount,
        };

        await insertPremiumRecipePart(premiumPartData);
      } else {
        // Public рецепт: все данные в main table
        const publicData: IRecipeUploadPublic = {
          id: recipeId,
          title: recipeData.title,
          description: recipeData.description,
          likes: recipeData.likes,
          category: recipeData.category,
          ingredients: recipeData.ingredients,
          heroImg: recipeData.heroImg,
          isPremium: false as const,
          preparingTime: recipeData.preparingTime,
          recipeSteps: recipeData.recipeSteps,
          videoUrl: recipeData.videoUrl,
          stepsCount: recipeData.recipeSteps.length,
        };

        await insertRecipePublic(publicData);
      }


      setIsSuccess(true);
      reset();
      setStepImageUrls([]);
      setHeroImg(null);
      setVideoUrl(null);
    } catch {
      setError(t('form.validation.recipeNotUploaded'));
    } finally {
      setIsPending(false);
      const timerId = setTimeout(() => setIsSuccess(false), 5000);

      return () => timerId && clearTimeout(timerId);
    }
  };

  const isPremium = watch('isPremium');

  return (
    <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8 pb-16">
      {/* Header */}
      <div className="text-center py-8 sm:py-11">
        <h1 className="font-serif text-4xl sm:text-5xl italic font-normal text-text mb-2">
          {t('form.title')}
        </h1>
        <p className="text-sm text-muted">{t('form.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}
            id="add-new-recipe-form"
            className="space-y-9">

        {/* Basic Info Section */}
        <div className="p-6 sm:p-8 bg-surface border border-border">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-6 pb-3.5 border-b border-border">
            <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
              <span className="text-[11px] text-accent font-semibold">1</span>
            </div>
            <span className="font-serif text-xl text-text">{t('form.sections.basicInfo')}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.title')}
                </label>
                <input {...register('title.ua', {required: true})}
                       className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                       type="text"
                       placeholder={t('form.fields.titlePlaceholderUa')}
                />
              </div>
              <button className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
                      onClick={(e) => handleTranslateText(e, 'title')}>
                Translate to English →
              </button>
              <input {...register('title.en', {required: true})}
                     className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                     type="text"
                     placeholder={t('form.fields.titlePlaceholderEn')}/>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.description')}
                </label>
                <textarea {...register('description.ua', {required: true})}
                       className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                       placeholder={t('form.fields.descriptionPlaceholderUa')}
                />
              </div>
              <button className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
                      onClick={(e) => handleTranslateText(e, 'description')}>
                Translate to English →
              </button>
              <textarea {...register('description.en', {required: true})}
                     className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                     placeholder={t('form.fields.descriptionPlaceholderEn')}/>
            </div>

            {/* Paid content toggle */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-xs text-muted tracking-[0.05em]">{t('form.fields.premiumContent')}</div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('isPremium')} className="sr-only peer"/>
                <div className="w-9 h-5 border border-border bg-surface transition-colors
                                after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-gray-500 after:transition-all
                                peer-checked:after:left-[18px] relative peer-checked:after:bg-accent"/>
              </label>
            </div>

            {isPremium && (
              <div>
                <div className="mt-3.5">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                    {t('form.fields.price')}
                  </label>
                  <div className="relative">
                    <input {...register('price', {required: true, min: 1, max: 10000})}
                           name="price"
                           aria-invalid={errors.price ? "true" : "false"}
                           className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                           type="number"/>
                    <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">$</span>
                  </div>
                </div>
                <div className="mt-3.5">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                    {t('form.fields.discount')}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">{t('form.fields.likes')}</label>
                <input {...register('likes')}
                       className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                       type="number"
                       placeholder="0"/>
              </div>

              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">{t('form.fields.category')}</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none"
                  {...register('category')}
                >
                  {categories.filter(cat => cat.en !== "All recipes").map((category, i) => (
                    <option key={i}
                            value={category.en}>{category[locale as Locale]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3.5">
              <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                {t('form.fields.preparingTime')}
              </label>
              <div className="relative">
                <input {...register('preparingTime', {required: true, min: 1, max: 1000})}
                       name="preparingTime"
                       aria-invalid={errors.preparingTime ? "true" : "false"}
                       className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                       type="number"/>
                <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">{t('form.fields.minutes')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="p-6 sm:p-8 bg-surface border border-border">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-6 pb-3.5 border-b border-border">
            <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
              <span className="text-[11px] text-accent font-semibold">2</span>
            </div>
            <span className="font-serif text-xl text-text">{t('form.sections.ingredients')}</span>
          </div>

          <div className="space-y-3 mb-4">
            <Controller
              name='ingredients'
              control={control}
              rules={{required: 'Ingredients are required'}}
              render={() => (
                <div className="space-y-3">
                  {/* Ingredient name inputs for both languages */}
                  <div className="grid grid-cols-1 gap-3">
                    <input {...register('ingredientUa')}
                           className={`w-full px-3.5 py-2.5 bg-bg border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                             error !== null && getValues('ingredients').length === 0 ? 'border-red-400' : 'border-border'
                           }`}
                           type="text"
                           placeholder={t('form.fields.ingredientPlaceholder')}/>
                    <button className="self-start px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
                            onClick={(e) => handleTranslateText(e, 'ingredient')}>
                      Translate to EN →
                    </button>
                    <input {...register('ingredientEn')}
                           className={`w-full px-3.5 py-2.5 bg-bg border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                             error !== null && getValues('ingredients').length === 0 ? 'border-red-400' : 'border-border'
                           }`}
                           type="text"
                           placeholder={t('form.fields.ingredientPlaceholderEn')}/>
                  </div>

                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                    <div>
                      <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">{t('form.fields.quantity')}</label>
                      <input {...register('ingredientQuantity')}
                             className={`w-full px-3.5 py-2.5 bg-bg border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                               error !== null && getValues('ingredients').length === 0 ? 'border-red-400' : 'border-border'
                             }`}
                             type="number"
                             placeholder={t('form.fields.quantity')}/>
                    </div>
                    <div>
                      <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">Unit</label>
                      <select
                        {...register('ingredientUnit')}
                        className="w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none"
                      >
                        {units.map((unit) => (
                          <option key={unit.value}
                                  value={unit.value}>
                            {unit.label.ua} / {unit.label.en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="px-4 py-2.5 bg-text border border-text text-bg text-[11px] tracking-[0.06em] uppercase whitespace-nowrap hover:opacity-90 transition-opacity"
                      onClick={(e) => handleIngredientsForm(e)}
                    >
                      + {t('form.buttons.add')}
                    </button>
                  </div>
                </div>
              )}
            />
            {errors.ingredients && <p className="text-red-500 text-sm">{t('form.validation.addAtLeastOneIngredient')}</p>}
          </div>

          {validationErrorIngredients && (
            <div className="pb-4 text-red-500 text-sm">{validationErrorIngredients}</div>
          )}

          <div className="flex items-center justify-start gap-2 flex-wrap">
            {ingredientFields.map((item, index) => (
              <div
                className="flex flex-row items-center gap-2 px-3 py-1.5 border border-border bg-bg text-sm text-text"
                key={item.id}
              >
                <span>{item.value.ua}</span>
                <span className="text-muted">|</span>
                <span className="text-muted">{item.value.en}</span>
                <span className="text-accent">-</span>
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
        <div className="p-6 sm:p-8 bg-surface border border-border">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-6 pb-3.5 border-b border-border">
            <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
              <span className="text-[11px] text-accent font-semibold">3</span>
            </div>
            <span className="font-serif text-xl text-text">{t('form.sections.heroImage')}</span>
          </div>
          <div>
            {heroImg ? (
              <div className="relative">
                <Image
                  className="w-full object-cover"
                  width={300}
                  height={200}
                  src={heroImg}
                  alt="Uploaded image"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  onClick={deleteHeroImg}
                >
                  <MdDeleteForever className="text-lg"/>
                </button>
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-3.5 w-full py-12 border border-dashed border-border cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
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
                <span className="text-[11px] text-muted opacity-60">PNG, JPG up to 10MB</span>
                {errors.heroImg && <p className="text-red-500 text-sm">{errors.heroImg.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Steps Section */}
        <section className="p-6 sm:p-8 bg-surface border border-border">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-6 pb-3.5 border-b border-border">
            <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
              <span className="text-[11px] text-accent font-semibold">4</span>
            </div>
            <span className="font-serif text-xl text-text">{t('form.sections.steps')}</span>
          </div>

          <div className="space-y-3">
            {stepFields.map((field, index) => (
              <div
                key={field.id}
                className="border border-border p-4 sm:p-5 bg-bg"
              >
                <div className="grid grid-cols-[32px_1fr_auto] gap-3.5 items-center mb-4">
                  <span className="text-[11px] text-accent font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-muted italic truncate">
                    {getValues(`recipeSteps.${index}.desc.ua`) || t('form.fields.step') + ' ' + (index + 1)}
                  </span>
                  <button
                    type="button"
                    className="text-sm text-muted hover:text-red-500 transition-colors"
                    onClick={() => deleteStep(index)}
                  >
                    ✕
                  </button>
                </div>

                {stepImageUrls[index] ? (
                  <div className="relative mb-3">
                    <Image
                      className="w-full object-cover"
                      width={300}
                      height={200}
                      src={stepImageUrls[index]}
                      alt="Uploaded image"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      onClick={() => deleteStepsImg(index)}
                    >
                      <MdDeleteForever className="text-lg"/>
                    </button>
                  </div>
                ) : (
                  <div
                    className="w-full py-8 flex items-center justify-center border border-dashed border-border mb-3">
                    <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                      <input
                        type="file"
                        hidden
                        multiple={false}
                        accept="image/*"
                        onChange={(e) => handleFiles(e, index)}
                      />
                      {t('form.buttons.addPicture')}
                    </label>
                  </div>
                )}

                {/* Step description with language tabs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                      {t('form.fields.stepDescLabel')}
                    </label>
                    <textarea
                      {...register(`recipeSteps.${index}.desc.ua`, {required: t('form.validation.addAtLeastOneStep')})}
                      placeholder={t('form.fields.stepDescPlaceholderUa')}
                      rows={3}
                      className={`w-full px-3.5 py-2.5 bg-surface border ${errors.recipeSteps?.[index]?.desc?.ua ? 'border-red-400' : 'border-border'} text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none`}
                    />
                  </div>
                  <button className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-surface transition-colors"
                          onClick={(e) => handleTranslateText(e, 'stepDescription', index)}>
                    Translate to English →
                  </button>
                  <div>
                    <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                      {t('form.fields.stepDescLabelEn')}
                    </label>
                    <textarea
                      {...register(`recipeSteps.${index}.desc.en`, {required: 'Add description in English'})}
                      placeholder={t('form.fields.stepDescPlaceholderEn')}
                      rows={3}
                      className={`w-full px-3.5 py-2.5 bg-surface border ${errors.recipeSteps?.[index]?.desc?.en ? 'border-red-400' : 'border-border'} text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Add new step button */}
          <button
            className={`w-full py-5 border border-dashed ${error && stepFields.length === 0 ? 'border-red-400' : 'border-border'} flex items-center justify-center gap-2.5 text-[11px] tracking-[0.06em] text-accent hover:bg-bg transition-colors mb-3`}
            type="button"
            onClick={() => appendStep({desc: {en: '', ua: ''}, image: null})}
          >
            + {t('form.buttons.addNewStep')}
          </button>
          {error && stepFields.length === 0 && (
            <p className="text-center pb-3 text-red-500 text-sm">{t('form.validation.addAtLeastOneStep')}</p>
          )}
        </section>

        {/*Video section*/}
        <section className="p-6 sm:p-8 bg-surface border border-border">
          {/* Section header */}
          <div className="flex items-center gap-3.5 mb-6 pb-3.5 border-b border-border">
            <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
              <span className="text-[11px] text-accent font-semibold">5</span>
            </div>
            <span className="font-serif text-xl text-text">{t('form.sections.video')}</span>
          </div>
          <div
            className="w-full flex items-center justify-center border border-dashed border-border relative">
            {videoUrl ? (
              <div className="p-1 relative flex flex-col items-center gap-2 w-full">
                <video className="w-full"
                       src={videoUrl}
                       controls></video>
                {isVideoUploading && (
                  <div className="w-full px-4">
                    <div className="flex justify-between text-sm text-muted mb-1">
                      <span>Uploading video...</span>
                      <span>{videoUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-border h-1">
                      <div
                        className="bg-accent h-1 transition-all duration-300"
                        style={{ width: `${videoUploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {videoError && (
                  <p className="text-accent text-sm">
                    {videoError} (using original file)
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3.5 py-12">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                  <Controller
                    name='videoFile'
                    control={control}
                    rules={{required: 'Video is required'}}
                    render={() => (
                      <input
                        type="file"
                        hidden
                        multiple={false}
                        accept="video/*"
                        onChange={(e) => handleFiles(e, 0)}
                      />
                    )}
                  />
                  {t('form.buttons.addVideo')}
                </label>
                <span className="text-[11px] text-muted opacity-60">MP4, MOV up to 2000MB</span>
                {errors.videoFile && <p className="text-red-500 text-sm">{errors.videoFile.message}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Submit Button */}
        <button
          className="flex flex-row items-center justify-center w-full py-4 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
          type="submit"
          disabled={isPending}
        >
          {isPending ? <Spinner/> : <>{t('form.buttons.create')} →</>}
        </button>
        {error !== null && <p className="text-center pt-2 text-red-500 text-sm">{error}</p>}
        {isSuccess && (<p className="text-center pt-2 text-green-500 text-sm">Recipe uploaded</p>)}
      </form>
    </div>
  );
};

export default Page;
