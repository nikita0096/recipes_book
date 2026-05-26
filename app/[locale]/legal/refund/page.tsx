'use client';

import React from 'react';
import {useTranslations} from "next-intl";
import {Link} from '@/i18n/navigation';
import {PAGES} from "@/config/page.config";
import Footer from "@/components/footer/Footer";
import {useUserStore} from "@/store/useUserStore";
import {useRouter} from "next/navigation";

const RefundPage = () => {
  const t = useTranslations('legal.refund');
  const tCommon = useTranslations('legal');
  const {user} = useUserStore();

  const router = useRouter();

  const exceptionItems = t.raw('sections.exceptions.items') as string[];

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

        <p className="text-text mb-8 leading-relaxed">{t('thanks')}</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.digital.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.digital.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.noRefunds.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.noRefunds.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.exceptions.title')}</h2>
            <p className="text-muted leading-relaxed mb-3">{t('sections.exceptions.intro')}</p>
            <ul className="list-disc list-inside text-muted mb-3 space-y-1">
              {exceptionItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p className="text-muted leading-relaxed">{t('sections.exceptions.outro')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.unauthorized.title')}</h2>
            <p className="text-muted leading-relaxed">{t('sections.unauthorized.content')}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">{t('sections.contact.title')}</h2>
            <p className="text-muted leading-relaxed mb-2">{t('sections.contact.content')}</p>
            <a
              href="mailto:hello@yuliia-recipes.com"
              className="text-accent hover:underline"
            >
              hello@yuliia-recipes.com
            </a>
          </section>
        </div>
      </div>

      <Footer user={user} isSocialShown={false}/>
    </>
  );
};

export default RefundPage;