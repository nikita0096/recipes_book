'use client';

import React, {useEffect, useState} from 'react';
import { Link } from '@/i18n/navigation';
import { PAGES } from '@/config/page.config';
import {useLocale, useTranslations} from 'next-intl';
import {UserState} from "@/store/useUserStore";
import {supabase} from "@/lib/supabase/ClientComponentClient";
import Image from "next/image";
import {LocalizedText} from "@/types";
import {useTypedLocale} from "@/hooks/useTypedLocale";


interface FooterProps {
  isSocialShown?: boolean;
  user: UserState | null;
}

interface SocialMediaLinks {
  instagram: string;
  tikTok: string;
  youTube: string;
  facebook: string;
  telegram: string;
}

const Footer: React.FC<FooterProps> = ({ user, isSocialShown = true}) => {
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLinks | null>(null);
  const [description, setDescription] = useState<LocalizedText | null>(null);
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  const locale = useTypedLocale();

  useEffect(() => {
    const fetchSocialMediaLinksAndDescription = async () => {
      const {data, error} = await supabase.from('author').select('inst_link, tik_tok_link, you_tube_link, facebook_link, telegram_link,  description_footer');

      if(!error) {
        setSocialMediaLinks({
          instagram: data[0].inst_link,
          tikTok: data[0].tik_tok_link,
          youTube: data[0].you_tube_link,
          facebook: data[0].facebook_link,
          telegram: data[0].telegram_link
        });

        setDescription(data[0].description_footer);
      }

    }

    fetchSocialMediaLinksAndDescription()
  }, []);

  return (
    <footer className="relative bg-bg from-gray-900 to-gray-950 text-white overflow-hidden">
      {/* Decorative top wave */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent to-transparent" />

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="relative flex items-center gap-3 mb-6">
              <Image
                src='/images/icon-light.png'
                width={50}
                height={50}
                alt="icon"
                className='block dark:hidden'
              />
              <Image
                src='/images/icon-dark.png'
                width={50}
                height={50}
                alt="icon"
                className='hidden dark:block'
              />
              <div>
                <div className='flex flex-col '>
                  <span className="text-lg/3 font-bold text-black dark:text-white">
                  Recipes
                </span>
                  <span className='text-md font-bold text-accent'>
                  Collection
                </span>
                </div>
                <p className="text-sm text-gray-400">by Yuliia Stohantseva</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-400 max-w-md mb-6 leading-relaxed">
              {description ? description[locale] : (t('description'))}
            </p>

            {/* Social links */}
            {isSocialShown && (
              <div className="flex items-center gap-4">
                {socialMediaLinks?.instagram && (
                  <a
                    href={socialMediaLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-linear-to-br hover:from-purple-500 hover:via-pink-500 hover:to-orange-500 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {socialMediaLinks?.tikTok && (
                  <a
                    href={socialMediaLinks.tikTok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-black rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg border border-transparent hover:border-white/20"
                    aria-label="TikTok"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    </svg>
                  </a>
                )}
                {socialMediaLinks?.facebook && (
                  <a
                    href={socialMediaLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {socialMediaLinks?.youTube && (
                  <a
                    href={socialMediaLinks.youTube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    aria-label="YouTube"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                )}
                {socialMediaLinks?.telegram && (
                  <a
                    href={socialMediaLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-[#0088cc] rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                    aria-label="Telegram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.016.094.036.308.02.475z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm md:text-md font-semibold mb-6 flex items-center gap-2 text-text">
              <span className="w-8 h-0.5 bg-linear-to-r from-[#a67c52] to-[#d4a574] rounded-full" />
              {t('quickLinks.title')}
            </h4>
            <nav className="space-y-4 md:space-y-3">
              <Link
                href={PAGES.HOME}
                className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
              >
                {t('quickLinks.home')}
              </Link>
              <Link
                href={PAGES.RECIPES}
                className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
              >
                {t('quickLinks.recipes')}
              </Link>
              {user !== null && (
                <Link
                  href={PAGES.PROFILE(user.id)}
                  className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
                >
                  {t('quickLinks.profile')}
                </Link>
              )}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm md:text-md font-semibold mb-6 flex items-center gap-2 text-text">
              <span className="w-8 h-0.5 bg-linear-to-r from-[#a67c52] to-[#d4a574] rounded-full" />
              {t('legal.title')}
            </h4>
            <nav className="space-y-4 md:space-y-3">
              <Link
                href={PAGES.TERMS}
                className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
              >
                {t('legal.terms')}
              </Link>
              <Link
                href={PAGES.PRIVACY}
                className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
              >
                {t('legal.privacy')}
              </Link>
              <Link
                href={PAGES.REFUND}
                className="block text-sm text-gray-400 hover:text-accent transition-colors duration-300 hover:translate-x-1 transform"
              >
                {t('legal.refund')}
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm md:text-md font-semibold mb-6 flex items-center gap-2 text-text">
              <span className="w-8 h-0.5 bg-linear-to-r from-[#a67c52] to-[#d4a574] rounded-full" />
              {t('contact.title')}
            </h4>
            <div className="space-y-4">
              <a
                href="mailto:hello@yuliia-recipes.com"
                className="flex items-center gap-3 text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors duration-300 group"
              >
                <div className="w-10 h-10 bg-gray-800 group-hover:bg-amber-500/20 rounded-xl flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-sm">hello@yuliia-recipes.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs md:text-sm">
              &copy; {currentYear} The Cookbook by YS. {t('copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
