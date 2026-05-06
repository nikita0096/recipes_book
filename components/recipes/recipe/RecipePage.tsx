'use client';

import React, {useEffect, useState} from 'react';
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {IRecipe} from "@/types/recipe";
import {useTranslations} from "next-intl";
import RecipeIngredient from "@/components/recipes/recipe/RecipeIngredient";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {useUserStore} from "@/store/useUserStore";
import {addNewLike} from "@/services/db/recipe-likes/addNewLike";
import {fetchRecipe} from "@/services/db/fetchRecipe";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import {SecureVideoPlayer} from "@/components/video/SecureVideoPlayer";
import Footer from "@/components/footer/Footer";

interface RecipePageProps {
  recipeId: string;
  isLikedRecipe: boolean;
}

const RecipePage: React.FC<RecipePageProps> = ({recipeId, isLikedRecipe}) => {
  const [recipe, setRecipe] = useState<IRecipe | null>(null);
  const [isLiked, setIsLiked] = useState(isLikedRecipe);
  const [likes, setLikes] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const locale = useTypedLocale();
  const t = useTranslations('recipes');
  const {user} = useUserStore();

  useEffect(() => {
    const fetchData = async () => {

      const {data, error} = await fetchRecipe(recipeId, user?.id);

      if (error) setError(error);

      if (data) {
        setRecipe(data);
        setLikes(data.likes);
      }
    }

    fetchData();
  }, [recipeId]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-base mb-4">Not found</p>
          <Link href="/recipes" className="text-sm text-muted hover:text-text">
            ← {t('singlePage.backButton')}
          </Link>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  
  const handleLike = async () => {
    if (!user) return;

    const isNewLiked = !isLiked;
    setIsLiked(isNewLiked);
    setLikes(prevState => isNewLiked ? prevState + 1 : prevState - 1);

    try {
      if (isNewLiked) {
        await addNewLike(recipe.id, user.id);
      } else {
        await deleteLike(recipe.id, user.id);
      }
    } catch (error) {
      setIsLiked(prevState => !prevState);
      setLikes(prevState => isNewLiked ? prevState - 1 : prevState + 1);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative h-[280px] sm:h-[360px] lg:h-[480px] w-full">
        <Image
          src={recipe.heroImg}
          alt={recipe.title[locale]}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/[0.88] via-black/[0.1] to-transparent pointer-events-none"/>

        {/* Back link */}
        <Link
          href="/recipes"
          className="absolute top-4 left-4 sm:left-6 lg:left-10 text-sm text-text/70 tracking-wide hover:text-white/90 transition-colors z-10"
        >
          ← {t('singlePage.backButton')}
        </Link>

        {/* Like button */}
        <button
          type="button"
          onClick={handleLike}
          className={`absolute top-4 right-4 sm:right-6 lg:right-10 z-10 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex flex-col items-center justify-center gap-0.5 border transition-all cursor-pointer select-none hover:scale-105 active:scale-95 ${
            isLiked
              ? 'bg-red-500/80 border-red-400 text-white'
              : 'bg-white/20 border-white/40 text-white'
          }`}
          style={{ WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-lg lg:text-xl leading-none">
            {isLiked ? '♥' : '♡'}
          </span>
          <span className="text-xs text-white/70">{likes}</span>
        </button>

        {/* Hero content */}
        <div className="absolute bottom-6 left-4 sm:left-6 lg:left-10 right-16 sm:right-20 lg:right-24">
          {/* Category */}
          <span className="inline-block text-xs tracking-widest uppercase text-accent border border-accent px-3 py-1 mb-3 bg-bg/40">
            {recipe.category && recipe.category[locale]}
          </span>

          {/* Title */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-5xl italic font-normal text-white leading-tight mb-3">
            {recipe.title[locale]}
          </h1>

          {/* Stats */}
          <div className="flex gap-5">
            <span className="text-sm text-white/60">
              ◷ {recipe.preparingTime} {t('singlePage.minutes')}
            </span>
            <span className="text-sm text-white/60">
              ☰ {recipe.recipeSteps?.length ?? 0} {t('singlePage.steps')}
            </span>
          </div>
        </div>
      </section>

      {/* Description Section */}
      {recipe.description && recipe.description[locale] && (
        <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7 lg:py-8">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.description')}
          </h2>
          <p className="text-base text-text leading-relaxed">
            {recipe.description[locale]}
          </p>
        </section>
      )}

      {/* Key Ingredients Section */}
      <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7 lg:py-8">
        <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
          {t('singlePage.keyIngredients')}
        </h2>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px "
        >
          {recipe.ingredients.map((item, index) => (
            <RecipeIngredient key={item.id} ingredient={item}/>
          ))}
        </div>
      </section>

      {/* Preparation Steps Section */}
      {recipe.recipeSteps?.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.preparationSteps')}
          </h2>

          <div className="flex flex-col gap-px bg-border">
            {recipe.recipeSteps?.map((step, i) => (
              <div key={step.id} className="bg-bg">
                {/* Mobile/Tablet: Image on top */}
                {step.imgUrl && (
                  <div className="lg:hidden">
                    <div className="relative w-full aspect-video">
                      <Image
                        src={step.imgUrl}
                        alt={`${t('singlePage.step')} ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Desktop: Grid layout with image on right */}
                <div className="lg:grid lg:grid-cols-[60px_1fr_1fr] lg:items-stretch">
                  {/* Step number */}
                  <div className="hidden lg:flex items-center pl-5 border-r border-border">
                    <span className="text-base text-accent font-semibold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Mobile/Tablet: Number + Description */}
                  <div className="lg:hidden grid grid-cols-[44px_1fr] sm:grid-cols-[52px_1fr] items-center">
                    <div className="pl-4 sm:pl-5 self-stretch flex items-center border-r border-border">
                      <span className="text-sm sm:text-base text-accent font-semibold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-sm sm:text-base text-text leading-relaxed">
                        {step.desc[locale]}
                      </p>
                    </div>
                  </div>

                  {/* Desktop: Description */}
                  <div className="hidden lg:flex items-center p-5 lg:px-7 overflow-hidden">
                    <p className="text-base text-text leading-relaxed">
                      {step.desc[locale]}
                    </p>
                  </div>

                  {/* Desktop: Image */}
                  {step.imgUrl && (
                    <div className="hidden lg:block border-l border-border">
                      <div className="relative w-full h-full min-h-[220px] aspect-video">
                        <Image
                          src={step.imgUrl}
                          alt={`${t('singlePage.step')} ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video Tutorial Section */}
      {recipe.videoUrl !== null && (
        <section className="border-t border-border mt-6 sm:mt-7 lg:mt-8 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8 pb-10 sm:pb-12 lg:pb-14">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.videoSection')}
          </h2>

          <div className="relative aspect-video bg-[#0d0d0a] overflow-hidden">
            <SecureVideoPlayer
              recipeId={recipeId}
              videoKey={recipe.videoUrl}
              className="w-full h-full object-contain"
            />
          </div>
        </section>
      )}

      {/* Back link */}
      <div className='flex items-center justify-center mb-15'>
        <Link
          href="/recipes"
          className="relative sm:left-6 lg:left-10 text-sm text-text/70 tracking-wide hover:text-white/90 transition-colors z-10"
        >
          ← {t('singlePage.backButton')}
        </Link>
      </div>
      <Footer user={user} />
    </div>
  );
};

export default RecipePage;
