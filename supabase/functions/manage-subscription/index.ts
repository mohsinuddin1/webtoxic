import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validate auth
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
        const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
        const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Missing Supabase Config')
        if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // 2. Parse action
        const { action } = await req.json()

        // 3. Get user's stripe_customer_id
        const { data: profile } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!profile?.stripe_customer_id) {
            return new Response(JSON.stringify({
                error: 'No subscription found',
                subscription: null
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const customerId = profile.stripe_customer_id

        // ── ACTION: get-info ──
        // Returns subscription details (plan, status, renewal date, cancel date)
        if (action === 'get-info') {
            // List active subscriptions for this customer
            const subsRes = await fetch(
                `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=all&limit=1`,
                {
                    headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
                }
            )

            if (!subsRes.ok) {
                throw new Error(`Stripe API error: ${await subsRes.text()}`)
            }

            const subsData = await subsRes.json()
            const subscription = subsData.data?.[0]

            if (!subscription) {
                return new Response(JSON.stringify({ subscription: null }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                })
            }

            // Extract plan details
            const plan = subscription.items?.data?.[0]?.plan || subscription.items?.data?.[0]?.price
            const interval = plan?.interval || 'unknown' // 'week', 'month', 'year'
            const amount = plan?.amount ? (plan.amount / 100) : 0
            const currency = plan?.currency || 'inr'

            const result = {
                subscription: {
                    id: subscription.id,
                    status: subscription.status, // active, trialing, past_due, canceled, unpaid
                    currentPeriodStart: subscription.current_period_start,
                    currentPeriodEnd: subscription.current_period_end, // renewal/expiry date
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    cancelAt: subscription.cancel_at,
                    canceledAt: subscription.canceled_at,
                    trialStart: subscription.trial_start,
                    trialEnd: subscription.trial_end,
                    plan: {
                        interval,
                        amount,
                        currency,
                        name: interval === 'year' ? 'Annual' : interval === 'week' ? 'Weekly' : 'Monthly',
                    }
                }
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // ── ACTION: create-portal ──
        // Creates a Stripe Customer Portal session for managing/canceling subscription
        if (action === 'create-portal') {
            const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'http://localhost:5173'

            const portalRes = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'customer': customerId,
                    'return_url': `${origin}/settings`,
                }),
            })

            if (!portalRes.ok) {
                const err = await portalRes.text()
                throw new Error(`Failed to create portal session: ${err}`)
            }

            const portal = await portalRes.json()

            return new Response(JSON.stringify({ url: portal.url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid action. Use "get-info" or "create-portal".' }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })

    } catch (error) {
        console.error('manage-subscription error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
