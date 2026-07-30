'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import dynamic from "next/dynamic";
import Image from "next/image";
import {IRecipe, IRecipePremiumIncomplete, RecipePrice} from "@/types/recipe";
import {useTranslations} from "next-intl";
import RecipeIngredient from "@/components/recipes/recipe/RecipeIngredient";
import RecipeMeta from "@/components/recipes/recipe/RecipeMeta";
import {useTypedLocale} from "@/hooks/useTypedLocale";
import {useUserStore} from "@/store/useUserStore";
import {addNewLike} from "@/services/db/recipe-likes/addNewLike";
import {fetchRecipe} from "@/services/db/public/fetchRecipe";
import {deleteLike} from "@/services/db/recipe-likes/deleteLike";
import Footer from "@/components/footer/Footer";
import {usePathname, useRouter} from "next/navigation";
import {RECIPE_PLACEHOLDER_IMAGE} from "@/constants/images";
import {PAGES} from "@/config/page.config";
import EggLoader from "@/components/eggLoader/EggLoader";
import PremiumLockBlock from "@/components/ui/PremiumLockBlock";

// Defer the heavy Stripe and Cloudflare Stream chunks so they aren't part of
// the recipe page's initial JS. They only render conditionally (checkout open /
// recipe has a video), so loading them on demand keeps unused JS off the wire.
// CheckoutModal in particular calls loadStripe() at module scope, so a static
// import would also start downloading the Stripe SDK before the user buys.
const CheckoutModal = dynamic(() => import("@/components/recipes/recipe/CheckoutModal"), {ssr: false});
const SecureVideoPlayer = dynamic(
  () => import("@/components/video/SecureVideoPlayer").then((m) => m.SecureVideoPlayer),
  {ssr: false}
);


interface RecipePageProps {
  recipeId: string;
  isLikedRecipe: boolean;
  initialRecipe?: IRecipe | null;
  initialPrice?: RecipePrice | null;
  initialError?: string | null;
}

const RecipePage: React.FC<RecipePageProps> = ({
                                                 recipeId,
                                                 isLikedRecipe,
                                                 initialRecipe = null,
                                                 initialPrice = null,
                                                 initialError = null
                                               }) => {
  const [recipe, setRecipe] = useState<IRecipe | IRecipePremiumIncomplete | null>(initialRecipe);
  const [isLiked, setIsLiked] = useState(isLikedRecipe);
  const [likes, setLikes] = useState(initialRecipe?.likes || 0);
  const [recipePrice, setRecipePrice] = useState<RecipePrice | null>(initialPrice);
  const [error, setError] = useState<Error | string | null>(initialError);
  const [loading, setLoading] = useState<boolean>(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [isShowLoginNotification, setIsShowLoginNotification] = useState<boolean>(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const loginNotificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending notification timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (loginNotificationTimer.current) clearTimeout(loginNotificationTimer.current);
    };
  }, []);

  const locale = useTypedLocale();
  const t = useTranslations('recipes');
  const {user} = useUserStore();

  const router = useRouter();
  const pathname = usePathname();

  const loadRecipe = useCallback(async () => {
    const {data, totalPrice, error} = await fetchRecipe(recipeId);

    if (error) setError(error);

    if (data) {
      setRecipe(data);
      setLikes(data.likes);
    }

    if (totalPrice) {
      setRecipePrice(totalPrice);
    }
    return data;
  }, [recipeId]);

  const handleBuy = () => {
    if (!user) {
      router.push(PAGES.SIGNIN(pathname));
      return;
    }
    setCheckoutOpen(true);
  };

  const handleCheckoutComplete = async () => {
    // Stripe confirms payment client-side, but the webhook records the purchase
    // asynchronously — so poll the recipe until the unlocked content lands
    // instead of refetching once and possibly racing the webhook.
    setCheckoutOpen(false);
    setLoading(true);
    for (let attempt = 0; attempt < 6; attempt++) {
      const data = await loadRecipe();
      const unlocked = !!data?.recipeSteps?.length || (data?.videoUrl ?? null) !== null;
      if (unlocked) break;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setLoading(false);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-base mb-4">Not found</p>
          <button onClick={router.back}
                  className="text-sm text-muted hover:text-text">
            ← {t('singlePage.backButton')}
          </button>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }


  const handleLike = async () => {
    if (!user) {
      setIsShowLoginNotification(true);
      // Reset any in-flight timer so rapid clicks don't stack timeouts.
      if (loginNotificationTimer.current) clearTimeout(loginNotificationTimer.current);
      loginNotificationTimer.current = setTimeout(() => setIsShowLoginNotification(false), 10000);
      return;
    }

    const isNewLiked = !isLiked;
    setIsLiked(isNewLiked);
    setLikes(prevState => isNewLiked ? prevState + 1 : prevState - 1);

    try {
      if (isNewLiked) {
        await addNewLike(recipe.id, user.id);
      } else {
        await deleteLike(recipe.id, user.id);
      }
    } catch {
      setIsLiked(prevState => !prevState);
      setLikes(prevState => isNewLiked ? prevState - 1 : prevState + 1);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <section className="relative w-full h-100 md:h-120 lg:h-150">
        <Image
          src={recipe.heroImg || RECIPE_PLACEHOLDER_IMAGE}
          alt={recipe.title[locale]}
          fill
          sizes="100vw"
          className='relative object-cover'
          priority
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.08) 45%, transparent 100%)'}}
        />

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 lg:top-10 lg:left-10 2xl:top-20 2xl:left-20 z-10 w-[46px] h-[46px] flex flex-col items-center justify-center gap-px transition-all cursor-pointer select-none hover:scale-105 active:scale-95 bg-white/12 border border-white/40 text-accent"
        >
          ←
        </button>

        {/* Save button */}
        <div className='absolute top-6 right-6 lg:top-10 lg:right-10 2xl:top-20 2xl:right-20 z-10'>
          <div className='relative flex flex-row items-center gap-2'>
            <p
              className={`${isShowLoginNotification ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} whitespace-nowrap text-[11px] md:text-sm lg:text-md bg-white/12 border border-white/40 text-accent px-3 py-2 transition-opacity duration-200 ease-in-out delay-75`}
              style={{WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}
            >
              {t.rich('singlePage.saveHint', {
                link: (chunks) => (
                  <a
                    className="font-medium text-black underline underline-offset-2 hover:text-accent transition-colors cursor-pointer"
                    href={PAGES.SIGNIN(pathname)}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
            <button
              type="button"
              onClick={handleLike}
              className={`w-[46px] h-[46px] flex flex-col items-center justify-center gap-px transition-all cursor-pointer select-none hover:scale-105 active:scale-95 ${
                isLiked
                  ? 'bg-accent border-accent'
                  : 'bg-white/12 border-white/40'
              } border`}
              style={{WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)'}}
            >
            <span className={`leading-none ${
              isLiked
                ? 'text-white'
                : 'text-accent'
            }`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3a2 2 0 0 0-2 2v15.28a.7.7 0 0 0 1.05.6L12 17l6.95 3.88A.7.7 0 0 0 20 20.28V5a2 2 0 0 0-2-2H6z" />
              </svg>
            </span>
              <span className={`text-[10px] text-white/85 font-sans ${
                isLiked
                  ? 'text-white'
                  : 'text-accent'
              }`}>{likes}</span>
            </button>
          </div>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-7 left-5 sm:left-8 right-20">
          {/* Category */}
          <span className="inline-block text-[10px] tracking-[0.12em] uppercase text-accent border border-accent px-2.5 py-[3px] mb-3 bg-bg/40">
            {recipe.category && recipe.category[locale]}
          </span>

          {/* Title */}
          <h1
            className="text-[clamp(28px,5vw,48px)] italic font-normal text-white leading-[1.1] mb-1"
            style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
          >
            {recipe.title[locale]}
          </h1>
        </div>
      </section>

      {/* Recipe Meta Stats */}
      <RecipeMeta
        preparingTime={recipe.preparingTime}
        stepsCount={recipe.stepsCount}
        weight={recipe.weight}
        diameter={recipe.diameter}
        calories={recipe.calories}
      />

      {/* Description Section */}
      {recipe.description && recipe.description[locale] && (
        <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <h2 className="text-xs tracking-widest uppercase text-accent mb-4">
            {t('singlePage.description')}
          </h2>
          <p className="text-sm sm:text-base text-text leading-relaxed max-w-2xl text-pretty">
            {recipe.description[locale]}
          </p>
        </section>
      )}

      {/* Key Ingredients Section */}
      <section className="border-b border-border px-4 sm:px-6 lg:px-10 py-6 sm:py-7">
        <h2 className="text-xs tracking-widest uppercase text-accent mb-5">
          {t('singlePage.keyIngredients')}
        </h2>
        <div>
          {recipe.ingredients.map((group) => (
            <div
              key={group.id}
              className="mt-6 pt-6 border-t border-border first:mt-0 first:pt-0 first:border-t-0"
            >
              {group.title[locale] && (
                <div className="flex items-baseline gap-2.5 mb-3">
                  <h3
                    className="text-lg italic text-text"
                    style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}
                  >
                    {group.title[locale]}
                  </h3>
                  <span className="text-xs tracking-widest uppercase text-muted whitespace-nowrap">
                    {t('singlePage.ingredientsCount', {count: group.ingredients.length})}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
                {group.ingredients.map((item) => (
                  <RecipeIngredient key={item.id} ingredient={item}/>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Premium Lock Block - показываем когда steps и video недоступны */}
      {!recipe.recipeSteps?.length && recipe.videoUrl === null && (
        <PremiumLockBlock recipePrice={recipePrice} loading={loading} handleBuy={handleBuy} />
      )}

      {/* Preparation Steps Section */}
      {recipe.recipeSteps && recipe.recipeSteps.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.preparationSteps')}
          </h2>

          <div className="flex flex-col gap-px bg-border">
            {recipe.recipeSteps?.map((step, i) => (
              <div key={step.id}
                   className="bg-bg">

                {/* Mobile/Tablet: Number + Description */}
                <div className="lg:hidden grid grid-cols-[44px_1fr] sm:grid-cols-[52px_1fr] items-center">
                  <div className="pl-4 sm:pl-5 self-stretch flex items-center border-r border-border">
                      <span className="text-sm sm:text-base text-accent font-semibold">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                  </div>
                  <div>
                    {step.imgUrl && (
                      <div className="lg:hidden p-1">
                        <div className="relative w-full aspect-video">
                          <Image
                            src={step.imgUrl || RECIPE_PLACEHOLDER_IMAGE}
                            alt={`${t('singlePage.step')} ${i + 1}`}
                            fill
                            sizes="100vw"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="p-4 sm:p-5">
                      <p className="text-sm sm:text-base text-text leading-relaxed">
                        {step.desc[locale]}
                      </p>
                    </div>
                    {/* Mobile/Tablet: Image on top */}
                  </div>
                </div>


                {/* Desktop: Grid layout with image on right */}
                <div className="lg:grid lg:grid-cols-[60px_1fr_1fr] lg:items-stretch">
                  {/* Step number */}
                  <div className="hidden lg:flex items-center pl-5 border-r border-border">
                    <span className="text-base text-accent font-semibold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Desktop: Description */}
                  <div className="hidden lg:flex items-center p-5 lg:px-7 overflow-hidden">
                    <p className="text-base text-text leading-relaxed">
                      {step.desc[locale]}
                    </p>
                  </div>

                  {/* Desktop: Image */}
                  {step.imgUrl && (
                    <div className="hidden lg:block border-l border-border p-1">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={step.imgUrl}
                          alt={`${t('singlePage.step')} ${i + 1}`}
                          fill
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Video Tutorial Section */}
      {recipe.videoUrl && (
        <section className="border-t border-border mt-6 sm:mt-7 lg:mt-8 px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8 pb-10 sm:pb-12 lg:pb-14">
          <h2 className="text-sm tracking-widest uppercase text-accent mb-4 sm:mb-5 lg:mb-6">
            {t('singlePage.videoSection')}
          </h2>
          <div className='flex items-center justify-center'>
            <div className="relative w-full lg:w-3/4 rounded-xl overflow-hidden">
              <SecureVideoPlayer
                recipeId={recipeId}
                videoKey={recipe.videoUrl}
                className="w-full h-full"
                thumbnail={recipe.heroImg}
                setIsVideoSrcLoaded={setIsVideoLoaded}
              />
              {!isVideoLoaded && (
                  <div className='aspect-video flex items-center justify-center'>
                    <EggLoader/>
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <div className='flex items-center justify-center mb-15'>
        <button
          onClick={() => router.back()}
          className="text-sm text-text/70 tracking-wide hover:text-white/90 transition-colors z-10 cursor-pointer"
        >
          ← {t('singlePage.backButton')}
        </button>
      </div>
      <Footer user={user}/>

      {checkoutOpen && (
        <CheckoutModal
          recipeId={recipeId}
          onClose={() => setCheckoutOpen(false)}
          onComplete={handleCheckoutComplete}
        />
      )}
    </div>
  );
};

export default RecipePage;
