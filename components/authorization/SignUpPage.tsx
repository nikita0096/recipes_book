'use client';
import React from 'react';
import {SubmitHandler, UseFormHandleSubmit, UseFormRegister} from "react-hook-form";
import {ISignUpValues} from "@/app/[locale]/login/page";
import {useTranslations} from "next-intl";

interface SignUpPageProps {
  registerSignUp: UseFormRegister<ISignUpValues>
  handleSubmitSignUp: UseFormHandleSubmit<ISignUpValues>
  handleSignUpWithEmail: SubmitHandler<ISignUpValues>
}

const SignUpPage: React.FC<SignUpPageProps> = ({registerSignUp, handleSubmitSignUp, handleSignUpWithEmail}) => {
  const t = useTranslations('common');

  return (
    <div className='w-full'>
      <form className='flex flex-col w-full'
            onSubmit={handleSubmitSignUp(handleSignUpWithEmail)}>
        <label className='w-full mb-5'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.email')}
          </span>
          <input
            {...registerSignUp('emailSignUp')}
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
            {...registerSignUp('passwordSignUp')}
            className='w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
            type="password"
            placeholder={t('auth.createPassword')}
          />
        </label>
        <button
          type='submit'
          className='w-full py-3.5 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90'
        >
          {t('auth.signUp')}
        </button>
      </form>
    </div>
  );
};

export default SignUpPage;