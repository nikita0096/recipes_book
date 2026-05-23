'use client';

import React, {useEffect, useRef, useState} from 'react';
import {fetchAuthorInfo} from "@/services/db/author/fetchAuthorInfo";
import Image from "next/image";
import {useTranslations} from "next-intl";
import {SubmitHandler, useForm} from "react-hook-form";
import {updateAuthorInfo} from "@/services/db/author/updateAuthorInfo";
import {Spinner} from "@/components/ui/spinner";
import {MdDeleteForever} from "react-icons/md";
import {LocalizedText} from "@/types";

export interface AuthorInfoForm {
  instagram: string;
  tikTok: string;
  youTube: string;
  facebook: string;
  telegram: string;
  imageFile: File | null;
  image: string;
  name: string;
  recipesCount: number;
  subscribers: number;
  views: number;
  email: string;
  description: LocalizedText
}

interface AuthorInfoState {
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


const Page = () => {
  const [author, setAuthor] = useState<AuthorInfoState | null>(null);
  const [error, setError] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const initFetch = useRef(true);

  const t = useTranslations('admin');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<AuthorInfoForm>({
    defaultValues: {
      instagram: '',
      tikTok: '',
      youTube: '',
      facebook: '',
      telegram: '',
      imageFile: null,
      image: '',
      name: '',
      email: '',
      recipesCount: 0,
      subscribers: 0,
      views: 0,
      description: {
        en: '',
        ua: ''
      }
    }
  });

  useEffect(() => {
    const fetchAuthor = async () => {
      const data = await fetchAuthorInfo();

      if(data.error) setError(data.error.message);

      setAuthor(data.data);
    }

    if (initFetch.current) {
      fetchAuthor();
      initFetch.current = false;
    }

    if (author) {
      setValue('youTube', author.youTube);
      setValue('instagram', author.instagram);
      setValue('tikTok', author.tikTok);
      setValue('facebook', author.facebook);
      setValue('telegram', author.telegram);
      setValue('name', author.name);
      setValue('image', author.image);
      setValue('recipesCount', author.recipesCount);
      setValue('subscribers', author.subscribers);
      setValue('views', author.views);
      setValue('email', author.email);
      setValue('description.en', author.description.en || '');
      setValue('description.ua', author.description.ua || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [author]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file !== null) {
      const image = URL.createObjectURL(file);

      setValue('image', image)
      setValue('imageFile', file);
    }
  }

  const deleteImage = () => {
    setValue('image', '');
    setValue('imageFile', null);
  }

  const updateAuthor: SubmitHandler<AuthorInfoForm> = async (formData) => {
    if (!author?.id) return;
    setError(null);

    if (!formData.image && !formData.imageFile) {
      setError(t('form.author.validation.addPicture'));
      return;
    }

    setLoading(true);

    try {
      const data = await updateAuthorInfo(author.id, formData, author.image);
      setAuthor(data.data);
      setValue('imageFile', null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Couldn\'t update author');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!author) return null;

  const imageUrl = watch('image');

  return (
    <section className='flex flex-col items-center justify-center'>
      <form onSubmit={handleSubmit(updateAuthor)}
            className='grid grid-cols-1 md:grid-cols-2 gap-5 p-5 md:p-10 w-full'>
        <div className='relative aspect-square'>
          {imageUrl ? (
            <div>
              <Image
                src={imageUrl}
                alt={author.name}
                fill
                style={{objectFit: 'cover'}}
                className='w-full h-full'
                priority
              />
              <button
                type="button"
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                onClick={deleteImage}
              >
                <MdDeleteForever className="text-lg"/>
              </button>
            </div>
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
                       multiple={false}
                       accept="image/*"
                       onChange={(e) => handleImage(e)}
                />
                {t('form.buttons.addPicture')}
              </label>
            </div>
          )}
        </div>
        <div className='flex flex-col items-start justify-start gap-2 w-full'>
          <h4>{t('form.author.authorInfo')}</h4>
          <label htmlFor="instagram" className="block text-xs tracking-[0.08em] uppercase text-muted" >
            Instagram
          </label>
          <input id="instagram"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('instagram')}
                 placeholder='Instagram'/>
          <label htmlFor="tikTok" className="block text-xs tracking-[0.08em] uppercase text-muted">
            TikTok
          </label>
          <input id="tikTok"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('tikTok')}
                 placeholder='TikTok'/>
          <label htmlFor="facebook" className="block text-xs tracking-[0.08em] uppercase text-muted">
            Facebook
          </label>
          <input id="facebook"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('facebook')}
                 placeholder='Facebook'/>
          <label htmlFor="youTube" className="block text-xs tracking-[0.08em] uppercase text-muted">
            Youtube
          </label>
          <input id="youTube"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('youTube')}
                 placeholder='Youtube'/>
          <label htmlFor="telegram" className="block text-xs tracking-[0.08em] uppercase text-muted">
            Telegram
          </label>
          <input id="telegram"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('telegram')}
                 placeholder='Telegram'/>
          <label htmlFor="name" className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.authorName')}
          </label>
          <input id="name"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="text"
                 {...register('name', {required: true})}
                 placeholder={t('form.author.authorName')}/>
          <label htmlFor="recipesCount" className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderRecipesCount')}
          </label>
          <input id="recipesCount"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 {...register('recipesCount', {required: true})}
                 placeholder={t('form.author.placeholderRecipesCount')}/>
          <label htmlFor="views" className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderViews')}
          </label>
          <input id="views"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 {...register('views', {required: true})}
                 placeholder={t('form.author.placeholderViews')}/>
          <label htmlFor="subscribers" className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.placeholderSubscribers')}
          </label>
          <input id="subscribers"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="number"
                 step="0.1"
                 {...register('subscribers', {required: true})}
                 placeholder={t('form.author.placeholderSubscribers')}/>
          <label htmlFor="email" className="block text-xs tracking-[0.08em] uppercase text-muted">
            Email
          </label>
          <input id="email"
                 className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                 type="email"
                 {...register('email', {required: true})}
                 placeholder="Email"/>
          <label htmlFor="description-ua" className="block text-xs tracking-[0.08em] uppercase text-muted mt-4">
            {t('form.author.descriptionUA')}
          </label>
          <textarea
            id="description-ua"
            className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors min-h-[120px]"
            {...register('description.ua', {required: true})}
            placeholder={t('form.author.descriptionUA')}
          />
          <label htmlFor="description-en" className="block text-xs tracking-[0.08em] uppercase text-muted">
            {t('form.author.descriptionEN')}
          </label>
          <textarea
            id="description-en"
            className="w-full px-3.5 py-2.5 bg-surface border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors min-h-[120px]"
            {...register('description.en', {required: true})}
            placeholder={t('form.author.descriptionEN')}
          />
          <div className='flex flex-col gap-2 items-center justify-center w-full mt-4'>
            {error && (
              <p className='text-red-400'>{error}</p>
            )}
            <button
              className="flex flex-row items-center justify-center px-10 py-4 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >{loading ? <Spinner/> : t('form.author.submitForm')}</button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default Page;