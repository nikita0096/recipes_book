'use client';

import React, {useState} from "react";
import {Link} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import FeaturedRecipeCard from "@/components/home/FeaturedRecipeCard";
import Footer from "@/components/footer/Footer";
import CakeHero from "@/components/home/CakeHero";
import AnimatedHero from "@/components/home/AnimatedHero";
import {useUserStore} from "@/store/useUserStore";
import FeaturedRecipePreview from "@/components/home/FeaturedRecipePreview";
import {useFeaturedRecipes} from "@/hooks/useFeaturedRecipes";
import {IRecipe} from "@/types";

export default function Home() {
  const [previewFeaturedCard, setPreviewFeaturedCard] = useState<IRecipe | null>(null);

  const t = useTranslations('home');
  const {data: featuredRecipes, isLoading} = useFeaturedRecipes();
  const {user} = useUserStore();

  const words = t.raw('title.words') as string[];

  return (
    <div className="relative -mt-[65px]">
      {/* Animated Hero Section */}
      <AnimatedHero
        discoverText={t('title.discover')}
        recipesText={t('title.recipes')}
        words={words}
        byAuthor={t('title.byAuthor')}
        browseText={t('hero.browse')}
        aboutText={t('hero.about')}
      />

      {/* Cake Hero Section */}
      <CakeHero scrollText={t('hero.scroll')} />

      <section id="featured"
               className="relative pt-5 pb-10 bg-bg overflow-hidden">
        <div className='px-4'>
          <div className='flex items-center justify-between'>
          <span className="inline-block px-4 text-accent text-sm font-medium rounded-full">
              {t('featured.badge')}
          </span>
            <span className='block w-full h-[0.1px]  bg-accent/15 rounded-full'></span>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-4xl text-start font-serif w-1/2 whitespace-pre-line p-4 mb-5">
              {t.rich('featured.title', {
                highlight: (chunks) => (
                  <span className='text-accent'>{chunks}</span>
                )
              })}
            </h2>


            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i}
                       className="animate-pulse">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96"/>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="relative grid grid-cols-1 md:grid-cols-3 md:gap-8">
                  {featuredRecipes?.map((recipe, index) => (
                    <FeaturedRecipeCard key={recipe.id}
                                        recipe={recipe}
                                        index={index}
                                        setPreviewFeaturedCard={setPreviewFeaturedCard}/>
                  ))}
                </div>
              </>
            )}


          </div>
        </div>
        <div className='hidden md:block'>
          <FeaturedRecipePreview recipe={previewFeaturedCard}/>
        </div>

        {/* View all button */}
        <div className="text-center mt-16">
          <Link
            href={PAGES.RECIPES}
            className="group inline-flex items-center gap-3 px-8 py-4 font-semibold rounded-full hover:scale-102 transition-all"
          >
            {t('featured.viewAll')}
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                 fill="none"
                 stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </Link>
        </div>
      </section>


      {/* Footer */}
      <Footer user={user}/>
    </div>
  );
}
