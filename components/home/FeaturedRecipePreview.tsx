import React from 'react';
import Image from 'next/image';
import {IRecipe} from "@/types";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {PAGES} from "@/config/page.config";
import {Link} from "@/i18n/navigation";
import {useTranslations} from "next-intl";

interface IFeaturedRecipePreviewProps {
  recipe: IRecipe | null;
}


const FeaturedRecipePreview: React.FC<IFeaturedRecipePreviewProps> = ({recipe}) => {
  const locale = useTypedLocale();

  const t = useTranslations('home');
  const tRecipes = useTranslations('recipes');

  if(recipe === null) {
    return null;
  }

  return (
    <section className='grid grid-cols-2 my-5'>
      <div className='relative aspect-square '>
        <Image
          src={recipe.heroImg}
          alt={recipe.title[locale]}
          fill
          className="object-cover w-full h-full "
        />
      </div>

      <div className='flex flex-col items-start justify-center p-10'>

        <h4 className='font-serif text-2xl text-accent'>{t('featured.preview')}</h4>

        <span className='block w-full h-[0.5px] bg-accent/25 my-5'></span>

        <div className='flex flex-col gap-y-4 w-full'>
          <h3 className='text-3xl font-serif'>
            {recipe.title[locale]}
          </h3>
          <p className='text-muted text-xs lg:text-lg'>{recipe.description[locale]}</p>
          <Link
            href={PAGES.RECIPE(recipe.id)}
            className="text-sm border border-border text-text px-4 py-2 mt-5 hover:bg-surface transition-colors w-30 text-center"
          >
            {tRecipes("card.toRecipe")}
          </Link>
          <div className='relative flex flex-col w-full pb-3 fter:block after:absolute after:top-0 after:left-1/2 after:w-[0.1px] after:h-full after:bg-accent/25'>
            <span className='block w-full h-[0.5px] bg-accent/25 mb-3'></span>
            <div className='grid grid-cols-2 h-full'>
              <div className='flex flex-col gap-y-1 px-3'>
                <span className="text-xl text-accent font-serif">
                  {recipe.preparingTime}<span className='text-sm'>{tRecipes('singlePage.minutes')}</span>
                </span>
                <span className="text-xs text-muted ">{tRecipes('card.cookTime')}</span>
              </div>
              <div className='flex flex-col gap-y-1 px-3'>
                <span className="text-xl text-accent font-serif">
                  {recipe.stepsCount ?? 0}
                </span>
                <span className="text-xs text-muted ">{tRecipes('card.cardSteps', {count: recipe.stepsCount})}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};

export default FeaturedRecipePreview;