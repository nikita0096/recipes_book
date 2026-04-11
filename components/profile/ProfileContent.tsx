'use client';

import React, {useEffect, useState} from 'react';
import {useParams} from "next/navigation";
import {useUserStore} from "@/store/useUserStore";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {LocalizedText} from "@/types";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import {supabase} from "@/lib/supabase/ClientComponentClient";

interface PreviewRecipe {
  id: string;
  heroImg: string;
  title: LocalizedText;
}

export interface LikedRecipe {
  id: string;
  recipe: PreviewRecipe;
}

export interface PurchasedRecipe {
  id: string;
  purchasedAt: string;
  recipe: PreviewRecipe;
}

interface ProfileContentProps {
  likedRecipesData: LikedRecipe[];
  purchasedRecipesData: PurchasedRecipe[];
}

// Placeholder avatar for users without Google avatar
const AVATAR_PLACEHOLDER = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop&crop=face";

const ProfileContent: React.FC<ProfileContentProps> = ({likedRecipesData, purchasedRecipesData}) => {
  const [likedRecipes, setLikedRecipes] = useState(likedRecipesData);
  const [isLikedExpanded, setIsLikedExpanded] = useState(false);
  const [isPurchasedExpanded, setIsPurchasedExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const purchasedRecipes = purchasedRecipesData;

  const {user, setUserData} = useUserStore();

  const t = useTranslations('profile');
  const locale = useTypedLocale();

  const formatDate = (date: string) => {
    const newDate = new Date(date);
    const day = newDate.getDate();
    const month = newDate.getMonth() + 1;
    const year = newDate.getFullYear();

    if (locale === 'ua') {
      return `${day.toString().padStart(2, '0')}.${month.toString().padStart(2, '0')}.${year}`;
    }
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
  };

  const displayedPurchasedRecipes = isPurchasedExpanded ? purchasedRecipes : purchasedRecipes.slice(0, 3);
  const displayedLikedRecipes = isLikedExpanded ? likedRecipes : likedRecipes.slice(0, 3);

  if (!user) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center rounded-2xl border border-red-200 dark:border-red-900 p-6 bg-red-50 dark:bg-red-900/20 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">User not found</p>
        <div className="w-50 mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors">
          <Link
            href={PAGES.LOGIN}

          >
            Log in to your profile
          </Link>
        </div>

      </div>
    </div>
  );

  const handleUnlikeRecipe = async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    await deleteLike(id, user.id);

    setLikedRecipes(prevState => prevState.filter((i) => i.recipe.id !== id));
  }

  const handleStartEditName = () => {
    setNewName(user.name);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNewName('');
  };

  const handleSaveName = async () => {
    if (!newName.trim() || newName === user.name) {
      handleCancelEditName();
      return;
    }

    setIsSaving(true);

    const {error} = await supabase.auth.updateUser({
      data: {
        name: newName
      }
    });

    if (!error) {
      setUserData({ ...user, name: newName.trim() });
    }

    setIsSaving(false);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEditName();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-orange-400/20 to-red-400/20 rounded-3xl blur-xl"/>

          <div className="relative bg-white dark:bg-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-100 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-amber-400/30 shadow-lg">
                  <Image
                    src={user.avatar_url || AVATAR_PLACEHOLDER}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-3 border-white dark:border-gray-800 shadow"/>
              </div>

              {/* User info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  {isEditingName ? (
                    <>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-amber-500 focus:outline-none focus:border-amber-600 px-1"
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSaving}
                        className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors disabled:opacity-50"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelEditName}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {user.name}
                      </h1>
                      <button
                        onClick={handleStartEditName}
                        className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {user.email}
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
                      {formatDate(user.createdAt)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stats.memberSince')}
                    </div>
                  </div>
                </div>
              </div>

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
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {purchasedRecipes.length}
              </span>
            </h2>
            {purchasedRecipes.length > 3 && (
              <button
                onClick={() => setIsPurchasedExpanded(!isPurchasedExpanded)}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                {isPurchasedExpanded ? t('recipes.showLess') : t('recipes.showMore')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isPurchasedExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {purchasedRecipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPurchasedRecipes.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={PAGES.RECIPE(purchase.recipe.id)}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Recipe image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={purchase.recipe.heroImg}
                      alt={purchase.recipe.title[locale]}
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
                        {purchase.recipe.title[locale]}
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
                        {t('recipes.purchasedAt')}: {formatDate(purchase.purchasedAt)}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline">
                        {t('recipes.view')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Mobile Show More Button */}
            {purchasedRecipes.length > 3 && (
              <button
                onClick={() => setIsPurchasedExpanded(!isPurchasedExpanded)}
                className="flex sm:hidden items-center justify-center gap-2 w-full mt-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl transition-all active:bg-amber-100 dark:active:bg-amber-900/30"
              >
                {isPurchasedExpanded ? t('recipes.showLess') : t('recipes.showMore')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isPurchasedExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
            </>
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
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {likedRecipes.length}
              </span>
            </h2>
            {likedRecipes.length > 3 && (
              <button
                onClick={() => setIsLikedExpanded(!isLikedExpanded)}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                {isLikedExpanded ? t('recipes.showLess') : t('recipes.showMore')}
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isLikedExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {likedRecipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedLikedRecipes.map((item) => (
                <Link
                  key={item.id}
                  href={PAGES.RECIPE(item.recipe.id)}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Recipe image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.recipe.heroImg}
                      alt={item.recipe.title[locale]}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>

                    {/* Like button */}
                    <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            onClick={(e) => handleUnlikeRecipe(e, item.recipe.id)}>
                      <svg className="w-5 h-5 text-red-500 fill-current"
                           viewBox="0 0 20 20">
                        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                      </svg>
                    </button>

                    {/* Recipe title on image */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">
                        {item.recipe.title[locale]}
                      </h3>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-4">
                    <div className="flex items-center justify-end text-sm">
                      <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:scale-110 transition-skale duration-200">
                        {t('recipes.view')} →
                      </span>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
              {/* Mobile Show More Button */}
              {likedRecipes.length > 3 && (
                <button
                  onClick={() => setIsLikedExpanded(!isLikedExpanded)}
                  className="flex sm:hidden items-center justify-center gap-2 w-full mt-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl transition-all active:bg-amber-100 dark:active:bg-amber-900/30"
                >
                  {isLikedExpanded ? t('recipes.showLess') : t('recipes.showMore')}
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isLikedExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-amber-100 dark:border-gray-700">
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6"
                       fill="none"
                       stroke="currentColor"
                       viewBox="0 0 24 24">
                    <path strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

export default ProfileContent;
