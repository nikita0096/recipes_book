import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/ServerComponentClient'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()

  try {
    // Trust the session, not the client: derive the buyer from the auth cookie.
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recipeId } = await req.json()
    if (!recipeId) {
      return NextResponse.json({ error: 'Missing recipeId' }, { status: 400 })
    }

    // Make sure the recipe is actually premium and grab its title for the line item.
    const { data: recipe } = await supabase
      .from('recipes')
      .select('title, is_premium')
      .eq('id', recipeId)
      .single<{ title: { en: string; ua: string }; is_premium: boolean }>()

    if (!recipe || !recipe.is_premium) {
      return NextResponse.json({ error: 'Recipe is not purchasable' }, { status: 400 })
    }

    // Price is computed on the server from the DB — never trust an amount from the client.
    const { data: priceRow } = await supabase
      .from('recipes_price')
      .select('price, discount')
      .eq('recipe_id', recipeId)
      .maybeSingle<{ price: { en: number; ua: number }; discount: number | null }>()

    const basePrice = priceRow?.price.en ?? 0
    const discount = priceRow?.discount ?? 0
    const finalPrice = basePrice * (1 - discount / 100)
    const unitAmount = Math.round(finalPrice * 100) // cents

    if (unitAmount <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: { name: recipe.title.en },
          },
        },
      ],
      metadata: { userId: user.id, recipeId },
      redirect_on_completion: 'never',
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}