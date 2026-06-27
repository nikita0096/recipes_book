'use client';

import React from 'react';
import {useTranslations} from "next-intl";
import Footer from "@/components/footer/Footer";
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "next/navigation";

const TermsPage = () => {
  const t = useTranslations('legal.terms');
  const tCommon = useTranslations('legal');
  const {user} = useUserStore();

  const router = useRouter();

  const ipItems = t.raw('sections.ip.items') as string[];

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

        <p className="text-text mb-8 leading-relaxed">{t('welcome')}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.use.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.use.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.accounts.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.accounts.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.purchases.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.purchases.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.refund.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.refund.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.ip.title')}</h2>
            <p className="text-muted leading-relaxed mb-3">{t('sections.ip.intro')}</p>
            <ul className="list-disc list-inside text-muted mb-3 space-y-1">
              {ipItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted leading-relaxed">{t('sections.ip.outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.disclaimer.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.disclaimer.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.liability.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.liability.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.changes.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.changes.content')}</p>
          </section>
        </div>
      </div>

      <Footer user={user} isSocialShown={false}/>
    </>
  );
};

export default TermsPage;