'use client';

import React, {useEffect} from 'react';
import { useParams } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PAGES } from "@/config/page.config";
import { useTranslations } from "next-intl";
import { useTypedLocale } from "@/hooks/useTypedLocale";
import {getAllLikedRecipesByUser} from "@/services/db/recipe-likes/getAllLikedRecipesByUser";

// Placeholder avatar for users without Google avatar
const AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop&crop=face";

// Mock purchased recipes (will be replaced with real data from Stripe/DB)
const mockPurchasedRecipes = [
  {
    id: '1',
    title: { en: 'Chocolate Lava Cake', ua: 'Шоколадний лава-кейк' },
    heroImg: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
    purchasedAt: '2024-03-15',
  },
  {
    id: '2',
    title: { en: 'Tiramisu', ua: 'Тірамісу' },
    heroImg: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    purchasedAt: '2024-03-10',
  },
  {
    id: '3',
    title: { en: 'Macarons', ua: 'Макаруни' },
    heroImg: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=300&fit=crop',
    purchasedAt: '2024-03-05',
  },
];

// Mock liked recipes
const mockLikedRecipes = [
  {
    id: '4',
    title: { en: 'Cheesecake', ua: 'Чізкейк' },
    heroImg: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: { en: 'Croissants', ua: 'Круасани' },
    heroImg: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
  },
];

const ProfilePage = () => {
  const params = useParams();
  const { user } = useUserStore();
  const t = useTranslations('profile');
  const locale = useTypedLocale();

  // For demo, use mock data if no user
  const displayUser = user || {
    id: params.id as string,
    name: 'Demo User',
    email: 'demo@example.com',
    avatar_url: null,
    role: 'user' as const,
  };


  const purchasedRecipes = mockPurchasedRecipes;
  const likedRecipes = mockLikedRecipes;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-red-400/20 rounded-3xl blur-xl" />

          <div className="relative bg-white dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-amber-400/30 shadow-lg">
                  <Image
                    src={displayUser.avatar_url || AVATAR_PLACEHOLDER}
                    alt={displayUser.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow" />
              </div>

              {/* User info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {displayUser.name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {displayUser.email}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {purchasedRecipes.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stats.purchased')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500 dark:text-red-400">
                      {likedRecipes.length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stats.liked')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500 dark:text-orange-400">
                      Mar 2024
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stats.memberSince')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings button */}
              <button className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Purchased Recipes Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-lg">
                🎂
              </span>
              {t('sections.purchasedRecipes')}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {t('recipes.count', { count: purchasedRecipes.length })}
            </span>
          </div>

          {purchasedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={PAGES.RECIPE(recipe.id)}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Recipe image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={recipe.heroImg}
                      alt={recipe.title[locale]}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Purchased badge */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t('recipes.purchased')}
                    </div>

                    {/* Recipe title on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">
                        {recipe.title[locale]}
                      </h3>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {recipe.purchasedAt}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
                        {t('recipes.view')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-lg border border-amber-100 dark:border-gray-700">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('empty.purchasedTitle')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('empty.purchasedText')}
              </p>
              <Link
                href={PAGES.RECIPES}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
              >
                {t('empty.browseRecipes')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* Liked Recipes Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center text-white text-lg">
                ❤️
              </span>
              {t('sections.likedRecipes')}
            </h2>
            <Link
              href={PAGES.RECIPES}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              {t('recipes.viewAll')} →
            </Link>
          </div>

          {likedRecipes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedRecipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  href={PAGES.RECIPE(recipe.id)}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Recipe image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={recipe.heroImg}
                      alt={recipe.title[locale]}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Like button */}
                    <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                      </svg>
                    </button>

                    {/* Recipe title on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">
                        {recipe.title[locale]}
                      </h3>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-4">
                    <div className="flex items-center justify-end text-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
                        {t('recipes.view')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-amber-100 dark:border-gray-700">
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('liked.addHint')}</p>
                  <p className="text-sm">{t('liked.addHintDesc')}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
              ⚡
            </span>
            {t('sections.quickActions')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Browse recipes */}
            <Link
              href={PAGES.RECIPES}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-amber-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📖
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('actions.browseRecipes')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('actions.browseRecipesDesc')}</p>
                </div>
              </div>
            </Link>

            {/* Account settings */}
            <button className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-amber-100 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all hover:-translate-y-1 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('actions.settings')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('actions.settingsDesc')}</p>
                </div>
              </div>
            </button>

            {/* Sign out */}
            <button className="group bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg border border-red-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all hover:-translate-y-1 text-left">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🚪
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('actions.signOut')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('actions.signOutDesc')}</p>
                </div>
              </div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ProfilePage;
