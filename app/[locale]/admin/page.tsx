'use client';

import React, {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "@/i18n/navigation";
import {useLocale, useTranslations} from "next-intl";
import {Controller, SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import SortableItem from "@/components/admin/SortableItem";
import {v4 as uuidv4} from 'uuid';
import {ulid} from "ulid";
import {createRecipe} from "@/services/api/admin/createRecipe";
import {MdDeleteForever} from "react-icons/md";
import {Spinner} from "@/components/ui/spinner";
import {units} from "@/constants/units";
import {categories} from "@/constants/categories";
import {IFormValues, IngredientGroupFormValues, Locale} from "@/types/forms";
import {uploadVideoToStream} from "@/services/storage/uploadVideoToStream";
import {
  IRecipeUploadPublic,
  IRecipeUploadPremiumMain,
  IRecipePremiumUpload,
  RecipeStep,
} from "@/types/recipe";
import {uploadImageServer} from "@/services/api/admin/uploadImageServer";

const createEmptyGroup = (): IngredientGroupFormValues => ({
  id: uuidv4(),
  title: {en: '', uk: ''},
  ingredients: [],
  draft: {uk: '', en: '', quantity: '', unit: units[0].value},
});

// localStorage key for persisting the in-progress recipe form across reloads
const FORM_STORAGE_KEY = 'admin-recipe-form-draft';

// File objects can't be serialized to localStorage, so strip them before saving.
// Only the text data is persisted; images and video must be re-selected after a reload.
const stripFilesForStorage = (values: IFormValues): IFormValues => ({
  ...values,
  heroImg: null,
  videoFile: null,
  recipeSteps: values.recipeSteps.map((step) => ({...step, image: null})),
});

const Page = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const [stepImageUrls, setStepImageUrls] = useState<string[]>([]);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isVideoUploading, setIsVideoUploading] = useState<boolean>(false);

  const heroImgInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    getValues,
    watch,
    formState: {errors}
  } = useForm<IFormValues>({
    defaultValues: {
      recipeSteps: [],
      title: {en: '', uk: ''},
      description: {en: '', uk: ''},
      likes: 0,
      category: categories.find(cat => cat.en === 'Desserts')?.en,
      price: {en: 0, uk: 0},
      discount: 0,
      ingredientGroups: [createEmptyGroup()],
      heroImg: null,
      isPremium: true,
      preparingTime: 0,
      weight: null,
      diameter: null,
      calories: null,
      videoFile: null,
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

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    useSensor(TouchSensor, {activationConstraint: {distance: 8}}),
  );

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({
    control,
    name: 'recipeSteps',
  });

  const {user} = useUserStore();

  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Restore any in-progress form data saved before a reload.
    // keepDefaultValues preserves the original empty defaults so a later
    // no-arg reset() clears the form instead of reverting to this draft.
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) {
        reset(JSON.parse(saved) as IFormValues, {keepDefaultValues: true});
      }
    } catch {
      // Ignore corrupted drafts
    }

    setIsHydrated(true);
  }, []);

  // Persist text data to localStorage on every change so a reload won't lose it
  useEffect(() => {
    if (!isHydrated) return;

    const subscription = watch((values) => {
      try {
        localStorage.setItem(
          FORM_STORAGE_KEY,
          JSON.stringify(stripFilesForStorage(values as IFormValues))
        );
      } catch {
        // Ignore storage quota / serialization errors
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, isHydrated]);

  useEffect(() => {
    if (user === null && mounted) {
      router.push('/');
    }
  }, [user, router]);

  const handleIngredientsForm = (e: React.MouseEvent<HTMLButtonElement>, groupIndex: number) => {
    e.preventDefault();
    const draft = getValues(`ingredientGroups.${groupIndex}.draft`);
    const ingredientUk = draft.uk?.trim();
    const ingredientEn = draft.en?.trim();
    const quantity = draft.quantity?.trim();
    const unit = draft.unit;

    if (!ingredientUk || !ingredientEn || !quantity || !unit) {
      setValidationErrorIngredients(t('form.validation.fillAllIngredientFields'));
      return;
    }

    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    setValue(`ingredientGroups.${groupIndex}.ingredients`, [
      ...ingredients,
      {
        value: {en: ingredientEn, uk: ingredientUk},
        quantity: quantity,
        unit: unit,
        id: uuidv4()
      }
    ]);
    setValue(`ingredientGroups.${groupIndex}.draft`, {uk: '', en: '', quantity: '', unit: units[0].value});
    setValidationErrorIngredients('');
  };

  const removeIngredientFromGroup = (groupIndex: number, ingredientId: string) => {
    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    setValue(
      `ingredientGroups.${groupIndex}.ingredients`,
      ingredients.filter((ingredient) => ingredient.id !== ingredientId)
    );
  };

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const groups = getValues('ingredientGroups');
    const oldIndex = groups.findIndex((group) => group.id === active.id);
    const newIndex = groups.findIndex((group) => group.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    moveGroup(oldIndex, newIndex);
  };

  const handleIngredientDragEnd = (event: DragEndEvent, groupIndex: number) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const ingredients = getValues(`ingredientGroups.${groupIndex}.ingredients`);
    const oldIndex = ingredients.findIndex((item) => item.id === active.id);
    const newIndex = ingredients.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    setValue(`ingredientGroups.${groupIndex}.ingredients`, arrayMove(ingredients, oldIndex, newIndex));
  };

  const handleStepDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stepFields.findIndex((field) => field.id === active.id);
    const newIndex = stepFields.findIndex((field) => field.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    moveStep(oldIndex, newIndex);
    // Keep the parallel preview-URL array aligned with the reordered steps
    setStepImageUrls((prev) => arrayMove(prev, oldIndex, newIndex));
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

  type TranslateInputs =
    | 'title.uk'
    | 'description.uk'
    | `ingredientGroups.${number}.draft.uk`
    | `ingredientGroups.${number}.title.uk`
    | `recipeSteps.${number}.desc.uk`;

  const handleTranslateText = async (e: React.MouseEvent<HTMLButtonElement>, flag: string, index?: number) => {
    e.preventDefault();
    const inputFields: Record<string, TranslateInputs> = {
      title: 'title.uk',
      description: 'description.uk',
      ...(index !== undefined && {
        ingredient: `ingredientGroups.${index}.draft.uk`,
        groupTitle: `ingredientGroups.${index}.title.uk`,
        stepDescription: `recipeSteps.${index}.desc.uk`
      })
    }

    const textUk = getValues(inputFields[flag]);

    if (!textUk) return;

    const res = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({text: textUk})
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

  const deleteVideoPreview = () => {
    setVideoUrl(null);
  }

  const resetFormValues = () => {
    reset();
    localStorage.removeItem(FORM_STORAGE_KEY);
    setStepImageUrls([]);
    setHeroImg(null);
    setVideoUrl(null);
  }

  const handleFormData = async (data: IFormValues, folder: string) => {
    setError(null);

    if (data.ingredientGroups.length === 0 || data.heroImg === null || data.recipeSteps.length === 0) {
      setError(t('form.validation.fillAllFields'));
      return null;
    }

    for (const group of data.ingredientGroups) {
      if (group.ingredients.length === 0) {
        setError(t('form.validation.addAtLeastOneIngredientInGroup'));
        return null;
      }
    }

    // Group titles are required only when there is more than one group
    if (data.ingredientGroups.length > 1) {
      for (const group of data.ingredientGroups) {
        if (!group.title.en.trim() || !group.title.uk.trim()) {
          setError(t('form.validation.enterGroupTitleBothLanguages'));
          return null;
        }
      }
    }

    if (!data.title.en || !data.title.uk) {
      setError(t('form.validation.enterTitleBothLanguages'));
      return null;
    }

    if (!data.description.en || !data.description.uk) {
      setError(t('form.validation.enterDescriptionBothLanguages'));
      return null;
    }

    for (const step of data.recipeSteps) {
      if (!step.desc.en || !step.desc.uk) {
        setError(t('form.validation.enterStepsBothLanguages'));
        return null;
      }
    }

    if (!data.videoFile) {
      setError(t('form.validation.enterVideoFile'));
      return null;
    }

    if (data.isPremium && (data.price.en === 0)) {
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
      const {videoUrl: videoKey, error} = await uploadVideoToStream({
        videoFile: data.videoFile,
        recipeId: folder, // folder is actually recipeId
        isPremium: data.isPremium,
        name: data.title.en,
        onProgress: (percentage) => setVideoUploadProgress(percentage),
      });

      if (error) throw new Error(error);

      videoUrl = videoKey;

      setIsVideoUploading(false);
    } catch (error) {
      setVideoError(t('form.validation.videoUploadingError'));
      console.log(error);
      return null;
    }

    for (const step of data.recipeSteps) {
      const {desc, image} = step;
      let imgPath: string | null = null;

      const filePath = `${folder}/step-img-${uuidv4()}`;

      if (image !== null) {
        const {imagePath, error} = await uploadImageServer(image, 'steps', filePath);

        if (error) {
          return null;
        }

        imgPath = imagePath;
      }
      steps.push({
        desc,
        imgUrl: imgPath,
        id: uuidv4(),
      });
    }

    const fileHeroPath = `${folder}/hero-img-${uuidv4()}`;

    let heroImgPath: string;
    try {
      const {imagePath, error} = await uploadImageServer(data.heroImg, 'hero-images', fileHeroPath);

      if (error) {
        setError(t('form.validation.reloadHeroImage'));
        return null;
      }

      heroImgPath = imagePath;
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
      ingredients: data.ingredientGroups.map(({id, title, ingredients}) => ({id, title, ingredients})),
      heroImg: heroImgPath,
      preparingTime: data.preparingTime,
      weight: data.weight || null,
      diameter: data.diameter || null,
      calories: data.calories || null,
      videoUrl: videoUrl,  // R2 key stored as videoUrl
      slug: data.slug,
    };
  };


  const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
    setIsPending(true);

    try {
      // Generate recipe ID before upload - used as folder name in storage
      const recipeId = ulid();
      const premiumRecipeId = uuidv4();

      const recipeData = await handleFormData(formData, recipeId);

      if (recipeData === null) {
        return;
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
          weight: recipeData.weight,
          diameter: recipeData.diameter,
          calories: recipeData.calories,
          premiumId: premiumRecipeId,
          slug: recipeData.slug,
          stepsCount,
        };

        const premiumPartData: IRecipePremiumUpload = {
          id: premiumRecipeId,
          recipeId: recipeId,
          recipeSteps: recipeData.recipeSteps,
          videoUrl: recipeData.videoUrl,
          price: recipeData.price,
          discount: recipeData.discount,
        };

        await createRecipe({
          isPremium: true,
          main: premiumMainData,
          stepsCount,
          premium: premiumPartData,
        });
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
          weight: recipeData.weight,
          diameter: recipeData.diameter,
          calories: recipeData.calories,
          recipeSteps: recipeData.recipeSteps,
          videoUrl: recipeData.videoUrl,
          stepsCount: recipeData.recipeSteps.length,
          slug: recipeData.slug,
        };

        await createRecipe({isPremium: false, recipe: publicData});
      }


      setIsSuccess(true);
      reset();
      localStorage.removeItem(FORM_STORAGE_KEY);
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

  const watchedGroups = watch('ingredientGroups');

  const engTitle = watch('title.en');

  const generateSlug = (str: string): string => {
    if (str.trim() !== '') {
      return engTitle.trim().toLowerCase().split(' ').join('-');
    }

    return '';
  };

  useEffect(() => {
    if (engTitle.trim()) {
      const slug = generateSlug(engTitle);

      setValue('slug', slug);
    }
  }, [engTitle, generateSlug]);

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
          <div className="flex items-center justify-between gap-2 mb-6 pb-3.5 border-b border-border">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 border border-border flex items-center justify-center shrink-0">
                <span className="text-[11px] text-accent font-semibold">1</span>
              </div>
              <span className="font-serif text-xl text-text">{t('form.sections.basicInfo')}</span>
            </div>
            <button className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
                    type='button'
                    onClick={resetFormValues}>Reset
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.title')}
                </label>
                <input {...register('title.uk', {required: true})}
                       className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                       type="text"
                       placeholder={t('form.fields.titlePlaceholderUk')}
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
              <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                Slug
              </label>
              <input {...register('slug', {required: true})}
                     className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                     type="text"
                     placeholder='URL slug'/>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.description')}
                </label>
                <textarea {...register('description.uk', {required: true})}
                          className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                          placeholder={t('form.fields.descriptionPlaceholderUk')}
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
                <input type="checkbox" {...register('isPremium')}
                       className="sr-only peer"/>
                <div className="w-9 h-5 border border-border bg-surface transition-colors
                                after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-0.5 after:w-3.5 after:h-3.5 after:bg-gray-500 after:transition-all
                                peer-checked:after:left-[18px] relative peer-checked:after:bg-accent"/>
              </label>
            </div>

            {isPremium && (
              <div>
                <div className="mt-3.5">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                    {t('form.fields.price')} (USD)
                  </label>
                  <div className="relative">
                    <input {...register('price.en', {required: true, min: 0, max: 10000, valueAsNumber: true})}
                           name="price.en"
                           aria-invalid={errors.price?.en ? "true" : "false"}
                           className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                           type="number"/>
                    <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">$</span>
                  </div>
                </div>
                <div className="mt-3.5">
                  <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                    {t('form.fields.price')} (UAH)
                  </label>
                  <div className="relative">
                    <input {...register('price.uk')}
                           name="price.uk"
                           aria-invalid={errors.price?.uk ? "true" : "false"}
                           className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                           type="number"/>
                    <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">₴</span>
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

            <div className="mt-3.5 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.weight')}
                </label>
                <div className="relative">
                  <input {...register('weight', {min: 0})}
                         className="w-full px-3.5 py-2.5 pr-10 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">g</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.diameter')}
                </label>
                <div className="relative">
                  <input {...register('diameter', {min: 0})}
                         className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">cm</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                  {t('form.fields.calories')}
                </label>
                <div className="relative">
                  <input {...register('calories', {min: 0})}
                         className="w-full px-3.5 py-2.5 pr-12 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                         type="number"/>
                  <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[11px] text-muted tracking-[0.04em]">kcal</span>
                </div>
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

          <DndContext
            id="ingredient-groups"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleGroupDragEnd}
          >
            <SortableContext items={watchedGroups?.map(group => group.id) ?? []}
                             strategy={verticalListSortingStrategy}>
              <div className="space-y-5">
                {groupFields.map((groupField, groupIndex) => (
                  <SortableItem
                    key={groupField.id}
                    itemId={watchedGroups?.[groupIndex]?.id ?? groupField.id}
                    className="border border-border p-4 sm:p-5 bg-bg"
                  >
                    {(dragHandle) => (
                      <>
                        {/* Group header */}
                        <div className="grid grid-cols-[auto_32px_1fr_auto] gap-3.5 items-center mb-4">
                          {dragHandle}
                          <span className="text-[11px] text-accent font-semibold">
                    {String(groupIndex + 1).padStart(2, '0')}
                  </span>
                          <span className="text-sm text-muted italic truncate">
                    {watchedGroups?.[groupIndex]?.title.uk || t('form.fields.group') + ' ' + (groupIndex + 1)}
                  </span>
                          <button
                            type="button"
                            className="p-1 text-muted hover:text-red-500 transition-colors"
                            onClick={() => removeGroup(groupIndex)}
                          >
                            <MdDeleteForever className="text-lg"/>
                          </button>
                        </div>

                        {/* Group title inputs */}
                        <div className="space-y-3 mb-5">
                          <div>
                            <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">
                              {t('form.fields.groupTitle')}
                            </label>
                            <input {...register(`ingredientGroups.${groupIndex}.title.uk`)}
                                   className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                                   type="text"
                                   placeholder={t('form.fields.groupTitlePlaceholderUk')}/>
                          </div>
                          <button className="px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-surface transition-colors"
                                  onClick={(e) => handleTranslateText(e, 'groupTitle', groupIndex)}>
                            Translate to English →
                          </button>
                          <input {...register(`ingredientGroups.${groupIndex}.title.en`)}
                                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                                 type="text"
                                 placeholder={t('form.fields.groupTitlePlaceholderEn')}/>
                        </div>

                        {/* Ingredient inputs */}
                        <div className="space-y-3 mb-4">
                          <div className="grid grid-cols-1 gap-3">
                            <input {...register(`ingredientGroups.${groupIndex}.draft.uk`)}
                                   className={`w-full px-3.5 py-2.5 bg-surface border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                                     error !== null && watchedGroups?.[groupIndex]?.ingredients.length === 0 ? 'border-red-400' : 'border-border'
                                   }`}
                                   type="text"
                                   placeholder={t('form.fields.ingredientPlaceholder')}/>
                            <button className="self-start px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-surface transition-colors"
                                    onClick={(e) => handleTranslateText(e, 'ingredient', groupIndex)}>
                              Translate to EN →
                            </button>
                            <input {...register(`ingredientGroups.${groupIndex}.draft.en`)}
                                   className={`w-full px-3.5 py-2.5 bg-surface border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                                     error !== null && watchedGroups?.[groupIndex]?.ingredients.length === 0 ? 'border-red-400' : 'border-border'
                                   }`}
                                   type="text"
                                   placeholder={t('form.fields.ingredientPlaceholderEn')}/>
                          </div>

                          {/* Quantity and Unit */}
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                            <div>
                              <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">{t('form.fields.quantity')}</label>
                              <input {...register(`ingredientGroups.${groupIndex}.draft.quantity`)}
                                     className={`w-full px-3.5 py-2.5 bg-surface border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors ${
                                       error !== null && watchedGroups?.[groupIndex]?.ingredients.length === 0 ? 'border-red-400' : 'border-border'
                                     }`}
                                     type="number"
                                     placeholder={t('form.fields.quantity')}/>
                            </div>
                            <div>
                              <label className="block text-[11px] tracking-[0.08em] uppercase text-muted mb-2">Unit</label>
                              <select
                                {...register(`ingredientGroups.${groupIndex}.draft.unit`)}
                                className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none"
                              >
                                {units.map((unit) => (
                                  <option key={unit.value}
                                          value={unit.value}>
                                    {unit.label.uk} / {unit.label.en}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              className="px-4 py-2.5 bg-text border border-text text-bg text-[11px] tracking-[0.06em] uppercase whitespace-nowrap hover:opacity-90 transition-opacity"
                              onClick={(e) => handleIngredientsForm(e, groupIndex)}
                            >
                              + {t('form.buttons.add')}
                            </button>
                          </div>
                        </div>

                        {/* Added ingredients */}
                        <DndContext
                          id={`group-ingredients-${groupIndex}`}
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(e) => handleIngredientDragEnd(e, groupIndex)}
                        >
                          <SortableContext items={watchedGroups?.[groupIndex]?.ingredients.map(item => item.id) ?? []}>
                            <div className="flex items-center justify-start gap-2 flex-wrap">
                              {watchedGroups?.[groupIndex]?.ingredients.map((item) => (
                                <SortableItem
                                  key={item.id}
                                  itemId={item.id}
                                  className="flex flex-row items-center gap-2 px-3 py-1.5 border border-border bg-surface text-sm text-text"
                                >
                                  {(ingredientDragHandle) => (
                                    <>
                                      {ingredientDragHandle}
                                      <span>{item.value.uk}</span>
                                      <span className="text-muted">|</span>
                                      <span className="text-muted">{item.value.en}</span>
                                      <span className="text-accent">-</span>
                                      <span>{item.quantity} {item.unit}</span>
                                      <MdDeleteForever
                                        className="text-red-500 cursor-pointer hover:text-red-600 transition-colors"
                                        onClick={() => removeIngredientFromGroup(groupIndex, item.id)}
                                      />
                                    </>
                                  )}
                                </SortableItem>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      </>
                    )}
                  </SortableItem>
                ))}

                {validationErrorIngredients && (
                  <div className="text-red-500 text-sm">{validationErrorIngredients}</div>
                )}

                {/* Add new group button */}
                <button
                  className="w-full py-5 border border-dashed border-border flex items-center justify-center gap-2.5 text-[11px] tracking-[0.06em] text-accent hover:bg-bg transition-colors"
                  type="button"
                  onClick={() => appendGroup(createEmptyGroup())}
                >
                  + {t('form.buttons.addGroup')}
                </button>
              </div>
            </SortableContext>
          </DndContext>
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
                  sizes="(min-width: 1024px) 50vw, 100vw"
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
                onClick={() => heroImgInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3.5 w-full py-12 border border-dashed border-border cursor-pointer">
                <svg width="24"
                     height="24"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="1.5"
                     className="text-muted">
                  <rect x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"/>
                  <circle cx="8.5"
                          cy="8.5"
                          r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <Controller
                  name='heroImg'
                  control={control}
                  rules={{required: 'Main image is required'}}
                  render={() => (
                    <input
                      type="file"
                      ref={heroImgInputRef}
                      hidden
                      multiple={false}
                      onChange={(e) => handleHeroImg(e)}
                    />
                  )}
                />
                <span className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                  {t('form.buttons.addPicture')}
                </span>
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

          <DndContext
            id="recipe-steps"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStepDragEnd}
          >
            <SortableContext items={stepFields.map((field) => field.id)}
                             strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {stepFields.map((field, index) => (
                  <SortableItem
                    key={field.id}
                    itemId={field.id}
                    className="border border-border p-4 sm:p-5 bg-bg"
                  >
                    {(dragHandle) => (
                      <>
                        <div className="grid grid-cols-[auto_32px_1fr_auto] gap-3.5 items-center mb-4">
                          {dragHandle}
                          <span className="text-[11px] text-accent font-semibold">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm text-muted italic truncate">
                            {getValues(`recipeSteps.${index}.desc.uk`) || t('form.fields.step') + ' ' + (index + 1)}
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
                      sizes="(min-width: 1024px) 50vw, 100vw"
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
                      {...register(`recipeSteps.${index}.desc.uk`, {required: t('form.validation.addAtLeastOneStep')})}
                      placeholder={t('form.fields.stepDescPlaceholderUk')}
                      rows={3}
                      className={`w-full px-3.5 py-2.5 bg-surface border ${errors.recipeSteps?.[index]?.desc?.uk ? 'border-red-400' : 'border-border'} text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors resize-none`}
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
                      </>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {/* Add new step button */}
          <button
            className={`w-full py-5 border border-dashed ${error && stepFields.length === 0 ? 'border-red-400' : 'border-border'} flex items-center justify-center gap-2.5 text-[11px] tracking-[0.06em] text-accent hover:bg-bg transition-colors mb-3`}
            type="button"
            onClick={() => appendStep({desc: {en: '', uk: ''}, image: null})}
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
                        style={{width: `${videoUploadProgress}%`}}
                      ></div>
                    </div>
                  </div>
                )}
                {videoError && (
                  <p className="text-accent text-sm">
                    {videoError} (using original file)
                  </p>
                )}

                <button
                  type="button"
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  onClick={deleteVideoPreview}
                >
                  <MdDeleteForever className="text-lg"/>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3.5 py-12 w-full h-full cursor-pointer"
                    onClick={() => videoInputRef.current?.click()}
              >
                <svg width="24"
                     height="24"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     strokeWidth="1.5"
                     className="text-muted">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1"
                        y="5"
                        width="15"
                        height="14"
                        rx="2"/>
                </svg>
                <span className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                  {t('form.buttons.addVideo')}
                </span>
                <Controller
                  name='videoFile'
                  control={control}
                  rules={{required: 'Video is required'}}
                  render={() => (
                    <input
                      type="file"
                      ref={videoInputRef}
                      hidden
                      multiple={false}
                      accept="video/*"
                      onChange={(e) => handleFiles(e, 0)}
                    />
                  )}
                />
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
