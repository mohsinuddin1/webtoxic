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
        if (!STRIPE_SECRET_KEY) throw new Error('Missing Stripe Config — set STRIPE_SECRET_KEY in Edge Function secrets')

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: authHeader } }
        })

        // 2. Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        console.log(`✅ Creating checkout for user: ${user.id}`)

        // 3. Parse request
        const { priceId } = await req.json()
        if (!priceId) {
            return new Response(JSON.stringify({ error: 'priceId is required' }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        // 4. Get or create Stripe customer
        // First check if user already has a stripe_customer_id
        const { data: profile } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let stripeCustomerId = profile?.stripe_customer_id

        if (!stripeCustomerId) {
            // Create a new Stripe customer
            const customerRes = await fetch('https://api.stripe.com/v1/customers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'email': user.email || '',
                    'metadata[supabase_user_id]': user.id,
                    'name': user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                }),
            })

            if (!customerRes.ok) {
                const err = await customerRes.text()
                throw new Error(`Failed to create Stripe customer: ${err}`)
            }

            const customer = await customerRes.json()
            stripeCustomerId = customer.id

            // Save customer ID to our database (use service role to bypass RLS)
            const supabaseAdmin = createClient(
                SUPABASE_URL,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || SUPABASE_ANON_KEY,
            )
            await supabaseAdmin
                .from('users')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', user.id)

            console.log(`Created Stripe customer: ${stripeCustomerId}`)
        }

        // 5. Determine the origin for redirect URLs
        const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || 'http://localhost:5173'

        // 6. Create Checkout Session via Stripe REST API
        const params = new URLSearchParams({
            'customer': stripeCustomerId,
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            'mode': 'subscription',
            'success_url': `${origin}/?payment=success`,
            'cancel_url': `${origin}/paywall?payment=cancelled`,
            'client_reference_id': user.id,
            'allow_promotion_codes': 'true',
        })

        // Check if this price has a trial (only for annual plan)
        // We detect this by checking the price — if it has trial_period_days on the price,
        // Stripe will handle it automatically. Otherwise we can set it here.
        // For safety, we let the Paywall pass a `withTrial` flag.
        const body = await req.clone().json().catch(() => ({}))
        if (body.withTrial) {
            params.append('subscription_data[trial_period_days]', '3')
        }

        const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        })

        if (!sessionRes.ok) {
            const err = await sessionRes.text()
            throw new Error(`Failed to create checkout session: ${err}`)
        }

        const session = await sessionRes.json()
        console.log(`✅ Checkout session created: ${session.id}`)

        return new Response(
            JSON.stringify({ url: session.url, sessionId: session.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (error) {
        console.error('create-checkout error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})
