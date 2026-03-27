'use client';

import React from "react";
import { Link } from "@/i18n/navigation";
import { PAGES } from "@/config/page.config";
import { useTranslations } from "next-intl";
import FeaturedRecipeCard from "@/components/home/FeaturedRecipeCard";
import Footer from "@/components/footer/Footer";
import { useFeaturedRecipes } from "@/hooks/useFeaturedRecipes";
import CakeHero from "@/components/home/CakeHero";

export default function Home() {
  const t = useTranslations('home');
  const { data: featuredRecipes, isLoading } = useFeaturedRecipes();

  const words = t.raw('title.words') as string[];

  return (
    <div className="relative -mt-[65px]">
      {/* Cake Hero Section */}
      <CakeHero
        words={words}
        byAuthor={t('title.byAuthor')}
        scrollText={t('hero.scroll')}
      />

      <section id="featured" className="relative py-24 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-full mb-4">
              {t('featured.badge')}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('featured.subtitle')}
            </p>
          </div>


          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-3xl h-96" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRecipes?.map((recipe, index) => (
                <FeaturedRecipeCard key={recipe.id} recipe={recipe} index={index} />
              ))}
            </div>
          )}

          {/* View all button */}
          <div className="text-center mt-16">
            <Link
              href={PAGES.RECIPES}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              {t('featured.viewAll')}
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>



      {/* Footer */}
      <Footer />
    </div>
  );
}
