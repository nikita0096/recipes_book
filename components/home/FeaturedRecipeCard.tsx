'use client';

import React, {useEffect} from 'react';
import Image from 'next/image';
import { IRecipe, parseJson } from '@/types/recipe';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';
import { RECIPE_PLACEHOLDER_IMAGE } from '@/constants/images';
import { useTypedLocale } from '@/hooks/useTypedLocale';
import { useTranslations } from 'next-intl';

interface FeaturedRecipeCardProps {
  recipe: IRecipe;
  index: number;
}

const FeaturedRecipeCard: React.FC<FeaturedRecipeCardProps> = ({ recipe, index }) => {
  const locale = useTypedLocale();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  const title = parseJson(recipe.title);
  const category = parseJson(recipe.category);

  const rotations = ['-rotate-2', 'rotate-0', 'rotate-2'];
  const delays = ['delay-0', 'delay-100', 'delay-200'];

  return (
    <div
      className={`group relative ${rotations[index]} hover:rotate-0 transition-all duration-500 ${delays[index]}`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* Decorative background blur */}
      <div className="absolute -inset-4 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-red-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Card container */}
      <div className="relative bg-white dark:bg-gray-800/90 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 backdrop-blur-sm border border-white/20 dark:border-gray-700/50">

        {/* Image section with overlay */}
        <Link href={PAGES.RECIPE(recipe.id)} className="block relative h-64 overflow-hidden">
          <Image
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
            alt={title[locale]}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Category ribbon */}
          <div className="absolute top-4 -left-2">
            <div className="relative">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2 text-sm font-semibold shadow-lg">
                {category[locale]}
              </div>
              {/* Ribbon fold */}
              <div className="absolute -bottom-2 left-0 w-0 h-0 border-t-8 border-t-amber-700 border-l-8 border-l-transparent" />
            </div>
          </div>

          {/* Floating icon */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500 text-2xl">
            🔥
          </div>

          {/* Recipe title on image */}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl font-bold text-white drop-shadow-lg line-clamp-2 group-hover:text-amber-200 transition-colors duration-300">
              {title[locale]}
            </h3>
          </div>
        </Link>

        {/* Content section */}
        <div className="p-6 relative">


          {/* Stats row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Likes */}
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <svg className="w-5 h-5 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
                <span className="font-medium">{recipe.likes}</span>
              </div>

              {/* Prep time */}
              {recipe.preparingTime && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{recipe.preparingTime} {t('featured.minutes')}</span>
                </div>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={PAGES.RECIPE(recipe.id)}
            className="group/btn relative w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
          >
            <span className="relative z-10">{tCommon('buttons.viewRecipe')}</span>
            <svg className="w-5 h-5 relative z-10 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedRecipeCard;
