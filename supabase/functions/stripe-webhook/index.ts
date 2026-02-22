import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

/**
 * Verify Stripe webhook signature using Web Crypto API (Deno-native, no SDK needed)
 */
async function verifyStripeSignature(
    payload: string,
    sigHeader: string,
    secret: string
): Promise<boolean> {
    const parts = sigHeader.split(',').reduce((acc: Record<string, string>, part: string) => {
        const [key, val] = part.split('=')
        acc[key.trim()] = val
        return acc
    }, {})

    const timestamp = parts['t']
    const signature = parts['v1']

    if (!timestamp || !signature) return false

    // Reject if timestamp is older than 5 minutes (replay protection)
    const now = Math.floor(Date.now() / 1000)
    if (now - parseInt(timestamp) > 300) {
        console.warn('Webhook timestamp too old — possible replay attack')
        return false
    }

    const signedPayload = `${timestamp}.${payload}`
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

    return expectedSig === signature
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing Supabase Config')
        if (!STRIPE_WEBHOOK_SECRET) throw new Error('Missing STRIPE_WEBHOOK_SECRET')
        if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')

        // Use service role — webhooks have no user JWT
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // 1. Verify webhook signature
        const body = await req.text()
        const sigHeader = req.headers.get('stripe-signature')

        if (!sigHeader) {
            return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const isValid = await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET)
        if (!isValid) {
            console.error('❌ Webhook signature verification failed')
            return new Response(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // 2. Parse event
        const event = JSON.parse(body)
        console.log(`✅ Webhook received: ${event.type}`)

        // 3. Handle events
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                const customerId = session.customer
                const userId = session.client_reference_id // We set this when creating the session
                const subscriptionId = session.subscription

                console.log(`Checkout completed — user: ${userId}, customer: ${customerId}, subscription: ${subscriptionId}`)

                if (userId) {
                    // Update user to pro
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({
                            is_pro: true,
                            stripe_customer_id: customerId,
                        })
                        .eq('id', userId)

                    if (updateError) {
                        console.error('Failed to update user to pro:', updateError)
                        throw updateError
                    }
                    console.log(`✅ User ${userId} upgraded to PRO`)
                } else {
                    // Fallback: find user by stripe_customer_id
                    console.log('No client_reference_id, looking up by customer ID...')
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ is_pro: true })
                        .eq('stripe_customer_id', customerId)

                    if (updateError) {
                        console.error('Failed to update user by customer ID:', updateError)
                    }
                }
                break
            }

            case 'customer.subscription.deleted':
            case 'customer.subscription.updated': {
                const subscription = event.data.object
                const customerId = subscription.customer
                const status = subscription.status

                console.log(`Subscription ${event.type} — customer: ${customerId}, status: ${status}`)

                // If subscription is cancelled, past_due, or unpaid → revoke pro
                const activeStatuses = ['active', 'trialing']
                const isPro = activeStatuses.includes(status)

                const { error: updateError } = await supabase
                    .from('users')
                    .update({ is_pro: isPro })
                    .eq('stripe_customer_id', customerId)

                if (updateError) {
                    console.error('Failed to update subscription status:', updateError)
                } else {
                    console.log(`✅ User with customer ${customerId} is_pro set to ${isPro}`)
                }
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                const customerId = invoice.customer
                console.warn(`⚠️ Payment failed for customer: ${customerId}`)
                // Optionally set is_pro = false after grace period
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return new Response(
            JSON.stringify({ received: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error('stripe-webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
