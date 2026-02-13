'use client';

import Image from "next/image";
import {Link} from "@/i18n/navigation";
import React, {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import {IRecipe} from "@/types/recipe";
import {fetchRecipe} from "@/services/db/fetchRecipe";
import LoadingPage from "@/components/ui/LoadingPage";
import {useTranslations} from "next-intl";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {deleteRecipe} from "@/services/db/deleteRecipe";
import {useRouter} from "next/navigation";
import {useDraggable} from "@dnd-kit/core";

const Page = () => {
  const params = useParams<{recipe: string}>();
  const [recipe, setRecipe] = useState<IRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: 'unique-id',
  });

  console.log(recipe)

  const tRecipes = useTranslations('recipes');
  const tAdmin = useTranslations('admin');

  const router = useRouter();

  const queryClient = useQueryClient();

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,

    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ["recipes"]});
    }
  });

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchRecipe(params.recipe);
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Recipe not found');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecipe();
  }, [params.recipe]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !recipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-xl text-gray-900 dark:text-white font-semibold mb-2">{error || 'Recipe not found'}</p>
        <Link href="/admin/recipes" className="text-amber-500 hover:text-amber-600">
          {tRecipes("singlePage.backButton")}
        </Link>
      </div>
    );
  }

  const handleDeleteRecipe = (id: number) => {
    deleteRecipeMutation.mutate(id.toString());

    router.push(`/admin/recipes`);
  }

  const handleUpdateHeroImage = async () => {

  }

  const handleUpdateSteps = async () => {

  }



  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden">
        {recipe.recipeSteps[0]?.imgUrl && (
          <Image
            src={recipe.recipeSteps[0].imgUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block px-4 py-1 mb-4 text-sm font-medium text-amber-900 bg-amber-100 rounded-full">
              {recipe.category}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {recipe.title}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                {recipe.likes}
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {recipe.recipeSteps.length}<span>{tRecipes('singlePage.steps')}</span>
              </span>
            </div>
          </div>
        </div>
        <div className='absolute top-3 right-3 flex flex-col gap-2'>
          <button className='px-4 py-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-medium rounded-xl hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors shadow-md'>
            {tAdmin('list.edit')}
          </button>
          <button
            className='px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-md'
            onClick={() => handleDeleteRecipe(recipe.id)}
          >
            {tAdmin('list.delete')}
          </button>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Ingredients Section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white"> {tRecipes('singlePage.keyIngredients')}</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {recipe.ingredients.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 border border-amber-100 dark:border-gray-600"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <p className="text-gray-700 dark:text-gray-200 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{tRecipes('singlePage.preparationSteps')}</h2>
          </div>

          <div className="space-y-8">
            {recipe.recipeSteps.map((step, i) => (
              <div
                ref={setNodeRef}
                key={i}
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                {step.imgUrl && (
                  <div className="relative h-64 md:h-80 w-full">
                    <Image
                      src={step.imgUrl}
                      alt={`Step ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {tRecipes('singlePage.step')} <span>{i + 1}</span>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </div>
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {tRecipes("singlePage.backButton")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;