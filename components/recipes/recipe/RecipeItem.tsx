import React, { useRef} from 'react';
import {IRecipe} from "@/types/recipe";
import Image from 'next/image';
import {PAGES} from "@/config/page.config";
import {Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import {RECIPE_PLACEHOLDER_IMAGE} from "@/constants/images";
import {useTypedLocale} from "@/hooks/useTypedLocale";

interface RecipeItemProps {
  recipe: IRecipe;
  index?: number;
}

const RecipeItem: React.FC<RecipeItemProps> = ({recipe, index = 0}) => {
  const locale = useTypedLocale();

  const recipeRef = useRef(null);

  const tCommon = useTranslations('common');
  const tRecipes = useTranslations('recipes');

  const animationDelay = 100;

  return (
    <div className="bg-surface overflow-hidden animate-card-fade-in hover:scale-[1.02] transition-all duration-300"
      style={{
        animationDelay: `${animationDelay + (index * 50)}ms`,
      }}
      ref={recipeRef}
    >
      {/* Image */}
      <Link href={PAGES.RECIPE(recipe.id)} className="block relative overflow-hidden">
        <div className='relative w-full aspect-4/3'>
          <Image
            fill
            className="object-cover"
            src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
            alt={recipe.title[locale]}
          />
        </div>

        {/* Free badge */}
        {!recipe.isPremium && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-600/80 text-white text-xs tracking-wider uppercase">
            {tRecipes('card.free')}
          </span>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Category */}
        <span className="block text-xs tracking-widest uppercase text-accent mb-2">
          {recipe.category[locale]}
        </span>

        {/* Title */}
        <h5 className="font-serif text-lg lg:text-xl text-text leading-tight mb-3 line-clamp-2">
          {recipe.title[locale]}
        </h5>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Likes */}
          <span className="text-sm text-muted">
            ♡ {recipe.likes}
          </span>

          {/* View Recipe Button */}
          <Link
            href={PAGES.RECIPE(recipe.id)}
            className="text-sm border border-border text-text px-4 py-2 hover:bg-surface transition-colors"
          >
            {tCommon('buttons.viewRecipe')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecipeItem;
