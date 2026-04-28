'use client';

import {SubmitHandler, useForm} from "react-hook-form";
import {getUserProfile, handleEmailLogin, handleGoogleLogin} from "@/lib/supabase/authClient";
import {IoClose} from "react-icons/io5";
import React, {useState} from "react";
import {useUserStore} from "@/store/useUserStore";
import {useTranslations} from "next-intl";
import {usePathname, useRouter} from "@/i18n/navigation";
import {PAGES} from "@/config/page.config";
import {useSearchParams} from "next/navigation";
import ErrorMessage from "@/components/ui/ErrorMessage";

interface ISigninValues {
  emailLogin: string;
  passwordLogin: string;
}

// Google Icon with brand colors
const GoogleIcon = () => (
  <svg width="18"
       height="18"
       viewBox="0 0 24 24">
    <path fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  const {setUserData} = useUserStore();
  const t = useTranslations('common');
  const router = useRouter();

  const closeModal = () => {
    router.back();
  };

  const signinFrom = useForm<ISigninValues>({
    defaultValues: {
      emailLogin: '',
      passwordLogin: ''
    }
  });

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    reset: resetLogin
  } = signinFrom;

  const handleLoginWithEmail: SubmitHandler<ISigninValues> = async (formData) => {
    try {
      const data = await handleEmailLogin(formData.emailLogin, formData.passwordLogin);
      if (data) {
        const profile = await getUserProfile(data.id);

        setUserData({
          id: data.id,
          name: data.user_metadata?.name,
          avatar_url: data.user_metadata?.avatar_url || null,
          role: profile?.role || 'user',
          email: data.email || '',
          createdAt: data.created_at,
        })
      }

      resetLogin();
      closeModal();
    } catch (error) {
      if(error instanceof Error) {
        setError(error.message);
      } else {
        setError(t('auth.errors.default'));
      }
    }
  }

  const searchParams = useSearchParams();
  const pathname = searchParams.get('from') || '/';

  const handleLoginWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = origin + pathname;
    try {
      await handleGoogleLogin(redirectUrl);
    } catch (error) {
      if(error instanceof Error) {
        setError(error.message);
      } else {
        setError(t('auth.errors.default'));
      }
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
      <div className='relative w-11/12 max-w-md bg-surface border border-border p-8 sm:p-10'>
        {/* Close button */}
        <button
          className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted hover:text-text transition-colors'
          onClick={closeModal}
        >
          <IoClose className='text-xl'/>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className='font-serif text-3xl sm:text-4xl italic font-normal text-text mb-2'>
            {t('auth.welcome')}
          </h1>
          <p className="text-sm text-muted">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className='flex items-center w-full border border-border mb-8'>
          <button

            className={`flex-1 py-3 text-sm tracking-wide transition-colors cursor-pointer bg-text text-bg`}
          >
            {t('auth.signIn')}
          </button>
          <button
            onClick={() => router.replace(PAGES.SIGNUP(pathname))}
            className={`flex-1 py-3 text-sm tracking-wide transition-colors bg-transparent text-muted hover:text-text cursor-pointer`}
          >
            {t('auth.signUp')}
          </button>
        </div>


        <div className='w-full'>
          <form className='flex flex-col w-full'
                onSubmit={handleSubmitLogin(handleLoginWithEmail)}>
            <label className='w-full mb-5'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.email')}
          </span>
              <input
                {...registerLogin('emailLogin')}
                className='w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                type="email"
                placeholder={t('auth.emailPlaceholder')}
              />
            </label>
            <label className='w-full mb-6'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.password')}
          </span>
              <input
                {...registerLogin('passwordLogin')}
                className='w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
              />
            </label>
            <button
              type='submit'
              className='w-full py-3.5 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90'
            >
              {t('auth.signIn')}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className='flex items-center w-full my-8'>
          <div className='flex-1 h-px bg-border'></div>
          <span className='px-4 text-xs tracking-widest uppercase text-muted'>{t('auth.or')}</span>
          <div className='flex-1 h-px bg-border'></div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Google button */}
        <button
          onClick={handleLoginWithGoogle}
          className='flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-bg border border-border text-text text-sm tracking-wide hover:border-accent transition-colors'
        >
          <GoogleIcon/>
          {t('auth.continueWithGoogle')}
        </button>
      </div>
    </div>
  );
}