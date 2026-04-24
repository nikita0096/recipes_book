'use client';

import React, {useState} from 'react';
import {handleEmailLogin, handleGoogleLogin, handleSignUp, getUserProfile} from "@/lib/supabase/authClient";
import {SubmitHandler, useForm} from "react-hook-form";
import {useUserStore} from "@/store/useUserStore";
import LoginPage from "@/components/authorization/LoginPage";
import SignUpPage from "@/components/authorization/SignUpPage";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {Link} from "@/i18n/navigation";

interface ILoginValues {
  emailLogin: string;
  passwordLogin: string;
}

export interface ISignUpValues {
  emailSignUp: string;
  passwordSignUp: string;
}

// Google Icon with brand colors
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function LoginFullPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const {setUserData} = useUserStore();
  const t = useTranslations('common');
  const router = useRouter();

  const loginFrom = useForm<ILoginValues>({
    defaultValues: {
      emailLogin: '',
      passwordLogin: ''
    }
  });

  const signUpForm = useForm<ISignUpValues>({
    defaultValues: {
      emailSignUp: '',
      passwordSignUp: ''
    }
  })

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    reset: resetLogin
  } = loginFrom;

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    reset: resetSignUp
  } = signUpForm;

  const handleLoginWithEmail: SubmitHandler<ILoginValues> = async (formData) => {
    try {
      const data = await handleEmailLogin(formData.emailLogin, formData.passwordLogin);

      if (data?.user) {
        const profile = await getUserProfile(data.user.id);

        setUserData({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: profile?.role || 'user',
          email: data.user.email || '',
          createdAt: data.user.created_at,
        })
      }

    } catch (err) {
      console.error(err);
    } finally {
      resetSignUp();
      resetLogin();
      router.push('/');
    }
  }

  const handleSignUpWithEmail: SubmitHandler<ISignUpValues> = async (formData) => {
    try {
      await handleSignUp(formData.emailSignUp, formData.passwordSignUp);

      const data = await handleEmailLogin(formData.emailSignUp, formData.passwordSignUp);

      if (data?.user) {
        setUserData({
          id: data.user.id,
          name: data.user.user_metadata?.name || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: 'user',
          email: data.user.email || '',
          createdAt: data.user.created_at,
        });
      }

    } catch (error) {
      console.error(error);
    } finally {
      resetSignUp();
      resetLogin();
      router.push('/');
    }
  }

  const handleLoginWithGoogle = async () => {
    try {
      await handleGoogleLogin();
    } catch (error) {
      console.error(error);
    }
  }

  const handlePageTab = () => {
    if(authMode === 'login') {
      setAuthMode('signup');
      resetLogin();
    } else {
      setAuthMode('login');
      resetSignUp();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-12 px-4">
      <div className='w-full max-w-md'>
        {/* Back link */}
        <Link href="/" className="inline-block text-sm text-muted hover:text-text transition-colors mb-8">
          ← {t('navigation.backToHome')}
        </Link>

        {/* Card */}
        <div className='bg-surface border border-border p-8 sm:p-10'>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className='font-serif text-3xl sm:text-4xl italic font-normal text-text mb-2'>
              {t('auth.welcome')}
            </h1>
            <p className="text-sm text-muted">
              {authMode === 'login' ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
            </p>
          </div>

          {/* Tabs */}
          <div className='flex items-center w-full border border-border mb-8'>
            <button
              onClick={() => { setAuthMode('login'); resetSignUp(); }}
              className={`flex-1 py-3 text-sm tracking-wide transition-colors ${
                authMode === 'login'
                  ? 'bg-text text-bg'
                  : 'bg-transparent text-muted hover:text-text'
              }`}
            >
              {t('auth.logIn')}
            </button>
            <button
              onClick={() => { setAuthMode('signup'); resetLogin(); }}
              className={`flex-1 py-3 text-sm tracking-wide transition-colors ${
                authMode === 'signup'
                  ? 'bg-text text-bg'
                  : 'bg-transparent text-muted hover:text-text'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          {/* Form */}
          {authMode === 'login'
            ? <LoginPage registerLogin={registerLogin}
                         handleSubmitLogin={handleSubmitLogin}
                         handleLoginWithEmail={handleLoginWithEmail}/>
            : <SignUpPage registerSignUp={registerSignUp}
                          handleSubmitSignUp={handleSubmitSignUp}
                          handleSignUpWithEmail={handleSignUpWithEmail}/>}

          {/* Divider */}
          <div className='flex items-center w-full my-8'>
            <div className='flex-1 h-px bg-border'></div>
            <span className='px-4 text-xs tracking-widest uppercase text-muted'>{t('auth.or')}</span>
            <div className='flex-1 h-px bg-border'></div>
          </div>

          {/* Google button */}
          <button
            onClick={handleLoginWithGoogle}
            className='flex items-center justify-center gap-3 w-full py-3.5 px-4 bg-bg border border-border text-text text-sm tracking-wide hover:border-accent transition-colors'
          >
            <GoogleIcon />
            {t('auth.continueWithGoogle')}
          </button>
        </div>
      </div>
    </div>
  );
}