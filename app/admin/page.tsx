'use client';

import React, {useEffect, useRef, useState} from 'react';
import Image from 'next/image';
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from 'next/navigation'
import {SubmitHandler, useFieldArray, useForm} from "react-hook-form";
import {v4 as uuidv4} from 'uuid';
import {insertRecipe, IUploadData} from "@/services/db/insertRecipeToDatabase";
import {uploadImage} from "@/services/storage/uploadImagetoStorage";
import {MdDeleteForever} from "react-icons/md";
import {Spinner} from "@/components/ui/spinner";
import Link from "next/link";


export interface IFormValues {
  title: string;
  likes: number;
  category: string;
  recipeSteps: { desc: string, image: File | null; blobUrl: string; }[];
  ingredient: string;
  ingredients: { value: string }[];
}

const Page = () => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [stepImageUrls, setStepImageUrls] = useState<{[key: string]: string}>({});
  const [isPending, setIsPending] = useState<boolean>(false);

  const {register, handleSubmit, reset, control, setValue, resetField, getValues} = useForm<IFormValues>({
    defaultValues: {
      recipeSteps: [{desc: "", image: null, blobUrl: ''}],
      title: '',
      likes: 0,
      category: 'Appetizers',
      ingredient: '',
      ingredients: []
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

  const handleIngredientsForm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const ingredient = getValues('ingredient')?.trim();

    if (!ingredient) {
      return;
    }

    appendIngredient({value: ingredient});
    resetField('ingredient');
  }

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0] ?? null;

    if (file !== null) {
      const url = URL.createObjectURL(file);

      setStepImageUrls(prevState => ({
        ...prevState,
        [index]: url,
      }));

    }

    setValue(`recipeSteps.${index}.image`, file, {
      shouldValidate: true,
    });

    console.log(stepFields);
  }

  const handleFormData = async (data: IFormValues, folder: string) => {
    const steps = [];
    const ingredients = data.ingredients.map(item => item.value);

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
          console.error(error);
          continue;
        }

        imgUrl = imageUrl;
      }
      steps.push({
        desc,
        imgUrl
      });
    }
    return {
      ...data,
      recipeSteps: steps,
      ingredients: ingredients,
    }
  }

  const onSubmit: SubmitHandler<IFormValues> = async (formData) => {
    setIsPending(true);

    try {
      const recipeData: IUploadData = await handleFormData(formData, formData.title);

      if (recipeData === null) {
        return;
      }

      await insertRecipe(recipeData);
      reset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPending(false);
      setStepImageUrls({});
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
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">

      <form onSubmit={handleSubmit(onSubmit)}
            id="add-new-recipe-form"
            className="mt-5">
          <h1 className='text-3xl mb-3 text-center'>Add new recipe</h1>
        <div>
          <input {...register(('title'))}
                 className="px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body my-2"
                 type="text"
                 placeholder='Enter recipe title'/>
          <input {...register(('likes'))}
                 className="px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand block w-full placeholder:text-body my-2"
                 type="number"
                 placeholder='Enter recipe title'/>
          <select
            defaultValue="Appetizers"
            className="px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand block w-1/3 placeholder:text-body my-2"
            id="recipe-category"
            {...register('category')}
          >
            {['Appetizers', 'Breakfast', 'Dinner', 'Soups', 'Salads', 'Main dishes', 'Side dishes', 'Desserts'].map((category, i) => (
              <option key={i}
                      value={category}>{category}</option>
            ))}
          </select>

          <div className='flex items-center justify-start gap-2'>
            <input {...register('ingredient')}
                   className="px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand block w-1/2 placeholder:text-body my-2"
                   type="text"
                   name="ingredient"
                   placeholder='Enter ingredient'/>
            <button className="p-2 rounded-xl bg-violet-50 text-violet-700 hover:file:bg-violet-100 dark:bg-violet-600 dark:text-violet-100 dark:hover:bg-violet-500"
                    onClick={(e) => handleIngredientsForm(e)}>
              Add ingredient
            </button>
          </div>

          <div className='flex items-center justify-start gap-2 flex-wrap my-2 w-1/2'>
            {ingredientFields.map((item) => (
              <div className='flex flex-row items-center justify-between gap-2 px-2 py-1 rounded bg-gray-700 dark:bg-pink-100 text-white dark:text-black'
                   key={item.id}>
                <p>{item.value}</p>
                <MdDeleteForever onClick={() => removeIngredient(+item.id)}/>
              </div>))}
          </div>
        </div>

        <div className="flex items-center justify-between my-2">
          <h3 className='text-2xl'>Steps</h3>

        </div>

        <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
          {stepFields.map((field, index) => (
            <div key={field.id}
                 className="mb-3 border rounded-xl p-4">
              <h5>Step: {index + 1}</h5>

              {stepImageUrls[index]
                ? (
                  <div className='relative flex flex-row items-center justify-center my-2 w-full'>
                    <Image
                      className='rounded-xl aspect-auto w-full'
                      width={300}
                      height={300}
                      src={stepImageUrls[index]}
                      alt='Uploaded image'
                    />
                    <MdDeleteForever className='absolute top-1 right-1 text-5xl text-red-500 cursor-pointer hover:scale-85 transition' onClick={() => setStepImageUrls(prev => ({
                      ...prev,
                      [index]: ''
                    }))}/>
                  </div>
                )
                : (
                  <div className='w-full h-70 flex items-center justify-center border rounded-xl my-2'>
                    <label className="inline-block cursor-pointer px-4 py-2 rounded-xl bg-violet-50 text-violet-700 hover:file:bg-violet-100 dark:bg-violet-600 dark:text-violet-100 dark:hover:bg-violet-500">
                      <input
                        type="file"
                        hidden
                        multiple={false}
                        onChange={(e) => handleFiles(e, index)}
                        className="relative px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand block placeholder:text-body mt-2 file:rounded-xl file:p-1.5 file:text-xs file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 dark:file:bg-violet-600 dark:file:text-violet-100 dark:hover:file:bg-violet-500 file:absolute file:right-1 file:top-1/2 file:-translate-y-1/2 w-full"
                      />
                      Add picture
                    </label>
                  </div>
                )}

              <div className='flex flex-col items-center justify-center'>
                <textarea {...register((`recipeSteps.${index}.desc`))}
                          placeholder={`Enter step ${index + 1} description`}
                          rows={5}
                          className="px-3 py-2.5 bg-neutral-secondary-medium border rounded-xl text-heading text-sm focus:ring-brand focus:border-brand blockx placeholder:text-body mt-2 w-full resize-none"/>
                <button className="p-2 rounded-xl bg-red-500 text-white my-3 w-1/2"
                        onClick={() => removeStep(index)}>Delete step
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="relative left-1/2 -translate-x-1/2 my-5 w-1/3 p-3 rounded-xl bg-violet-50 text-violet-700 hover:file:bg-violet-100 dark:bg-violet-600 dark:text-violet-100 dark:hover:bg-violet-500"
          type='button'
          onClick={() => appendStep({desc: "", image: null, blobUrl: ''})}
        >Add new Step
        </button>

        <button className="relative left-1/2 -translate-x-1/2 flex items-center justify-center p-3 w-1/3 rounded-xl text-white bg-green-400 text-xl font-bold"
                type='submit'>{isPending ? <Spinner/> : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default Page;