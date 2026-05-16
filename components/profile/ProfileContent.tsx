'use client';

import React, {useEffect, useState} from 'react';
import {useUserStore} from "@/store/useUserStore";
import Image from "next/image";
import {Link} from "@/i18n/navigation";
import {usePathname} from "next/navigation";
import {PAGES} from "@/config/page.config";
import {useTranslations} from "next-intl";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {LocalizedText} from "@/types";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import {logout} from "@/lib/supabase/authClient";
import {useRouter} from "@/i18n/navigation";
import ChefPlaceholder from "@/components/ui/ChefPlaceholder";

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

const ProfileContent: React.FC<ProfileContentProps> = ({likedRecipesData, purchasedRecipesData}) => {
  const [likedRecipes, setLikedRecipes] = useState(likedRecipesData);
  const [isLikedExpanded, setIsLikedExpanded] = useState(false);
  const [isPurchasedExpanded, setIsPurchasedExpanded] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const purchasedRecipes = purchasedRecipesData;

  const {user, setUserData} = useUserStore();

  const t = useTranslations('profile');
  const locale = useTypedLocale();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if(!user) {
    return null;
  }

  if (!user && isMounted) {
    //"User not found"
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center border border-red-200 dark:border-red-900 p-6 bg-red-50 dark:bg-red-900/20 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">User not found</p>
          <div className="mt-4 px-4 py-2 border border-border text-text hover:bg-surface transition-colors">
            <Link href={PAGES.SIGNIN(pathname)}>
              Log in to your profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

    const {error} = await supabase
      .from('profiles')
      .update({
        name: newName,
      })
      .eq('id', user.id)

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

  const handleLogout = async () => {
    await logout();

    setUserData(null);
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Profile header */}
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] border-b border-border">
        {/* Avatar column */}
        <div className="p-8 sm:p-12 border-b sm:border-b-0 sm:border-r border-border flex flex-col items-center justify-center gap-3.5">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border border-border bg-surface">
            {user.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <ChefPlaceholder />
            )}
          </div>
        </div>

        {/* Info column */}
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-2.5 mb-1.5">
            {isEditingName ? (
              <>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="font-serif text-3xl sm:text-4xl italic font-normal text-text bg-transparent border-b border-accent focus:outline-none px-1"
                />
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="p-1.5 text-green-500 hover:text-green-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleCancelEditName}
                  className="p-1.5 text-muted hover:text-red-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <h1 className="font-serif text-3xl sm:text-4xl italic font-normal text-text">
                  {user.name}
                </h1>
                <button
                  onClick={handleStartEditName}
                  className="p-1.5 text-muted hover:text-accent transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-muted mb-8">
            {user.email}
          </p>

          {/* Stats */}
          <div className="flex gap-px bg-border w-fit">
            {[
              {val: String(purchasedRecipes.length), label: t('stats.purchased')},
              {val: String(likedRecipes.length), label: t('stats.liked')},
              {val: formatDate(user.createdAt), label: t('stats.memberSince'), isAccent: true}
            ].map((stat, i) => (
              <div key={stat.label} className="px-5 sm:px-7 py-4 bg-bg">
                <div className={`font-serif text-xl sm:text-2xl tracking-tight mb-1 ${stat.isAccent ? 'text-accent' : 'text-text'}`}>
                  {stat.val}
                </div>
                <div className="text-[11px] text-muted tracking-[0.06em] uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchased recipes */}
      <section className="px-6 sm:px-10 py-9 border-b border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-[10px] tracking-[0.12em] uppercase text-accent">
            {t('sections.purchasedRecipes')}
          </div>
          <div className="text-[10px] px-2 py-0.5 border border-border text-muted">
            {purchasedRecipes.length}
          </div>
        </div>

        {purchasedRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {displayedPurchasedRecipes.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={PAGES.RECIPE(purchase.recipe.id)}
                  className="group bg-bg"
                >
                  {/* Recipe image */}
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={purchase.recipe.heroImg}
                      alt={purchase.recipe.title[locale]}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {/* Card content */}
                  <div className="p-4 bg-surface">
                    <div className="text-[10px] text-accent tracking-[0.08em] uppercase mb-1.5">
                      {t('recipes.purchased')}
                    </div>
                    <div className="font-serif text-base text-text mb-3">
                      {purchase.recipe.title[locale]}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-muted">
                        {t('recipes.purchasedAt')}: {formatDate(purchase.purchasedAt)}
                      </span>
                      <span className="text-[11px] text-accent cursor-pointer">
                        {t('recipes.view')} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            </div>

            {/* Show more button */}
            {purchasedRecipes.length > 3 && (
              <button
                onClick={() => setIsPurchasedExpanded(!isPurchasedExpanded)}
                className="mt-4 px-3.5 py-1.5 border border-border text-[10px] tracking-[0.06em] uppercase text-muted hover:text-text transition-colors"
              >
                {isPurchasedExpanded ? t('recipes.showLess') : t('recipes.showMore')} ↓
              </button>
            )}
          </>
        ) : (
          <div className="bg-surface p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[11px] text-muted mb-3 tracking-[0.06em]">
                {t('empty.purchasedTitle')}
              </div>
              <Link
                href={PAGES.RECIPES}
                className="inline-block px-4 py-2 border border-border text-[11px] tracking-[0.06em] uppercase text-text hover:bg-bg transition-colors"
              >
                {t('empty.browseRecipes')} →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Liked recipes */}
      <section className="px-6 sm:px-10 py-9 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-[10px] tracking-[0.12em] uppercase text-accent">
              {t('sections.likedRecipes')}
            </div>
            <div className="text-[10px] px-2 py-0.5 border border-border text-muted">
              {likedRecipes.length}
            </div>
          </div>
          {likedRecipes.length > 3 && (
            <button
              onClick={() => setIsLikedExpanded(!isLikedExpanded)}
              className="px-3.5 py-1.5 border border-border text-[10px] tracking-[0.06em] uppercase text-muted hover:text-text transition-colors"
            >
              {isLikedExpanded ? t('recipes.showLess') : t('recipes.showMore')} ↓
            </button>
          )}
        </div>

        {likedRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {displayedLikedRecipes.map((item) => (
              <Link
                key={item.id}
                href={PAGES.RECIPE(item.recipe.id)}
                className="group bg-bg"
              >
                {/* Recipe image */}
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={item.recipe.heroImg}
                    alt={item.recipe.title[locale]}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Like button */}
                  <button
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-red-500/85 flex items-center justify-center text-white text-sm hover:bg-red-600 transition-colors"
                    onClick={(e) => handleUnlikeRecipe(e, item.recipe.id)}
                  >
                    ♥
                  </button>
                </div>
                {/* Card content */}
                <div className="p-3 sm:p-4 bg-surface">
                  <div className="font-serif text-base text-text mb-2">
                    {item.recipe.title[locale]}
                  </div>
                  <span className="text-[11px] text-accent cursor-pointer">
                    {t('recipes.view')} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-surface p-6 flex items-center gap-4 text-muted">
            <div className="w-12 h-12 border border-border flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-text">{t('liked.addHint')}</p>
              <p className="text-sm">{t('liked.addHintDesc')}</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="px-6 sm:px-10 py-9 pb-12">
        <div className="text-[10px] tracking-[0.12em] uppercase text-accent mb-5">
          {t('sections.quickActions')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
          {/* Browse recipes */}
          <Link
            href={PAGES.RECIPES}
            className="bg-bg p-5 flex items-center gap-4 cursor-pointer hover:bg-surface transition-colors"
          >
            <div className="w-9 h-9 border border-border flex items-center justify-center text-muted shrink-0">
              ☰
            </div>
            <div>
              <div className="text-sm text-text mb-0.5">{t('actions.browseRecipes')}</div>
              <div className="text-[11px] text-muted">{t('actions.browseRecipesDesc')}</div>
            </div>
          </Link>

          {/* Sign out */}
          <button
            className="bg-bg p-5 flex items-center gap-4 cursor-pointer hover:bg-surface transition-colors text-left"
            onClick={handleLogout}
          >
            <div className="w-9 h-9 border border-red-400 dark:border-red-600 flex items-center justify-center text-red-500 dark:text-red-400 shrink-0">
              →
            </div>
            <div>
              <div className="text-sm text-red-500 dark:text-red-400 mb-0.5">{t('actions.signOut')}</div>
              <div className="text-[11px] text-muted">{t('actions.signOutDesc')}</div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default ProfileContent;
