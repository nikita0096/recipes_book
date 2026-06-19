'use client';

import React, {useState} from 'react';
import {IoClose, IoEye, IoEyeOff} from "react-icons/io5";
import {useTranslations} from "next-intl";
import {useRouter} from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import {SubmitHandler, useForm} from "react-hook-form";
import {handleUpdatePassword} from "@/lib/supabase/authClient";

interface UpdatePasswordValues {
  newPassword: string;
  confirmNewPassword: string;
}

const UpdatePasswordPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();

  const searchParams = useSearchParams();
  const pathname = searchParams.get('next') || '';

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
    watch
  } = useForm<UpdatePasswordValues>({
    defaultValues: {
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  const newPasswordValue = watch('newPassword');
  const confirmNewPasswordValue = watch('confirmNewPassword');

  // Password validation states
  const hasMinLength = newPasswordValue?.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPasswordValue || '');
  const hasLowerCase = /[a-z]/.test(newPasswordValue || '');
  const hasNumber = /[0-9]/.test(newPasswordValue || '');
  const passwordsMatch = newPasswordValue && confirmNewPasswordValue && newPasswordValue === confirmNewPasswordValue;

  const closeModal = () => {
    router.push(pathname || '/');
  }


  const handleUpdate: SubmitHandler<UpdatePasswordValues> = async (formData) => {
      if(!passwordsMatch) return;

      try {
        await handleUpdatePassword(formData.newPassword);

        closeModal();
      } catch (error) {
        setError(error instanceof Error ? error.message : t("auth.errors.invalidCredentials"));
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
            {t('auth.updatePasswordSubtitle')}
          </h1>
        </div>


        <div className='w-full'>
          <form className='flex flex-col w-full'
                onSubmit={handleSubmit(handleUpdate)}>
            <label className='w-full mb-3'>
              <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
                {t('auth.newPassword')}
              </span>
              <div className='relative'>
                <input
                  {...register('newPassword', {
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
                  placeholder={t('auth.createNewPassword')}
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors'
                >
                  {showPassword ? <IoEyeOff className='text-lg' /> : <IoEye className='text-lg' />}
                </button>
              </div>

              {/*New Password validation indicators */}
              {newPasswordValue && (
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

            <label className='w-full mb-8'>
              <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
                {t('auth.confirmNewPassword')}
              </span>
              <div className='relative'>
                <input
                  {...register('confirmNewPassword', {
                    required: t('auth.errors.confirmPasswordRequired'),
                    validate: {
                      matchesPassword: (value) => value === newPasswordValue || t('auth.errors.passwordMismatch')
                    }
                  })}
                  className='w-full px-3.5 py-2.5 pr-10 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.confirmNewPasswordPlaceholder')}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors'
                >
                  {showConfirmPassword ? <IoEyeOff className='text-lg' /> : <IoEye className='text-lg' />}
                </button>
              </div>
              {errors.confirmNewPassword && (
                <span className='block text-xs text-red-500 mt-1'>{errors.confirmNewPassword.message}</span>
              )}
            </label>

            {error && (
              <p className='text-center text-red-500 text-sm mb-2'>{error}</p>
            )}

            <button
              type='submit'
              className='w-full py-3.5 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90'
            >
              {t('auth.updatePassword')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;