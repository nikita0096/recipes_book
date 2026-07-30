'use client';
import React from 'react';
import {useTranslations} from "next-intl";
import {RecipePrice} from "@/types";
import EggLoader from "@/components/eggLoader/EggLoader";

const LockIcon = ({size = 16, className = ''}: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4"
          y="11"
          width="16"
          height="10"
          rx="1.5"/>
    <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
  </svg>
);

const UnlockIcon = ({size = 16, className = ''}: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="4"
          y="11"
          width="16"
          height="10"
          rx="1.5"/>
    <path d="M8 11V7a4 4 0 0 1 8 0"/>
  </svg>
);

interface LockBlockProps {
  recipePrice: RecipePrice | null,
  loading: boolean,
  handleBuy: () => void,
}

const PremiumLockBlock: React.FC<LockBlockProps> = ({recipePrice, loading, handleBuy}) => {

  const t = useTranslations('recipes');

  return (
    <section className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-7 lg:pt-8 pb-10 sm:pb-12 lg:pb-14">
      <div className="relative">
        {/* Blurred fake steps */}
        <div className="absolute top-0 left-0 w-full h-full blur opacity-60 select-none pointer-events-none border border-border bg-surface">
          <div className="px-4 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-5">
                <span className="text-xs tracking-widest uppercase text-accent font-medium">
                  {t('singlePage.preparationSteps')}
                </span>
          </div>
          <div className="flex flex-col gap-px bg-border">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex bg-bg"
              >
                <div className="w-8 sm:w-10 lg:w-14 shrink-0 flex items-center pl-2 sm:pl-4">
                      <span className="text-sm text-accent font-semibold">
                        {String(i).padStart(2, '0')}
                      </span>
                </div>
                <div className="flex-1 p-3 sm:p-4 lg:p-5 border-l border-r border-border">
                  <p className="text-sm sm:text-base text-text leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.
                  </p>
                </div>
                <div className="hidden sm:block w-36 lg:flex-1 min-h-28 lg:min-h-36 bg-surface"/>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-bg/50 to-bg pointer-events-none"/>

        {/* Unlock card */}
        <div className='w-full h-full flex items-center justify-center pt-40 sm:pt-20'>
          {loading ? (
            <div className='relative md:w-11/12 w-9/12 max-w-md px-6 sm:px-9 py-7 sm:py-8 min-h-[350px]'>
              <EggLoader/>
            </div>
          ) : (
            <div className="relative md:w-11/12 w-9/12 max-w-md px-6 sm:px-9 py-7 sm:py-8 bg-surface border border-border text-center shadow-2xl">
              {/* Lock icon */}
              <div className="size-9 sm:size-10 rounded-full bg-accent/15 border border-accent mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <LockIcon size={16}
                          className="text-accent"/>
              </div>

              {/* Eyebrow */}
              <div className="text-xs tracking-widest uppercase text-accent mb-1.5 sm:mb-2 font-medium">
                {t('singlePage.premiumLock.eyebrow')}
              </div>

              {/* Title */}
              <h3 className="font-serif italic font-normal text-lg sm:text-2xl leading-tight text-text mb-2 sm:mb-2.5 text-balance">
                {t('singlePage.premiumLock.title')}
              </h3>

              {/* Description */}
              <p className="text-xs md:text-sm text-muted leading-relaxed mb-4 sm:mb-5 text-pretty">
                {t('singlePage.premiumLock.description')}
              </p>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-2.5 mb-4 sm:mb-5">
                {recipePrice && (
                  <span className="text-sm text-white/80">
                        {recipePrice.discount && recipePrice.discount > 0 ? (
                          <div className="flex items-end gap-2">
                              <span className="font-serif italic text-2xl md:text-4xl text-text leading-none">
                                ${(recipePrice.price.en * (1 - recipePrice.discount / 100)).toFixed(2)}
                              </span>
                            <span className="text-xs md:text-sm text-muted line-through">
                                ${recipePrice.price.en}
                              </span>
                          </div>
                        ) : (
                          <span className="font-serif italic text-2xl md:text-4xl text-text leading-none">
                            ${recipePrice?.price.en}
                          </span>
                        )}
                      </span>
                )}
              </div>

              {/* Buy button */}
              <button
                type="button"
                onClick={handleBuy}
                className="w-full bg-accent text-bg font-medium text-sm tracking-wider uppercase py-3 px-5 md:py-3.5 md:px-6 inline-flex items-center justify-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
              >
                <UnlockIcon size={13}
                            className="text-bg"/>
                {t('singlePage.premiumLock.buyButton')}
              </button>

              {/* Footer */}
              <div className="text-xs text-muted mt-3">
                {t('singlePage.premiumLock.footer')}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PremiumLockBlock;