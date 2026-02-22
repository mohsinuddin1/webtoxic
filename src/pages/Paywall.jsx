import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, Check, Shield, Zap, Infinity, Crown, Loader2, CheckCircle } from 'lucide-react'
import { createCheckoutSession } from '../lib/stripe'
import useStore from '../store/useStore'

const PLANS = [
    {
        id: 'annual',
        stripePriceId: '', // TODO: Create price in Stripe Dashboard and add ID here
        name: 'Annual',
        period: '1 year',
        price: '₹5,200.00',
        perWeek: '₹99.73/wk',
        trial: '3 days free trial',
        discount: '78% OFF',
        recommended: true,
    },
    {
        id: 'weekly',
        stripePriceId: '', // TODO: Create price in Stripe Dashboard and add ID here
        name: 'Weekly',
        period: '1 week',
        price: '₹460.00',
        perWeek: '₹460.00/wk',
        trial: null,
        discount: null,
        recommended: false,
    },
]

const FEATURES = [
    { icon: Infinity, text: 'Unlimited daily scans' },
    { icon: Zap, text: 'Priority AI analysis' },
    { icon: Shield, text: 'Detailed chemical reports' },
    { icon: Crown, text: 'Ad-free experience' },
]

export default function Paywall() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [selectedPlan, setSelectedPlan] = useState('annual')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, profile, fetchProfile } = useStore()

    // Handle payment success — refresh profile to pick up is_pro = true
    useEffect(() => {
        if (searchParams.get('payment') === 'success' && user?.id) {
            // Poll profile until is_pro flips (webhook may take a moment)
            let attempts = 0
            const poll = setInterval(async () => {
                attempts++
                const updatedProfile = await fetchProfile(user.id)
                if (updatedProfile?.is_pro) {
                    clearInterval(poll)
                    navigate('/', { replace: true })
                }
                if (attempts >= 10) clearInterval(poll) // stop after ~10s
            }, 1000)
            return () => clearInterval(poll)
        }
        if (searchParams.get('payment') === 'cancelled') {
            setError('Payment was cancelled. You can try again.')
        }
    }, [searchParams, user])

    const handleSubscribe = async () => {
        setError('')
        setLoading(true)

        const plan = PLANS.find((p) => p.id === selectedPlan)
        if (!plan?.stripePriceId) {
            // If no Stripe Price ID configured yet, show helpful message
            setError(
                'Stripe Price IDs not configured yet. Create products in Stripe Dashboard first, then add the price IDs to the PLANS array in Paywall.jsx.'
            )
            setLoading(false)
            return
        }

        try {
            await createCheckoutSession(
                plan.stripePriceId,
                user?.id,
                user?.email,
                plan.trial ? true : false // Annual plan gets 3-day trial
            )
        } catch (err) {
            setError(err.message || 'Failed to start checkout')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="min-h-dvh bg-white flex flex-col"
        >
            {/* Payment success state */}
            {searchParams.get('payment') === 'success' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-8"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                    >
                        <CheckCircle size={40} className="text-green-600" />
                    </motion.div>
                    <h2 className="text-display text-2xl mb-2">Welcome to Pro! 🎉</h2>
                    <p className="text-text-secondary text-sm text-center">Activating your unlimited scans...</p>
                    <div className="mt-6 w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                </motion.div>
            )}

            {/* Close button */}
            <div className="flex justify-end p-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full bg-surface-muted flex items-center justify-center"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Hero Content */}
            <div className="text-center px-6 mb-6">
                <div className="inline-flex items-center gap-1.5 mb-4">
                    <span className="text-xl">☣️</span>
                    <span className="text-brand text-base tracking-[0.15em]">
                        PURE<span className="text-accent">SCAN</span>
                    </span>
                    <span className="text-xl">☣️</span>
                </div>
                <h1 className="text-display text-[28px] leading-tight mb-2">
                    Scan. Be Safe.
                </h1>
                <p className="text-text-secondary text-[15px]">
                    Protect your health from harmful ingredients
                </p>
            </div>

            {/* Preview Image Area */}
            <div className="px-6 mb-6">
                <div className="relative bg-gradient-to-br from-surface-muted to-surface-elevated rounded-[1.5rem] p-6 overflow-hidden">
                    {/* Floating bubbles */}
                    {['Dymethicone', 'BPA', 'PEG-100 Stearate', 'Propylparaben'].map(
                        (name, i) => {
                            const positions = [
                                'top-3 left-3',
                                'top-3 right-3',
                                'bottom-10 left-4',
                                'bottom-6 right-4',
                            ]
                            return (
                                <motion.span
                                    key={name}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        delay: 0.3 + i * 0.12,
                                        type: 'spring',
                                        stiffness: 200,
                                    }}
                                    className={`absolute ${positions[i]} px-3 py-1.5 bg-white/90 rounded-full text-xs font-medium shadow-sm`}
                                >
                                    {name}
                                </motion.span>
                            )
                        }
                    )}

                    {/* Toxicity meter card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-20 bg-accent-light rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-sm">Toxicity Meter</h4>
                            <span className="font-bold text-sm">3/5</span>
                        </div>
                        <p className="text-text-secondary text-xs">
                            Several ingredients have toxicity concerns, primarily related to
                            potential skin irritation and endocrine disruption.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Features */}
            <div className="px-6 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    {FEATURES.map((feature, i) => {
                        const Icon = feature.icon
                        return (
                            <motion.div
                                key={feature.text}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + i * 0.08 }}
                                className="flex items-center gap-2 text-sm"
                            >
                                <Icon size={16} className="text-accent flex-shrink-0" />
                                <span className="text-text-secondary text-xs">
                                    {feature.text}
                                </span>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Plans */}
            <div className="px-6 space-y-3 mb-6 flex-1">
                {PLANS.map((plan) => (
                    <motion.button
                        key={plan.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`w-full p-4 rounded-[var(--radius-card)] border-2 text-left relative transition-all ${selectedPlan === plan.id
                            ? 'border-primary bg-white shadow-elevated'
                            : 'border-border bg-surface-elevated'
                            }`}
                    >
                        {plan.discount && (
                            <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">
                                {plan.discount}
                            </span>
                        )}
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedPlan === plan.id
                                    ? 'border-primary bg-primary'
                                    : 'border-text-muted'
                                    }`}
                            >
                                {selectedPlan === plan.id && (
                                    <Check size={12} className="text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{plan.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-text-secondary text-xs mt-0.5">
                                    <span>
                                        {plan.period} • {plan.price}
                                    </span>
                                </div>
                                {plan.trial && (
                                    <p className="text-accent text-xs font-medium mt-0.5">
                                        {plan.trial}
                                    </p>
                                )}
                            </div>
                            <span className="font-bold text-sm">{plan.perWeek}</span>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-danger text-xs px-6 mb-3"
                >
                    {error}
                </motion.p>
            )}

            {/* CTA */}
            <div className="px-6 pb-8">
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Start For Free'
                    )}
                </motion.button>
                <button className="w-full text-center text-text-muted text-sm mt-3 underline underline-offset-2">
                    Restore purchases
                </button>
            </div>
        </motion.div>
    )
}
