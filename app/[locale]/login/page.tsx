'use client';

import React, {useState} from 'react';
import {FaGoogle} from "react-icons/fa";
import {handleEmailLogin, handleGoogleLogin, handleSignUp, getUserProfile} from "@/lib/supabase/authClient";
import {SubmitHandler, useForm} from "react-hook-form";
import {useUserStore} from "@/store/useUserStore";
import LoginPage from "@/components/authorization/LoginPage";
import SignUpPage from "@/components/authorization/SignUpPage";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";

interface ILoginValues {
  emailLogin: string;
  passwordLogin: string;
}

export interface ISignUpValues {
  emailSignUp: string;
  passwordSignUp: string;
}

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className='relative w-full max-w-md bg-white dark:bg-gray-800 flex flex-col items-center p-8 rounded-2xl shadow-2xl border border-amber-100 dark:border-gray-700'>
        {/* Header */}
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-6'>
          {t('auth.welcome')}
        </h2>

        {/* Tabs */}
        <div className='flex items-center w-full max-w-xs bg-amber-100 dark:bg-gray-700 p-1 rounded-full mb-6'>
          <button
            onClick={handlePageTab}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            {t('auth.logIn')}
          </button>
          <button
            onClick={handlePageTab}
            className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
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
        <div className='flex items-center w-full my-6'>
          <div className='flex-1 h-px bg-amber-200 dark:bg-gray-600'></div>
          <span className='px-4 text-sm text-gray-400'>{t('auth.or')}</span>
          <div className='flex-1 h-px bg-amber-200 dark:bg-gray-600'></div>
        </div>

        {/* Google button */}
        <button
          onClick={handleLoginWithGoogle}
          className='flex items-center justify-center gap-3 w-full py-3 px-4 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all'
        >
          <FaGoogle className='text-amber-500' />
          {t('auth.continueWithGoogle')}
        </button>
      </div>
    </div>
  );
}