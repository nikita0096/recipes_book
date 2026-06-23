'use client';

import {IoClose} from "react-icons/io5";
import {PAGES} from "@/config/page.config";
import {useSearchParams} from "next/navigation";
import {useRouter} from "@/i18n/navigation";
import {useTranslations} from "next-intl";
import React, {useEffect, useState} from "react";
import {handleResetPassword} from "@/lib/supabase/authClient";

const RESEND_DELAY_SECONDS = 60;

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState(false);
  const [error, setError] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const searchParams = useSearchParams();
  const pathname = searchParams.get('from') || '';

  const router = useRouter();

  const t = useTranslations('common');


  const closeModal = () => {
    router.back();
  }

  // Tick down the resend countdown once an email has been sent.
  useEffect(() => {
    if (!sentEmail) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [sentEmail]);

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isValid = isValidEmail(email);

  const sendResetEmail = async () => {
    setError("");

    try {
      await handleResetPassword(email, pathname);

      setSentEmail(true);
      setResendCountdown(RESEND_DELAY_SECONDS);
    } catch (error) {
      setError(error instanceof Error ? error.message : t("auth.errors.invalidEmailCredential"));
    }
  }

  const handleReset = async () => {
    if (!isValid) {
      setError(t("auth.errors.invalidEmail"));
      return;
    }

    await sendResetEmail();
  }

  const handleResend = async () => {
    if (resendCountdown > 0 || !isValid) return;

    await sendResetEmail();
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
          <IoClose className='text-xl'/>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className='text-md sm:text-xl text-text mb-2 uppercase' style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>
            {t('auth.resetPasswordSubtitle')}
          </h1>
        </div>

        {/*{Back button}*/}
        <button className='absolute top-4 left-4 text-muted hover:text-text text-lg'
                onClick={() => router.replace(PAGES.SIGNIN(pathname))}>←
        </button>

        <div className="flex flex-col items-start justify-center mb-8">
          <span className='block text-[11px] tracking-[0.08em] uppercase text-muted mb-2'>
            {t('auth.email')}
          </span>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='w-full px-3.5 py-2.5 pr-10 bg-bg border border-border text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
            type="email"
            placeholder={t('auth.emailPlaceholder')}
          />
        </div>

        {sentEmail ? (
          <>
            <div className='mb-4 p-4 bg-green-50 border border-green-200'>
              <p className='text-center text-green-800 text-sm font-medium mb-1'>
                {t('auth.checkYourEmail')}
              </p>
              <p className='text-center text-green-700 text-xs'>
                {t('auth.emailResetConfirmationSent')}
              </p>
            </div>

            <div className='text-center'>
              <p className='text-xs text-muted mb-1'>{t('auth.resendQuestion')}</p>
              <button
                type='button'
                disabled={resendCountdown > 0}
                onClick={handleResend}
                className='text-sm text-text underline hover:opacity-80 disabled:no-underline disabled:text-muted disabled:cursor-not-allowed transition-opacity'
              >
                {resendCountdown > 0
                  ? t('auth.resendIn', {seconds: resendCountdown})
                  : t('auth.resendEmail')}
              </button>
            </div>
          </>
        ) : (
          <>
            {error && (
              <p className='text-center text-red-500 text-sm mb-2'>{error}</p>
            )}

            <button
              type='button'
              className='w-full py-3.5 bg-text text-bg text-sm tracking-[0.08em] uppercase transition-opacity hover:opacity-90'
              onClick={handleReset}
            >
              {t('auth.resetPassword')}
            </button>
          </>
        )}



      </div>
    </div>
  );
};

export default ResetPasswordPage;