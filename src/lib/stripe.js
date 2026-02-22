import { supabase } from './supabase'

/**
 * Create a Stripe Checkout Session via our secure Edge Function.
 * The secret key lives ONLY on the server — never exposed to the browser.
 */
export async function createCheckoutSession(priceId, userId, userEmail, withTrial = false) {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, withTrial }
    })

    if (error) {
        throw new Error(error.message || 'Failed to create checkout session')
    }

    if (!data?.url) {
        throw new Error('No checkout URL returned from server')
    }

    // Redirect to Stripe Checkout
    window.location.href = data.url
}
