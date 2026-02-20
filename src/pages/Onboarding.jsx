import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../features/auth/AuthProvider'
import useStore from '../store/useStore'
import { Scan, Shield, TrendingUp, ChevronRight, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const slides = [
    {
        icon: Scan,
        headline: 'Scan Your Products',
        subtext: 'Take a photo or scan barcode to analyze ingredients instantly.',
        gradient: 'from-emerald-400 to-teal-500',
    },
    {
        icon: Shield,
        headline: "Understand What's Inside",
        subtext: 'Detect harmful chemicals, carcinogens, and hormone disruptors.',
        gradient: 'from-amber-400 to-orange-500',
    },
    {
        icon: TrendingUp,
        headline: 'Make Smarter Choices',
        subtext: 'Get health grades and track your scanning streak.',
        gradient: 'from-violet-400 to-purple-500',
    },
]

export default function Onboarding() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const { setOnboarded, hasSeenOnboarding } = useStore()
    const [showAuth, setShowAuth] = useState(hasSeenOnboarding)
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            setShowAuth(true)
        }
    }

    const handleGetStarted = () => {
        setShowAuth(true)
    }

    const handleGoogleSignIn = async () => {
        try {
            setError('')
            await signInWithGoogle()
            setOnboarded()
        } catch (err) {
            if (err.message?.includes('provider') || err.message?.includes('not enabled')) {
                setError('Google sign-in is not enabled yet. Please use Email sign-in below.')
            } else {
                setError(err.message)
            }
        }
    }

    const handleEmailAuth = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (isLogin) {
                await signInWithEmail(email, password)
                setOnboarded()
            } else {
                const data = await signUpWithEmail(email, password)
                if (data?.session) {
                    setOnboarded()
                } else if (data?.user) {
                    setError('Account created! Please check your email to verify.')
                }
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
    }

    if (showAuth) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-dvh flex flex-col px-6 py-10 bg-white"
            >
                {/* Brand */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="inline-flex items-center gap-2 mb-6"
                    >
                        <span className="text-3xl">☣️</span>
                        <h1 className="text-brand text-2xl tracking-[0.2em]">
                            PURE<span className="text-accent">SCAN</span>
                        </h1>
                        <span className="text-3xl">☣️</span>
                    </motion.div>
                    <motion.p
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-text-secondary text-base"
                    >
                        {isLogin ? 'Welcome back' : 'Create your account'}
                    </motion.p>
                </div>

                {/* Google Sign In */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-[var(--radius-button)] border border-border bg-white hover:bg-surface-elevated transition-colors text-[15px] font-medium"
                >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                </motion.button>

                {/* Divider */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-4 my-6"
                >
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-text-muted text-sm">or</span>
                    <div className="flex-1 h-px bg-border" />
                </motion.div>

                {/* Email Form */}
                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onSubmit={handleEmailAuth}
                    className="space-y-4"
                >
                    <div className="relative">
                        <Mail
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="w-full pl-12 pr-4 py-4 rounded-[var(--radius-button)] bg-surface-muted border-0 text-[15px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="relative">
                        <Lock
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                        />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            minLength={6}
                            className="w-full pl-12 pr-12 py-4 rounded-[var(--radius-button)] bg-surface-muted border-0 text-[15px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-danger text-sm text-center"
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] disabled:opacity-50 transition-opacity"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Processing...
                            </span>
                        ) : isLogin ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </motion.button>
                </motion.form>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center text-sm text-text-secondary mt-6"
                >
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError('')
                        }}
                        className="font-semibold text-primary underline underline-offset-2"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </motion.p>
            </motion.div>
        )
    }

    return (
        <div className="min-h-dvh flex flex-col bg-white overflow-hidden">
            {/* Skip button */}
            <div className="flex justify-end p-4">
                <button
                    onClick={handleGetStarted}
                    className="text-text-secondary text-sm font-medium px-3 py-1 rounded-full hover:bg-surface-muted transition-colors"
                >
                    Skip
                </button>
            </div>

            {/* Slides */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
                <AnimatePresence mode="wait" custom={1}>
                    <motion.div
                        key={currentSlide}
                        custom={1}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="flex flex-col items-center text-center w-full"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                            className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center mb-10 shadow-lg`}
                        >
                            {(() => {
                                const Icon = slides[currentSlide].icon
                                return <Icon size={48} className="text-white" strokeWidth={1.5} />
                            })()}
                        </motion.div>

                        {/* Text */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-display text-[28px] leading-tight mb-4"
                        >
                            {slides[currentSlide].headline}
                        </motion.h2>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-text-secondary text-base leading-relaxed max-w-[280px]"
                        >
                            {slides[currentSlide].subtext}
                        </motion.p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="px-8 pb-12">
                {/* Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {slides.map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                width: i === currentSlide ? 28 : 8,
                                backgroundColor: i === currentSlide ? '#0a0a0a' : '#d1d5db',
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="h-2 rounded-full"
                        />
                    ))}
                </div>

                {/* CTA */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="w-full py-4 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-[15px] flex items-center justify-center gap-2"
                >
                    {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
                    <ChevronRight size={18} />
                </motion.button>
            </div>
        </div>
    )
}
