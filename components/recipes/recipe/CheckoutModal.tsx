'use client';

import React, { useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';

// Load Stripe.js once at module scope, not on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
  // Stripe calls this to create the session and read back its client secret.
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/checkout_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeId }),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error ?? 'Checkout failed');
    }
    return data.clientSecret as string;
  }, [recipeId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center text-muted hover:text-text"
        >
          ✕
        </button>

        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ fetchClientSecret, onComplete }}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    </div>
  );
};

export default CheckoutModal;