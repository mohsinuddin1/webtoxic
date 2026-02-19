import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripePromise = null

export function getStripe() {
    if (!stripePromise && stripePublishableKey) {
        stripePromise = loadStripe(stripePublishableKey)
    }
    return stripePromise
}

/**
 * For a production app, you would create Stripe Checkout Sessions
 * via a backend (Supabase Edge Function). Here we use Stripe Payment Links
 * or client-side redirect as a starting point.
 *
 * To fully integrate:
 * 1. Create a Supabase Edge Function that creates a Stripe Checkout Session
 * 2. Call that function from the client
 * 3. Set up a webhook to update `is_pro` on successful payment
 */
export async function createCheckoutSession(priceId, userId, userEmail) {
    // In production, this should call your Supabase Edge Function:
    // const { data } = await supabase.functions.invoke('create-checkout', {
    //   body: { priceId, userId }
    // })
    // window.location.href = data.url

    // For now, use Stripe's client-side payment link approach
    const stripe = await getStripe()
    if (!stripe) {
        throw new Error('Stripe not configured')
    }

    // Redirect to Stripe Checkout
    // NOTE: In production, you need a backend to create the session.
    // For testing, we'll show the payment intent flow.
    const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/?payment=success`,
        cancelUrl: `${window.location.origin}/paywall?payment=cancelled`,
        customerEmail: userEmail,
        clientReferenceId: userId,
    })

    if (error) {
        throw error
    }
}
