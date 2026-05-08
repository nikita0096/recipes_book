'use client';

import React, {useEffect, useState} from 'react';
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {IRecipe, IRecipePremiumIncomplete, RecipePrice} from "@/types/recipe";
import {useTranslations} from "next-intl";
import RecipeIngredient from "@/components/recipes/recipe/RecipeIngredient";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {useUserStore} from "@/store/useUserStore";
import {addNewLike} from "@/services/db/recipe-likes/addNewLike";
import {fetchRecipe} from "@/services/db/public/fetchRecipe";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import {SecureVideoPlayer} from "@/components/video/SecureVideoPlayer";
import Footer from "@/components/footer/Footer";

interface RecipePageProps {
  recipeId: string;
  isLikedRecipe: boolean;
}

interface FetchRecipeData {
  data: IRecipe | null;
  price: RecipePrice | null;
  error: Error | null;
}

const LockIcon = ({size = 16, className = ''}: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4"
          y="11"
          width="16"
          height="10"
          rx="1.5"/>
    <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
  </svg>
);

const UnlockIcon = ({size = 16, className = ''}: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4"
          y="11"
          width="16"
          height="10"
          rx="1.5"/>
    <path d="M8 11V7a4 4 0 0 1 8 0"/>
  </svg>
);

const RecipePage: React.FC<RecipePageProps> = ({recipeId, isLikedRecipe}) => {
  const [recipe, setRecipe] = useState<IRecipe | IRecipePremiumIncomplete | null>(null);
  const [isLiked, setIsLiked] = useState(isLikedRecipe);
  const [likes, setLikes] = useState(0);
  const [recipePrice, setRecipePrice] = useState<RecipePrice | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const locale = useTypedLocale();
  const t = useTranslations('recipes');
  const {user} = useUserStore();

  useEffect(() => {
    const fetchData = async () => {

      const {data, price, error} = await fetchRecipe(recipeId);

      if (error) setError(error);

      if (data) {
        setRecipe(data);
        setLikes(data.likes);
      }

      if (price) {
        setRecipePrice(price);
      }
    }

    fetchData();
  }, [recipeId]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-base mb-4">Not found</p>
          <Link href="/recipes"
                className="text-sm text-muted hover:text-text">
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
          className="absolute top-4 left-4 sm:left-6 lg:left-10 text-sm text-text/70 tracking-wide  hover:text-white mix-blend-difference transition-colors z-10"
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
              : 'bg-white/20 border-red-300/50  text-white'
          }`}
          style={{WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)'}}
        >
          <span className={`text-lg lg:text-xl leading-none ${isLiked ? 'text-white' : 'text-red-400/70'}`}>
            {isLiked ? '♥' : '♡'}
          </span>
          <span className={`text-xs ${isLiked ? "text-white/70" : "text-red-400/80"}`}>{likes}</span>
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
            <RecipeIngredient key={item.id}
                              ingredient={item}/>
          ))}
        </div>
      </section>

      {/* Premium Lock Block - показываем когда steps и video недоступны */}
      {recipe.recipeSteps === null && recipe.videoUrl === null && (
        <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8 pb-10 sm:pb-12 lg:pb-14">
          <div className="relative">
            {/* Blurred fake steps */}
            <div className="absolute top-0 left-0 w-full h-full blur opacity-60 select-none pointer-events-none border border-border bg-surface">
              <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5">
                <span className="text-xs tracking-widest uppercase text-accent font-medium">
                  {t('singlePage.preparationSteps')}
                </span>
              </div>
              <div className="flex flex-col gap-px bg-border">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex bg-bg"
                  >
                    <div className="w-8 sm:w-10 lg:w-14 shrink-0 flex items-center pl-2 sm:pl-4">
                      <span className="text-sm text-accent font-semibold">
                        {String(i).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1 p-3 sm:p-4 lg:p-5 border-l border-r border-border">
                      <p className="text-sm sm:text-base text-text leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
                      </p>
                    </div>
                    <div className="hidden sm:block w-36 lg:flex-1 min-h-28 lg:min-h-36 bg-surface"/>
                  </div>
                ))}
              </div>
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg/50 to-bg pointer-events-none"/>

            {/* Unlock card */}
            <div className='w-full h-full flex items-center justify-center pt-40 sm:pt-20'>
              <div className="relative md:w-11/12 w-9/12 max-w-md px-6 sm:px-9 py-7 sm:py-8 bg-surface border border-border text-center shadow-2xl">
                {/* Lock icon */}
                <div className="size-9 sm:size-10 rounded-full bg-accent/15 border border-accent mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                  <LockIcon size={16}
                            className="text-accent"/>
                </div>

                {/* Eyebrow */}
                <div className="text-xs tracking-widest uppercase text-accent mb-1.5 sm:mb-2 font-medium">
                  {t('singlePage.premiumLock.eyebrow')}
                </div>

                {/* Title */}
                <h3 className="font-serif italic font-normal text-lg sm:text-2xl leading-tight text-text mb-2 sm:mb-2.5 text-balance">
                  {t('singlePage.premiumLock.title')}
                </h3>

                {/* Description */}
                <p className="text-xs md:text-sm text-muted leading-relaxed mb-4 sm:mb-5 text-pretty">
                  {t('singlePage.premiumLock.description')}
                </p>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-2.5 mb-4 sm:mb-5">
                  {recipePrice && (
                    <span className="text-sm text-white/80">
                        {recipePrice.discount && recipePrice.discount > 0 ? (
                          <div className="flex items-end gap-2">
                            <span className="font-serif italic text-2xl md:text-4xl text-text leading-none">
                              ${(recipePrice.price * (1 - recipePrice.discount / 100)).toFixed(2)}
                            </span>
                            <span className="text-xs md:text-sm text-muted line-through">
                              ${recipePrice.price}
                            </span>
                          </div>
                        ) : (
                          <span className="font-serif italic text-2xl md:text-4xl text-text leading-none">
                            ${recipePrice?.price}
                          </span>
                        )}
                      </span>
                  )}
                </div>

                {/* Buy button */}
                <button
                  type="button"
                  className="w-full bg-accent text-bg font-medium text-sm tracking-wider uppercase py-3 px-5 md:py-3.5 md:px-6 inline-flex items-center justify-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <UnlockIcon size={13}
                              className="text-bg"/>
                  {t('singlePage.premiumLock.buyButton')}
                </button>

                {/* Footer */}
                <div className="text-xs text-muted mt-3">
                  {t('singlePage.premiumLock.footer')}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Preparation Steps Section */}
      {recipe.recipeSteps && recipe.recipeSteps.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.preparationSteps')}
          </h2>

          <div className="flex flex-col gap-px bg-border">
            {recipe.recipeSteps?.map((step, i) => (
              <div key={step.id}
                   className="bg-bg">
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
      {recipe.videoUrl && (
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
          className="text-sm text-text/70 tracking-wide hover:text-white/90 transition-colors z-10"
        >
          ← {t('singlePage.backButton')}
        </Link>
      </div>
      <Footer user={user}/>
    </div>
  );
};

export default RecipePage;
