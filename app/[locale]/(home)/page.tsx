'use client';

import React, { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { PAGES } from "@/config/page.config";
import { useTranslations } from "next-intl";
import FeaturedRecipeCard from "@/components/home/FeaturedRecipeCard";
import Footer from "@/components/footer/Footer";
import { useFeaturedRecipes } from "@/hooks/useFeaturedRecipes";
import home_bg from '../../../public/images/home-bg.jpg';

// Floating decoration component
const FloatingDecoration = ({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) => (
  <div
    className="absolute rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 blur-sm animate-float"
    style={{
      width: size,
      height: size,
      left,
      top,
      animationDelay: `${delay}s`,
    }}
  />
);

export default function Home() {
  const titleRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const t = useTranslations('home');
  const [isVisible, setIsVisible] = useState(false);

  const { data: featuredRecipes, isLoading } = useFeaturedRecipes();

  const words = t.raw('title.words') as string[];

  useEffect(() => {
    setIsVisible(true);

    const titleInterval = setInterval(() => {
      if (!titleRef.current) return;

      titleRef.current.style.opacity = '0';
      titleRef.current.style.transform = 'translateY(-20px) scale(0.95)';

      setTimeout(() => {
        if (!titleRef.current) return;

        indexRef.current = (indexRef.current + 1) % words.length;
        titleRef.current.textContent = words[indexRef.current];

        titleRef.current.style.opacity = '1';
        titleRef.current.style.transform = 'translateY(0) scale(1)';
      }, 400);
    }, 3000);

    return () => clearInterval(titleInterval);
  }, [words]);

  return (
    <div className="relative -mt-[65px]">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(../../../public/images/home-bg.jpg)"
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

        {/* Animated particles/decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <FloatingDecoration delay={0} size={100} left="10%" top="20%" />
          <FloatingDecoration delay={2} size={60} left="80%" top="15%" />
          <FloatingDecoration delay={4} size={80} left="70%" top="60%" />
          <FloatingDecoration delay={1} size={50} left="15%" top="70%" />
          <FloatingDecoration delay={3} size={70} left="85%" top="80%" />
          <FloatingDecoration delay={5} size={40} left="5%" top="50%" />
        </div>

        {/* Content */}
        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
          {/* Main title area */}
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {/* Decorative element above title */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-amber-400 text-sm font-medium tracking-widest uppercase">
                {t('hero.welcome')}
              </span>
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
            </div>

            {/* Main animated title */}
            <h1 className="mb-4">
              <span
                ref={titleRef}
                className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white transition-all duration-500 ease-out drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                style={{
                  textShadow: '0 0 40px rgba(251, 191, 36, 0.3)',
                }}
              >
                {words[0]}
              </span>
            </h1>

            {/* Subtitle with author */}
            <p className="text-2xl sm:text-3xl md:text-4xl font-medium text-white/90 mb-2 drop-shadow-lg">
              {t('title.byAuthor')}
            </p>

            {/* Decorative tagline */}
            <p
              className={`text-lg sm:text-xl text-white/70 max-w-xl mx-auto mb-10 transform transition-all duration-1000 delay-300 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              {t('hero.tagline')}
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transform transition-all duration-1000 delay-500 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <Link
                href={PAGES.RECIPES}
                className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('cta.exploreRecipes')}
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Link>

              <button
                onClick={() => {
                  document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 border border-white/30 hover:border-white/50"
              >
                <span className="flex items-center gap-2">
                  {t('cta.viewFeatured')}
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
            <span className="text-white/60 text-sm">{t('hero.scroll')}</span>
            <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center">
              <div className="w-1.5 h-3 bg-white/60 rounded-full mt-2 animate-scroll-indicator" />
            </div>
          </div>
        </div>
      </section>


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
