'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance, StripeElementLocale } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

// Load Stripe.js once at module scope, not on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Theme tokens mirrored from globals.css so the Stripe form matches the app.
const ACCENT = { light: '#a67c52', dark: '#d4a574' };
const SURFACE = { light: '#f2f0ea', dark: '#131310' };
const TEXT = { light: '#1a1408', dark: '#fffaf3' };

function buildAppearance(isDark: boolean): Appearance {
  const mode = isDark ? 'dark' : 'light';
  return {
    // Stripe's built-in 'night' base handles dark mode reliably.
    theme: isDark ? 'night' : 'stripe',
    variables: {
      colorPrimary: ACCENT[mode],
      colorBackground: SURFACE[mode],
      colorText: TEXT[mode],
      colorDanger: '#ef4444',
      borderRadius: '0px',
      fontFamily: 'inherit',
    },
  };
}

interface CheckoutFormProps {
  onComplete: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onComplete }) => {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations('recipes.singlePage.checkout');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMsg(null);

    // redirect: 'if_required' keeps us inline for cards without 3DS; methods
    // that need a redirect (e.g. 3DS) use return_url.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message ?? t('payError'));
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onComplete();
      return;
    }

    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:p-6">
      <PaymentElement />

      {errorMsg && (
        <p className="text-sm text-red-500" role="alert">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full bg-accent text-bg font-medium text-sm tracking-wider uppercase py-3.5 px-6 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? t('processing') : t('pay')}
      </button>
    </form>
  );
};

interface CheckoutModalProps {
  recipeId: string;
  onClose: () => void;
  onComplete: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  recipeId,
  onClose,
  onComplete,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const t = useTranslations('recipes.singlePage.checkout');
  const { resolvedTheme } = useTheme();
  const appearance = useMemo(
    () => buildAppearance(resolvedTheme === 'dark'),
    [resolvedTheme]
  );

  // Stripe Elements has no Ukrainian locale, so the form is always shown in
  // English. Setting it explicitly stops Stripe from auto-picking the browser
  // language (which can render the form in Russian, etc.).
  const stripeLocale: StripeElementLocale = 'en';

  // Create the PaymentIntent on the server and read back its client secret.
  useEffect(() => {
    let active = true;
    fetch('/api/checkout_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.clientSecret) {
          throw new Error(data.error ?? t('startError'));
        }
        if (active) setClientSecret(data.clientSecret as string);
      })
      .catch((err: unknown) => {
        if (active) {
          setLoadError(err instanceof Error ? err.message : t('startError'));
        }
      });
    return () => {
      active = false;
    };
  }, [recipeId, t]);

  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-surface border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif italic text-lg text-text" style={{ fontFamily: 'var(--font-dm-serif), Georgia, serif' }}>{t('title')}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex size-7 items-center justify-center text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        {loadError ? (
          <p className="p-6 text-sm text-red-500" role="alert">
            {loadError}
          </p>
        ) : !clientSecret ? (
          <div className="p-10 text-center text-sm text-muted">{t('loading')}</div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance, locale: stripeLocale }}
          >
            <CheckoutForm onComplete={onComplete} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;