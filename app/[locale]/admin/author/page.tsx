'use client';

import React, {useEffect, useRef, useState} from 'react';
import {AuthorInfo, fetchAuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {useForm} from "react-hook-form";

interface AuthorInfoForm {
  instagram: string;
  tikTok: string;
  youTube: string;
  facebook: string;
  telegram: string;
  image: string;
  name: string;
  recipesCount: number;
  subscribers: number;
  views: number;
}


const Page = () => {
  const [author, setAuthor] = useState<AuthorInfo | null>(null);

  const initFetch = useRef(true);

  const t = useTranslations('admin');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    resetField,
    getValues,
    watch,
    formState: {errors}
  } = useForm<AuthorInfoForm>({
    defaultValues: {
      instagram: '',
      tikTok: '',
      youTube: '',
      facebook: '',
      telegram: '',
      image: '',
      name: '',
      recipesCount: 0,
      subscribers: 0,
      views: 0
    }
  });

  useEffect(() => {
    const fetchAuthor = async () => {
      const data = await fetchAuthorInfo();

      setAuthor(data);
    }

    if (initFetch.current) {
      fetchAuthor();
      initFetch.current = false;
    }
    console.log(author);
  }, [author]);

  if (!author) return null;

  return (
    <section className='flex flex-col items-center justify-center pb-10'>
      <form className='grid grid-cols-2 gap-5 p-5 md:p-10'>
        <div className='aspect-square'>
          {author.image !== '' ? (
            <Image
              src={author.image}
              alt={author.name}
              fill
              style={{objectFit: 'cover'}}
              priority
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3.5 w-full h-full py-12 border border-dashed border-border cursor-pointer">
              <svg width="24"
                   height="24"
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="1.5"
                   className="text-muted">
                <rect x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"/>
                <circle cx="8.5"
                        cy="8.5"
                        r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
              <label className="cursor-pointer text-xs tracking-[0.06em] uppercase text-muted hover:text-text transition-colors">
                <input type="file"
                       hidden
                       multiple={false}/>
                {t('form.buttons.addPicture')}
              </label>
            </div>
          )}
        </div>
        <div className='flex flex-col items-start justify-start gap-2 w-full p-5'>
          <h4>{t('form.author.authorInfo')}</h4>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            Instagram
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('instagram', {required: true})}
                 placeholder='Instagram'/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            TikTok
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('tikTok', {required: true})}
                 placeholder='TikTok'/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            Facebook
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('facebook', {required: true})}
                 placeholder='Facebook'/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            Youtube
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('youTube', {required: true})}
                 placeholder='Youtube'/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            Telegram
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('telegram', {required: true})}
                 placeholder='Telegram'/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.authorName')}
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('name', {required: true})}
                 placeholder={t('form.author.authorName')}/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderRecipesCount')}
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 {...register('recipesCount', {required: true})}
                 placeholder={t('form.author.placeholderRecipesCount')}/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderViews')}
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 {...register('views', {required: true})}
                 placeholder={t('form.author.placeholderViews')}/>
          <label className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderSubscribers')}
          </label>
          <input className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 {...register('subscribers', {required: true})}
                 placeholder={t('form.author.placeholderSubscribers')}/>
        </div>
      </form>
      <button
        className="flex flex-row items-center justify-center px-10 py-4 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
        type="submit"
      >{t('form.author.submitForm')}</button>
    </section>
  );
};

export default Page;