import React, {useRef} from 'react';
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
  userLikes: string[];
  userPurchases: string[];
  handleUnlikeRecipe: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void;
}

const RecipeItem: React.FC<RecipeItemProps> = ({recipe, index = 0, userLikes, userPurchases, handleUnlikeRecipe}) => {
  const locale = useTypedLocale();

  const recipeRef = useRef(null);

  const tCommon = useTranslations('common');
  const tRecipes = useTranslations('recipes');

  const animationDelay = 100;

  const isPurchased = userPurchases.includes(recipe.id);
  const isLiked  = userLikes.includes(recipe.id);

  return (
    <div data-id={`recipe-${recipe.id}`} className="bg-surface overflow-hidden animate-card-fade-in hover:scale-[1.02] transition-all duration-300"
      style={{
        animationDelay: `${animationDelay + (index * 50)}ms`,
      }}
      ref={recipeRef}
    >
      {/* Image */}
      <Link href={PAGES.RECIPE(recipe.slug + '-' + recipe.id)} className="block relative overflow-hidden">
        <div className='relative w-full aspect-4/3'>
          <Image
            fill
            className="object-cover"
            src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
            alt={recipe.title[locale]}
          />
        </div>

        {/* Free badge */}
        {!recipe.isPremium ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-green-600/80 text-white text-xs tracking-wider uppercase">
            {tRecipes('card.free')}
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent/80 text-white text-xs tracking-wider uppercase">
            {tRecipes('card.premium')}
          </span>
        )}
        {isLiked && (
          <button
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-red-500/85 flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors"
            onClick={(e) => handleUnlikeRecipe(e, recipe.id)}
          >
            ♥
          </button>
        )}

        {isPurchased && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center justify-between gap-1 px-2.5 py-1.5 text-[#3AD080] bg-black/70 border border-[#3AD080] rounded-full text-xs tracking-wider">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="#3ad07f" strokeWidth="3"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.2 4.2L19 6.5" />
            </svg>
            {tRecipes('card.purchased')}
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
            href={PAGES.RECIPE(recipe.slug + '-' + recipe.id)}
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
