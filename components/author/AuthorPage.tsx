'use client';

import Link from 'next/link';
import {useLocale, useTranslations} from "next-intl";
import Image from "next/image";
import authorImage from "@/public/images/about/home-author.png";
import {useUserStore} from "@/store/useUserStore";
import Footer from "@/components/footer/Footer";
import {LocalizedText} from "@/types";

interface AuthorData {
  instagram: string;
  tikTok: string;
  youTube: string;
  facebook: string;
  telegram: string;
  id: string;
  image: string;
  name: string;
  recipesCount: number;
  subscribers: number;
  views: number;
  email: string;
  description: LocalizedText;
}

interface AuthorPageProps {
  authorData: AuthorData;
}

const socialLinks = [
  {
    name: 'Instagram',
    color: '#E1306C',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'TikTok',
    color: '#000000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    color: '#FF0000',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    name: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'Telegram',
    color: '#2CA5E0',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 5L2 12.5l7 1M21 5l-4 15-8-5.5M21 5L9 13.5m0 0V19l3-2.5"/>
      </svg>
    ),
  },
];

const AuthorPage = ({authorData}: AuthorPageProps) => {
  const t = useTranslations('about');
  const locale = useLocale();

  const {user} = useUserStore();

  const author = authorData;

  const getSocialMediaLink = (label: string) => {
    switch (label) {
      case 'Facebook':
        return author?.facebook;
      case 'Telegram':
        return author?.telegram;
      case 'Instagram':
        return author?.instagram;
      case 'YouTube':
        return author?.youTube;
      case 'TikTok':
        return author?.tikTok;
      default:
        return '';
    }
  }

  if(!author) return null;

  return (
    <section className="min-h-screen">
      {/* Hero split */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border">
        {/* Left — photo */}
        <div className="relative bg-surface border-b lg:border-b-0 lg:border-r border-border min-h-[400px] sm:min-h-[450px] lg:min-h-[480px]">
          <Image
            src={author.image ? author.image : authorImage}
            alt={author.name}
            fill
            className="object-cover"
            sizes="(min-width: 400px) 100vw"
            priority
          />
          {/* Subtle overlay for dark theme */}
          <div className="absolute inset-0 bg-linear-to-r from-bg/10 to-transparent dark:from-bg/20 pointer-events-none" />
        </div>

        {/* Right — bio */}
        <div className="col-span-2 p-8 w-full sm:p-12 lg:p-14 flex flex-col justify-center">
          <span className="text-[10px] tracking-[0.15em] uppercase text-accent block mb-5">
            {t('about.badge')}
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl italic font-normal text-text leading-tight tracking-tight mb-6">
            {t('about.title')}
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-10 max-w-md whitespace-pre-line">
            {author.description[locale as 'en' | 'uk']}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-border">
            {[
              {num: author?.recipesCount + '+', label: t('about.stats.recipes')},
              {num: author?.subscribers + 'M+', label: t('about.stats.subscribers')},
              {num: author?.views + 'M+', label: t('about.stats.views')}
            ].map(({num, label}) => (
              <div key={label} className="bg-bg py-5">
                <div className="font-serif text-center text-2xl sm:text-3xl text-accent tracking-tight mb-1">
                  {num}
                </div>
                <div className="text-center text-[11px] text-muted tracking-[0.06em] uppercase">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social section */}
      <div className="py-16 px-8 sm:px-14 border-b border-border text-center">
        <div className="text-[10px] tracking-[0.15em] uppercase text-accent mb-4">
          {t('page.followLabel')}
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl italic font-normal text-text mb-3 tracking-tight">
          {t('page.title')}
        </h2>
        <p className="text-sm text-muted mb-10 max-w-sm mx-auto">
          {t('page.subtitle')}
        </p>
        <div className="flex justify-center gap-4">
          {socialLinks.map((social) => {
            const link = getSocialMediaLink(social.name);

            if(!link) return null;

            return (
              <Link
                key={social.name}
                href={link}
                title={social.name}
                className="w-12 h-12 border border-border flex items-center justify-center text-muted
                         hover:border-current hover:text-[var(--hover-color)] hover:bg-[var(--hover-color)]/10
                         transition-all duration-200"
                style={{'--hover-color': social.color} as React.CSSProperties}
              >
                {social.icon}
              </Link>
            )
          })}
        </div>

      </div>

      <Footer isSocialShown={false} user={user}/>
    </section>
  );
}

export default AuthorPage;