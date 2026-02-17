'use client';

import React, {useEffect, useState} from 'react';
import Image from 'next/image';
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "@/i18n/navigation";
import {useLocale, useTranslations} from "next-intl";
import {SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from 'uuid';
import {insertRecipe, IUploadData} from "@/services/db/insertRecipeToDatabase";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {MdDeleteForever} from "react-icons/md";
import {Spinner} from "@/components/ui/spinner";
import {units} from "@/constants/units";

type Locale = 'en' | 'uk';

type UnitValue = typeof units[number]['value'];

export interface Ingredients {
  value: string;
  quantity: string;
  unit: UnitValue;
  id: string;
}

export interface IFormValues {
  title: string;
  likes: number;
  category: string;
  recipeSteps: { desc: string, image: File | null; blobUrl: string; }[];
  ingredient: string;
  ingredients: Ingredients[];
  heroImg: File | null;
  ingredientQuantity: string | null;
  ingredientUnit: UnitValue;
  isPremium: boolean;
}

const Page = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [stepImageUrls, setStepImageUrls] = useState<string[]>([]);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);

  const [validationErrorIngredients, setValidationErrorIngredients] = useState('');

  const localeRaw = useLocale();
  const locale = localeRaw as Locale;

  const {register, handleSubmit, reset, control, setValue, resetField, getValues} = useForm<IFormValues>({
    defaultValues: {
      recipeSteps: [],
      title: '',
      likes: 0,
      category: 'Desserts',
      ingredient: '',
      ingredientQuantity: '',
      ingredientUnit: units[0].value,
      ingredients: [],
      heroImg: null,
      isPremium: true
    }
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: 'recipeSteps',
  })

  const {user} = useUserStore();

  const router = useRouter();
  const t = useTranslations('admin');

  const handleIngredientsForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const ingredient = getValues('ingredient')?.trim();
    const quantity = getValues('ingredientQuantity')?.trim();
    const unit = getValues('ingredientUnit')
    console.log(ingredient, quantity, unit);
    if (!ingredient || !quantity || !unit) {
      setValidationErrorIngredients('Enter All Ingredient fields');
      return;
    }


    appendIngredient({value: ingredient, quantity: quantity, unit: unit, id: uuidv4()});
    resetField('ingredient');
    resetField('ingredientQuantity');
    resetField('ingredientUnit');
    setValidationErrorIngredients('');
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] ?? null;

    if (file !== null) {
      const url = URL.createObjectURL(file);

      setStepImageUrls(prevState => ([
        ...prevState,
        url
      ]));

    }

    setValue(`recipeSteps.${index}.image`, file, {
      shouldValidate: true,
    });
  }

  const deleteStepsImg = (index: number) => {
    const newSteps = stepImageUrls.map((step, i) => i === index ? '' : step);
    setStepImageUrls(newSteps);

    setValue(`recipeSteps.${index}.image`, null);
  }

  const deleteStep = (index: number) => {
    const newSteps = stepImageUrls.filter((step, i) => i !== index);
    setStepImageUrls(newSteps);
    removeStep(index);
  }

  const handleHeroImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setValue('heroImg', file);

    if(file !== null) {
      const url = URL.createObjectURL(file);

      setHeroImg(url);
    }
  }

  const deleteHeroImg = () => {
    setHeroImg(null);
    setValue('heroImg', null);
  }

  const handleFormData = async (data: IFormValues, folder: string) => {
    const steps = [];
    const ingredients = data.ingredients.map(item => item);

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

    let heroImg;

    if(data.heroImg) {
      const fileHeroPath = `${folder}/${"heroImg" + uuidv4()}`;

      try {
        heroImg = await uploadImage({
          file: data.heroImg,
          bucket: 'images',
          filePath: fileHeroPath
        })
      } catch(error) {
        return;
      }
    }

    console.log({
      title: data.title,
      category: data.category,
      likes: data.likes,
      recipeSteps: steps,
      ingredients: ingredients,
      heroImg: heroImg  ? heroImg.imageUrl : null,
      isPremium: data.isPremium,
    });
    // return {
    //   ...data,
    //   recipeSteps: steps,
    //   ingredients: ingredients,
    //   heroImg: heroImg,
    // }
  }

  const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
    setIsPending(true);

    try {
      const recipeData: IUploadData | null = await handleFormData(formData, formData.title);

      if (recipeData === null) {
        return;
      }

      await insertRecipe(recipeData);
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
      setStepImageUrls([]);
    }

    console.log(formData, 'formData')
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user === null && mounted) {
      router.push('/');
    }
  }, [user]);

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
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">1</span>
            {t('form.sections.basicInfo')}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.fields.title')}</label>
              <input {...register('title')}
                     className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                     type="text"
                     placeholder={t('form.fields.titlePlaceholder')}/>
            </div>

            <div className="flex gap-3 items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Платний контент:</label>
              <input className="text-2xl" type="checkbox" {...register('isPremium')}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.fields.likes')}</label>
                <input {...register('likes')}
                       className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                       type="number"
                       placeholder="0"/>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('form.fields.category')}</label>
                <select
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors cursor-pointer"
                  {...register('category')}
                >
                  {['Desserts', 'Appetizers', 'Breakfast', 'Dinner', 'Soups', 'Salads', 'Main dishes', 'Side dishes'].map((category, i) => (
                    <option key={i} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">2</span>
            {t('form.sections.ingredients')}
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <input {...register('ingredient')}
                   className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                   type="text"
                   name="ingredient"
                   placeholder={t('form.fields.ingredientPlaceholder')}/>
            <input {...register('ingredientQuantity')}
                   className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                   type="text"
                   name="ingredientQuantity"
                   placeholder='Введіть кількість'/>
            <select
                    {...register('ingredientUnit')}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
                    id="units">
              {units.map((unit) => (
                <option key={unit.value} value={unit.value}>{unit.title[locale]}</option>
              ))}
            </select>
            <button
              className="px-6 py-3 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
              onClick={(e) => handleIngredientsForm(e)}
            >
              {t('form.buttons.add')}
            </button>
          </div>

          {validationErrorIngredients && (<div className='p-2 pb-4 text-red-500'>{validationErrorIngredients}</div>)}

          <div className="flex items-center justify-start gap-2 flex-wrap">
            {ingredientFields.map((item) => (
              <div
                className="flex flex-row items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-200 dark:border-gray-500 text-gray-700 dark:text-gray-200"
                key={item.id}
              >
                <span>{item.value}</span> -
                <span>{item.quantity}</span>
                <span>{item.unit}</span>
                <MdDeleteForever
                  className="text-red-500 cursor-pointer hover:text-red-600 transition-colors"
                  onClick={() => removeIngredient(+item.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/*Hero Image section*/}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">3</span>
            Hero image
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
              <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-3 bg-white dark:bg-gray-800">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
                  <input
                    type="file"
                    hidden
                    multiple={false}
                    onChange={(e) => handleHeroImg(e)}
                  />
                  {t('form.buttons.addPicture')}
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Steps Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm font-bold">4</span>
            {t('form.sections.steps')}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stepFields.map((field, index) => (
              <div
                key={field.id}
                className="bg-amber-50/50 dark:bg-gray-700/50 border-2 border-amber-100 dark:border-gray-600 rounded-2xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
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
                  <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-amber-200 dark:border-gray-500 rounded-xl mb-3 bg-white dark:bg-gray-800">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors">
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

                <textarea
                  {...register(`recipeSteps.${index}.desc`)}
                  placeholder={t('form.fields.stepDescPlaceholder', {step: index + 1})}
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none mb-3"
                />

                <button
                  type="button"
                  className="w-full py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  onClick={() => deleteStep(index)}
                >
                  {t('form.buttons.deleteStep')}
                </button>
              </div>
            ))}
          </div>

          <button
            className="mt-4 w-full py-3 rounded-xl border-2 border-dashed border-amber-300 dark:border-gray-500 text-amber-600 dark:text-amber-400 font-medium hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors"
            type="button"
            onClick={() => appendStep({desc: "", image: null, blobUrl: ''})}
          >
            + {t('form.buttons.addNewStep')}
          </button>
        </div>

        {/* Submit Button */}
        <button
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          type="submit"
          disabled={isPending}
        >
          {isPending ? <Spinner/> : t('form.buttons.create')}
        </button>
      </form>
    </div>
  );
};

export default Page;