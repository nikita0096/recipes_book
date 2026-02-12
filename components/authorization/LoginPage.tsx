'use client';

import React from 'react';
import {SubmitHandler, UseFormHandleSubmit, UseFormRegister} from "react-hook-form";
import {useTranslations} from "next-intl";

interface ILoginFormFields {
  emailLogin: string;
  passwordLogin: string;
}

interface LoginPageProps {
  registerLogin: UseFormRegister<ILoginFormFields>;
  handleSubmitLogin: UseFormHandleSubmit<ILoginFormFields>
  handleLoginWithEmail: SubmitHandler<ILoginFormFields>
}

const LoginPage: React.FC<LoginPageProps> = ({registerLogin, handleSubmitLogin, handleLoginWithEmail}) => {
  const t = useTranslations('common');

  return (
    <div className='w-full'>
      <form className='flex flex-col items-center w-full'
            onSubmit={handleSubmitLogin(handleLoginWithEmail)}>
        <label className='w-full mb-4'>
          <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t('auth.email')}</span>
          <input
            {...registerLogin('emailLogin')}
            className='w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors'
            type="email"
            placeholder={t('auth.emailPlaceholder')}
          />
        </label>
        <label className='w-full mb-6'>
          <span className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>{t('auth.password')}</span>
          <input
            {...registerLogin('passwordLogin')}
            className='w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-amber-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors'
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
          />
        </label>
        <button
          type='submit'
          className='w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg'
        >
          {t('auth.logIn')}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;