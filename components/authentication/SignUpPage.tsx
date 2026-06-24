'use client';

import {SubmitHandler, useForm} from "react-hook-form";
import {handleEmailLogin, handleGoogleLogin, handleSignUp} from "@/lib/supabase/authClient";
import {UserState, useUserStore} from "@/store/useUserStore";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import {IoClose, IoEye, IoEyeOff} from "react-icons/io5";
import React from "react";
import {PAGES} from "@/config/page.config";
import {useSearchParams} from "next/navigation";

export interface ISignUpValues {
  emailSignUp: string;
  passwordSignUp: string;
  confirmPassword: string;
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

export default function SignUpPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const t = useTranslations('common');
  const router = useRouter();

  const closeModal = () => {
    router.back();
  };

  const signUpForm = useForm<ISignUpValues>({
    defaultValues: {
      emailSignUp: '',
      passwordSignUp: '',
      confirmPassword: ''
    }
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    reset: resetSignUp,
    formState: { errors },
    watch
  } = signUpForm;

  const passwordValue = watch('passwordSignUp');
  const confirmPasswordValue = watch('confirmPassword');

  // Password validation states
  const hasMinLength = passwordValue?.length >= 8;
  const hasUpperCase = /[A-Z]/.test(passwordValue || '');
  const hasLowerCase = /[a-z]/.test(passwordValue || '');
  const hasNumber = /[0-9]/.test(passwordValue || '');
  const passwordsMatch = passwordValue && confirmPasswordValue && passwordValue === confirmPasswordValue;

  const searchParams = useSearchParams();
  const pathname = searchParams.get('from') || '/';

  const handleSignUpWithEmail: SubmitHandler<ISignUpValues> = async (formData) => {
    setError(null);
    setEmailSent(false);

    // Check password requirements
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !passwordsMatch) {
      setError(t('auth.errors.passwordRequirementsNotMet'));
      return;
    }

    try {
      const data = await handleSignUp(formData.emailSignUp, formData.passwordSignUp, pathname);

      if(data.user) {
        if(data.user?.identities && data.user?.identities.length === 0) {
          setError(t('auth.errors.userExists'));
        } else {
          setEmailSent(true);
        }
      }

    } catch (error) {
      if(error instanceof Error) {
        setError(error.message);
      } else {
        setError(t('errors.somethingWentWrong'));
      }
    } finally {
      resetSignUp();
    }
  }

  const handleLoginWithGoogle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = origin + pathname;
    try {
      await handleGoogleLogin(redirectUrl);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
    onClick={closeModal}>
      <div className='relative w-11/12 max-w-md bg-surface border border-border p-8 sm:p-10'
      onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button
          className='absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-muted hover:text-text transition-colors'
          onClick={closeModal}
        >
          <IoClose className='text-xl' />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className='text-md sm:text-xl text-text mb-2 uppercase' style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
            {t('auth.signupSubtitle')}
          </h1>
        </div>

        {/* Tabs */}
        <div className='flex items-center w-full border border-border mb-5'>
          <button
            onClick={() => router.replace(PAGES.SIGNIN(pathname))}
            className={`flex-1 py-3 text-sm tracking-wide transition-colors bg-transparent text-muted hover:text-text cursor-pointer`}
          >
            {t('auth.signIn')}
          </button>
          <button
            className={`flex-1 py-3 text-sm tracking-wide transition-colors bg-text text-bg cursor-pointer`}
          >
            {t('auth.signUp')}
          </button>
        </div>


        <div className='w-full'>
          <form className='flex flex-col w-full'
                onSubmit={handleSubmitSignUp(handleSignUpWithEmail)}>
            <label className='w-full mb-3'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.email')}
          </span>
              <input
                {...registerSignUp('emailSignUp', {
                  required: t('auth.errors.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.errors.invalidEmail')
                  }
                })}
                className='w-full px-3.5 py-2.5 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                type="email"
                placeholder={t('auth.emailPlaceholder')}
              />
              {errors.emailSignUp && (
                <span className='block text-xs text-red-500 mt-1'>{errors.emailSignUp.message}</span>
              )}
            </label>
            <label className='w-full mb-3'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.password')}
          </span>
              <div className='relative'>
                <input
                  {...registerSignUp('passwordSignUp', {
                    required: t('auth.errors.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('auth.errors.passwordMinLength')
                    },
                    validate: {
                      hasUpperCase: (value) => /[A-Z]/.test(value) || t('auth.errors.passwordUpperCase'),
                      hasLowerCase: (value) => /[a-z]/.test(value) || t('auth.errors.passwordLowerCase'),
                      hasNumber: (value) => /[0-9]/.test(value) || t('auth.errors.passwordNumber'),
                    }
                  })}
                  className='w-full px-3.5 py-2.5 pr-10 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.createPassword')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors'
                >
                  {showPassword ? <IoEyeOff className='text-lg' /> : <IoEye className='text-lg' />}
                </button>
              </div>

              {/* Password validation indicators */}
              {passwordValue && (
                <div className='mt-2'>
                  <p className='text-xs text-muted mb-1'>{t('auth.passwordRequirements')}</p>
                  <div className='flex flex-col gap-1'>
                    <span className={`text-xs flex items-center gap-1 ${hasMinLength ? 'text-green-600' : 'text-red-500'}`}>
                      {hasMinLength ? '✓' : '✗'} {t('auth.errors.passwordMinLength')}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${hasUpperCase ? 'text-green-600' : 'text-red-500'}`}>
                      {hasUpperCase ? '✓' : '✗'} {t('auth.errors.passwordUpperCase')}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${hasLowerCase ? 'text-green-600' : 'text-red-500'}`}>
                      {hasLowerCase ? '✓' : '✗'} {t('auth.errors.passwordLowerCase')}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                      {hasNumber ? '✓' : '✗'} {t('auth.errors.passwordNumber')}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                      {passwordsMatch ? '✓' : '✗'} {t('auth.errors.passwordsMatchIndicator')}
                    </span>
                  </div>
                </div>
              )}
            </label>

            <label className='w-full mb-6'>
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.confirmPassword')}
          </span>
              <div className='relative'>
                <input
                  {...registerSignUp('confirmPassword', {
                    required: t('auth.errors.confirmPasswordRequired'),
                    validate: {
                      matchesPassword: (value) => value === passwordValue || t('auth.errors.passwordMismatch')
                    }
                  })}
                  className='w-full px-3.5 py-2.5 pr-10 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors'
                >
                  {showConfirmPassword ? <IoEyeOff className='text-lg' /> : <IoEye className='text-lg' />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className='block text-xs text-red-500 mt-1'>{errors.confirmPassword.message}</span>
              )}
            </label>

            {emailSent ? (
              <div className='mb-4 p-4 bg-green-50 border border-green-200'>
                <p className='text-center text-green-800 text-sm font-medium mb-1'>
                  {t('auth.checkYourEmail')}
                </p>
                <p className='text-center text-green-700 text-xs'>
                  {t('auth.emailConfirmationSent')}
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <p className='text-center text-red-500 text-sm mb-2'>{error}</p>
                )}

                <button
                  type='submit'
                  className='w-full py-3.5 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90'
                >
                  {t('auth.signUp')}
                </button>
              </>
            )}
          </form>
        </div>

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
  )
}