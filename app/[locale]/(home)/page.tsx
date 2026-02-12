'use client';

import {useEffect, useRef} from "react";
import {Link} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";

export default function Home() {
  const titleRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);
  const t = useTranslations('home');

  const words = t.raw('title.words') as string[];

  useEffect(() => {
    const titleInterval = setInterval(() => {
      if (!titleRef.current) return;

      titleRef.current.style.opacity = '0';
      titleRef.current.style.transform = 'translateY(-10px)';

      setTimeout(() => {
        if (!titleRef.current) return;

        indexRef.current = (indexRef.current + 1) % words.length;
        titleRef.current.textContent = words[indexRef.current];

        titleRef.current.style.opacity = '1';
        titleRef.current.style.transform = 'translateY(0)';

      }, 300);

    }, 2000);

    return () => clearInterval(titleInterval);
  }, [words]);


  return (
    <div className="fixed inset-0 min-h-screen w-full bg-[url('https://i.pinimg.com/1200x/1b/ed/81/1bed81e6288a8d1ed71f3bd577163228.jpg')] bg-center bg-no-repeat bg-cover z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"/>
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        <h1 className="text-center">
          <span
            className="block text-6xl sm:text-7xl md:text-8xl font-bold text-white transition-all duration-300 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
            ref={titleRef}
          >
            {words[0]}
          </span>
          <span className="block mt-4 text-2xl sm:text-3xl md:text-4xl font-medium text-white/90 drop-shadow-lg">
            {t('title.byAuthor')}
          </span>
        </h1>
        <Link
          href={PAGES.RECIPES}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          {t('cta.exploreRecipes')}
        </Link>
      </div>
    </div>
  );
}
