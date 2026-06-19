import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/AdminClient'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    // Verify the payload came from Stripe using the raw request body.
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid payload'
    console.error('[stripe webhook] signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  console.log('[stripe webhook] received event:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.userId
    const recipeId = session.metadata?.recipeId

    console.log('[stripe webhook] checkout completed:', {
      payment_status: session.payment_status,
      userId,
      recipeId,
    })

    if (session.payment_status !== 'paid' || !userId || !recipeId) {
      // Nothing to fulfill (e.g. unpaid session) — acknowledge so Stripe stops retrying.
      return NextResponse.json({ received: true })
    }

    const supabase = createAdminClient()

    // purchases links to the premium recipe row, so resolve it from the recipe.
    const { data: recipe } = await supabase
      .from('recipes')
      .select('premium_recipe')
      .eq('id', recipeId)
      .single<{ premium_recipe: string | null }>()

    // Stripe can deliver an event more than once — skip if already recorded.
    const { data: existing } = await supabase
      .from('purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('purchases').insert({
        user_id: userId,
        recipe_id: recipeId,
        premium_recipe_id: recipe?.premium_recipe ?? null,
        payment_status: session.payment_status, // 'paid'
        price: (session.amount_total ?? 0) / 100, // dollars actually charged
      })

      if (error) {
        // Return 500 so Stripe retries delivery instead of dropping the purchase.
        console.error('[stripe webhook] purchase insert failed:', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      console.log('[stripe webhook] purchase recorded for', { userId, recipeId })
    }
  }

  return NextResponse.json({ received: true })
}