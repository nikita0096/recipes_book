'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';
import { RECIPE_PLACEHOLDER_IMAGE } from '@/constants/images';
import { useTypedLocale } from '@/hooks/useTypedLocale';
import { useTranslations } from 'next-intl';
import {FeaturedRecipe} from "@/services/db/public/fetchFeaturedRecipes";

interface FeaturedRecipeCardProps {
  recipe: FeaturedRecipe;
  index: number;
  setPreviewFeaturedCard: (featuredCard: FeaturedRecipe) => void;
  isAnimateCards: boolean;
}

const FeaturedRecipeCard: React.FC<FeaturedRecipeCardProps> = ({ recipe, index, setPreviewFeaturedCard, isAnimateCards }) => {
  const locale = useTypedLocale();
  const tRecipes = useTranslations('recipes');


  const animationDelay = 100;

  return (
    <div className={`bg-surface overflow-hidden ${isAnimateCards ? 'animate-card-fade-in' : 'hidden'} hover:scale-[1.02] transition-all duration-300`}
         style={{
           animationDelay: `${animationDelay + (index * 100)}ms`,
         }}
    >

      <div className="block relative overflow-hidden cursor-pointer">
        <div className='hidden md:block relative w-full aspect-4/3' onClick={() => setPreviewFeaturedCard(recipe)}>
          <Image
            fill
            sizes="100vh"
            className="object-cover"
            src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
            alt={recipe.title[locale]}
          />
        </div>
        <Link className='block md:hidden relative w-full aspect-4/3' href={PAGES.RECIPE(recipe.slug + '-' + recipe.id)}>
          <Image
            fill
            sizes="100vh"
            className="object-cover"
            src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
            alt={recipe.title[locale]}
          />
        </Link>

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 bg-accent text-white text-xs tracking-wider uppercase">
            {recipe.category[locale]}
        </span>

      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Title */}
        <h5 className="font-serif text-md lg:text-lg text-text leading-tight mb-3 line-clamp-2">
          {recipe.title[locale]}
        </h5>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Saves */}
          <span className="flex items-center gap-1 text-xs text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3a2 2 0 0 0-2 2v15.28a.7.7 0 0 0 1.05.6L12 17l6.95 3.88A.7.7 0 0 0 20 20.28V5a2 2 0 0 0-2-2H6z" />
            </svg>
            {recipe.likes}
          </span>
          <Link
            href={PAGES.RECIPE(recipe.slug + '-' + recipe.id)}
            className="text-sm border border-border text-text px-4 py-2 hover:bg-surface transition-colors"
          >
            {tRecipes("card.toRecipe")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedRecipeCard;
