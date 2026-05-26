'use client';

import React from 'react';
import {useTranslations} from "next-intl";
import Footer from "@/components/footer/Footer";
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "next/navigation";

const PrivacyPage = () => {
  const t = useTranslations('legal.privacy');
  const tCommon = useTranslations('legal');
  const {user} = useUserStore();

  const router = useRouter();

  const collectItems = t.raw('sections.collect.items') as string[];
  const authItems = t.raw('sections.auth.items') as string[];
  const usageItems = t.raw('sections.usage.items') as string[];

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors mb-8 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          {tCommon('backButton')}
        </button>

        <h1 className="font-serif text-4xl italic font-normal text-text mb-2">
          {t('title')}
        </h1>
        <p className="text-sm text-muted mb-8">{t('lastUpdated')}</p>

        <p className="text-text mb-8 leading-relaxed">{t('intro')}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.collect.title')}</h2>
            <p className="text-muted leading-relaxed mb-3">{t('sections.collect.intro')}</p>
            <ul className="list-disc list-inside text-muted space-y-1">
              {collectItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.auth.title')}</h2>
            <p className="text-muted leading-relaxed mb-3">{t('sections.auth.intro')}</p>
            <ul className="list-disc list-inside text-muted mb-3 space-y-1">
              {authItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted leading-relaxed">{t('sections.auth.outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.usage.title')}</h2>
            <p className="text-muted leading-relaxed mb-3">{t('sections.usage.intro')}</p>
            <ul className="list-disc list-inside text-muted space-y-1">
              {usageItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.sharing.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.sharing.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.cookies.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.cookies.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.security.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.security.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.rights.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.rights.content')}</p>
          </section>
        </div>
      </div>

      <Footer user={user} isSocialShown={false}/>
    </>
  );
};

export default PrivacyPage;