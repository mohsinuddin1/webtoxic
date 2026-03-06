import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../features/auth/AuthProvider'
import useStore from '../store/useStore'
import { ChevronRight, Mail, Lock, Eye, EyeOff, CheckCircle2, Plus, FlaskConical, ShieldCheck } from 'lucide-react'

// --- Pre-defined Options ---
const DISEASES = [
    'PCOS', 'Infertility', 'Early Puberty', 'Breast Cancer',
    'Birth Defects', 'Thyroid Issues', 'Eczema / Psoriasis', 'Hormonal Acne'
]

const ALLERGENS = [
    'Endocrine Disruptors', 'Cancer-Causing Chemicals', 'Microplastics', 'Parabens',
    'Sulfates', 'Lead & Heavy Metals', 'Fragrance', 'Essential Oils', 'Silicone'
]

const HEALTH_OPTIONS = [
    { id: 'skin', label: 'Skin Health', emoji: '✨' },
    { id: 'hormonal', label: 'Hormonal Balance', emoji: '⚖️' },
    { id: 'cancer', label: 'Cancer Prevention', emoji: '🛡️' },
    { id: 'baby', label: 'Baby Safety', emoji: '👶' },
    { id: 'eco', label: 'Eco-Friendly', emoji: '🌿' },
]

const AUTHORITIES = [
    { name: 'FDA', full: 'U.S. Food & Drug Administration', emoji: '🇺🇸' },
    { name: 'EWG', full: 'Environmental Working Group', emoji: '🔬' },
    { name: 'ECHA', full: 'European Chemicals Agency', emoji: '🇪🇺' },
    { name: 'EFSA', full: 'European Food Safety Authority', emoji: '🏛️' },
    { name: 'IARC', full: 'Intl. Agency for Research on Cancer', emoji: '🏥' },
]

const CHEMICALS = [
    { name: 'BPA (Bisphenol A)', risk: 'Endocrine Disruptor', found: 'Plastics', disease: 'Hormonal imbalance, PCOS', color: '#ef4444' },
    { name: 'Parabens', risk: 'Carcinogen', found: 'Shampoos, makeup', disease: 'Breast cancer', color: '#dc2626' },
    { name: 'Phthalates', risk: 'Reproductive Toxin', found: 'Perfumes', disease: 'Reproductive harm', color: '#f97316' },
    { name: 'SLS', risk: 'Irritant', found: 'Toothpaste, body wash', disease: 'Eczema flares', color: '#eab308' },
]

// --- Small Reusable UI ---
function SelectablePill({ label, isSelected, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${isSelected
                    ? 'bg-accent/10 border-accent'
                    : 'bg-surface-elevated border-transparent'
                }`}
        >
            <span className={`text-[14px] font-semibold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>
                {label}
            </span>
            {isSelected && <CheckCircle2 size={16} className="text-accent" />}
        </button>
    )
}

function CustomInputPill({ placeholder, onAdd }) {
    const [val, setVal] = useState('')

    const handleSubmit = (e) => {
        if (e.key === 'Enter' && val.trim()) {
            onAdd(val.trim())
            setVal('')
        }
    }

    return (
        <div className="flex items-center px-3 py-2 rounded-full bg-surface-elevated border border-border border-dashed">
            <Plus size={16} className="text-success mr-1" />
            <input
                type="text"
                placeholder={placeholder}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={handleSubmit}
                className="bg-transparent border-none text-[14px] text-primary placeholder:text-success focus:outline-none min-w-[100px]"
            />
        </div>
    )
}

function PulsingDot({ color = '#ef4444', delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: delay
            }}
            style={{ backgroundColor: color }}
            className="w-2 h-2 rounded-full"
        />
    )
}

// --- Slides Components ---
function Slide1() {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-full mb-6 rounded-[24px] overflow-hidden shadow-lg relative">
                <div className="bg-gradient-to-br from-[#1a0000] via-[#3d0000] to-[#0a0a0a] py-10 px-6 flex flex-col items-center">
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-7xl font-black text-red-500 tracking-tighter leading-none mb-2">67%</motion.p>
                    <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm text-white/70 leading-snug">of everyday products contain<br />chemicals linked to disease</motion.p>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="absolute top-5 left-5 flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-md">
                        <PulsingDot color="#ef4444" />
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">Carcinogens</span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute top-5 right-5 flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-md">
                        <PulsingDot color="#f97316" delay={0.2} />
                        <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide">Toxins</span>
                    </motion.div>
                </div>
            </motion.div>
            <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-3">
                Personalized Toxicity<br />Risk Assessment
            </motion.h2>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="text-[15px] text-text-secondary leading-snug max-w-sm">
                Your body absorbs 60% of what touches your skin. Every product you use could be silently harming you.
            </motion.p>
        </div>
    )
}

function SlideDisease({ selections, onToggle, onAddCustom }) {
    const isNone = selections.includes('None')
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                Do you have any<br />specific health concerns?
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                This helps us tailor our AI risk model to your exact profile.
            </motion.p>
            <div className="flex flex-wrap gap-2.5 justify-center">
                {DISEASES.map(d => (
                    <SelectablePill key={d} label={d} isSelected={selections.includes(d)} onClick={() => onToggle(d)} />
                ))}
                {selections.filter(s => !DISEASES.includes(s) && s !== 'None').map(custom => (
                    <SelectablePill key={custom} label={custom} isSelected={true} onClick={() => onToggle(custom)} />
                ))}
                <CustomInputPill placeholder="Type issue..." onAdd={onAddCustom} />
            </div>
            <div className="mt-5">
                <SelectablePill label="None of the above" isSelected={isNone} onClick={() => onToggle('None', true)} />
            </div>
        </div>
    )
}

function SlideAllergy({ selections, onToggle, onAddCustom }) {
    const isNone = selections.includes('None')
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                Are you avoiding<br />any specific allergies?
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                We'll highlight these in red immediately when you scan.
            </motion.p>
            <div className="flex flex-wrap gap-2.5 justify-center">
                {ALLERGENS.map(a => (
                    <SelectablePill key={a} label={a} isSelected={selections.includes(a)} onClick={() => onToggle(a)} />
                ))}
                {selections.filter(s => !ALLERGENS.includes(s) && s !== 'None').map(custom => (
                    <SelectablePill key={custom} label={custom} isSelected={true} onClick={() => onToggle(custom)} />
                ))}
                <CustomInputPill placeholder="Type allergy..." onAdd={onAddCustom} />
            </div>
            <div className="mt-5">
                <SelectablePill label="None" isSelected={isNone} onClick={() => onToggle('None', true)} />
            </div>
        </div>
    )
}

function SlideGoals({ selectedPrefs, onTogglePref, onAddCustom }) {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                What Matters<br />Most To You?
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                We'll personalize your scan results based on your goals.
            </motion.p>
            <div className="flex flex-wrap gap-2.5 justify-center">
                {HEALTH_OPTIONS.map((opt, i) => {
                    const isSelected = selectedPrefs.includes(opt.id);
                    return (
                        <motion.button
                            key={opt.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.08 }}
                            onClick={() => onTogglePref(opt.id)}
                            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 transition-all duration-200 ${isSelected ? 'bg-accent/10 border-accent' : 'bg-surface-muted border-transparent'
                                }`}
                        >
                            <span className="text-[16px]">{opt.emoji}</span>
                            <span className={`text-[13px] font-semibold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>{opt.label}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-accent" />}
                        </motion.button>
                    )
                })}
                {selectedPrefs.filter(s => !HEALTH_OPTIONS.map(h => h.id).includes(s) && s !== 'None').map(custom => (
                    <motion.button
                        key={custom}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onTogglePref(custom)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 bg-accent/10 border-accent transition-all duration-200"
                    >
                        <span className="text-[16px]">🎯</span>
                        <span className="text-[13px] font-semibold text-primary">{custom}</span>
                        <CheckCircle2 size={16} className="text-accent" />
                    </motion.button>
                ))}
            </div>
            <div className="mt-3">
                <CustomInputPill placeholder="Add custom goal..." onAdd={onAddCustom} />
            </div>
        </div>
    )
}

function SlideCommitment({ selection, onSelect }) {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                Ready to Detox<br />Your Home?
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                How many products do you want to scan this week to start?
            </motion.p>
            <div className="w-full space-y-3">
                {['1-5 Products', '5-10 Products', '10+ Products'].map((opt, i) => (
                    <motion.button
                        key={opt}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                        onClick={() => onSelect(opt)}
                        className={`w-full flex items-center p-4 rounded-[16px] border ${selection === opt ? 'bg-accent/10 border-accent' : 'bg-surface-elevated border-border-light'
                            } transition-colors text-left`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selection === opt ? 'border-accent' : 'border-border'
                            }`}>
                            {selection === opt && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                        </div>
                        <span className="font-extrabold text-[15px] text-primary flex-1">{opt}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

function ScanningAnimation() {
    return (
        <div className="flex items-center justify-center mb-5 w-full">
            <div className="relative w-[140px] h-[140px] bg-white rounded-[20px] border-[3px] border-slate-800 flex items-center justify-center overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                <FlaskConical size={64} className="text-slate-400 opacity-60" />
                <div className="absolute inset-0 bg-red-500/5" />

                <motion.div
                    animate={{ y: [-70, 70] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                    className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_2px_#ef4444]"
                />

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }} className="absolute top-5 right-2 bg-red-500 px-1.5 py-0.5 rounded shadow-sm">
                    <span className="text-[9px] font-black text-white">Toxins!</span>
                </motion.div>

                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6, type: 'spring' }} className="absolute bottom-6 left-2 bg-orange-500 px-1.5 py-0.5 rounded shadow-sm">
                    <span className="text-[9px] font-black text-white">Parabens</span>
                </motion.div>
            </div>
        </div>
    )
}

function SlideMockScan() {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                See The Hidden<br />Toxins Inside
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                A quick scan reveals what brands try to hide from you.
            </motion.p>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring' }} className="w-full rounded-[24px] overflow-hidden shadow-lg border border-red-100">
                <div className="bg-gradient-to-br from-red-50 to-red-100/50 py-8 px-6 flex flex-col items-center">
                    <ScanningAnimation />
                    <div className="bg-red-500 px-4 py-1.5 rounded-full mb-3">
                        <span className="text-[13px] font-black text-white">Toxicity Level: HIGH</span>
                    </div>
                    <h3 className="text-[18px] font-black text-primary mb-1">Generic Baby Wash</h3>
                    <p className="text-[13px] font-bold text-red-500">Contains 3 Endocrine Disruptors</p>
                </div>
            </motion.div>
        </div>
    )
}

function SlideChemicals() {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-5">
                Hidden Chemicals<br />Causing Real Harm
            </motion.h2>
            <div className="w-full space-y-2.5">
                {CHEMICALS.map((chem, i) => (
                    <motion.div
                        key={chem.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.12, type: 'spring' }}
                        className="flex items-start gap-3 bg-white p-3.5 rounded-[16px] border border-border-light shadow-sm text-left"
                    >
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: chem.color }} />
                        <div className="flex-1">
                            <h4 className="font-extrabold text-[14px] text-primary">{chem.name}</h4>
                            <p className="font-bold text-[11px] mb-1 leading-none" style={{ color: chem.color }}>{chem.risk}</p>
                            <p className="text-[11px] text-text-secondary leading-snug">Found in: {chem.found}</p>
                            <p className="text-[11px] text-text-muted italic leading-snug">→ {chem.disease}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="text-[13px] text-text-secondary leading-snug max-w-sm mt-5">
                Scan before it's too late. Every scan could save you from years of damage.
            </motion.p>
        </div>
    )
}

function SlideScience() {
    return (
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center text-center">
            <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[28px] font-extrabold text-primary leading-tight tracking-tight mb-2">
                Backed By<br />Global Science
            </motion.h2>
            <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary leading-snug max-w-sm mb-6">
                Our AI cross-references data from the world's leading health authorities.
            </motion.p>
            <div className="w-full space-y-2">
                {AUTHORITIES.map((auth, i) => (
                    <motion.div
                        key={auth.name}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.12, type: 'spring' }}
                        className="flex items-center gap-3 bg-white p-3.5 rounded-[16px] border border-border-light shadow-sm text-left"
                    >
                        <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center text-[22px]">
                            {auth.emoji}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-extrabold text-[14px] text-primary leading-tight">{auth.name}</h4>
                            <p className="text-[12px] text-text-secondary leading-tight">{auth.full}</p>
                        </div>
                        <ShieldCheck size={18} className="text-success" />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

// --- Auth Component ---
function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
    const { setOnboarded } = useStore() // Instead of navigating to paywall in this isolated web version immediately, just setOnboarded so they enter the main app

    const handleGoogleSignIn = async () => {
        try {
            setError('')
            await signInWithGoogle()
            setOnboarded()
        } catch (err) {
            setError(err.message?.includes('provider') ? 'Google sign-in is not enabled yet.' : err.message)
        }
    }

    const handleEmailAuth = async (e) => {
        e.preventDefault()
        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
            setError('Please enter both email and password.')
            return
        }

        setError('')
        setLoading(true)

        try {
            if (isLogin) {
                const data = await signInWithEmail(trimmedEmail, password)
                if (data?.session || data?.user) {
                    setOnboarded()
                }
            } else {
                const data = await signUpWithEmail(trimmedEmail, password)
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

    return (
        <div className="min-h-dvh flex flex-col px-6 py-10 bg-white">
            <div className="text-center mb-10 pt-10">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }} className="flex items-center justify-center gap-2 mb-4">
                    <img src="/vite.svg" alt="logo" className="w-12 h-12 opacity-0" />
                    <span className="text-3xl">☣️</span>
                    <h1 className="text-[28px] font-black text-primary tracking-tighter">PureScan <span className="text-accent">AI</span></h1>
                </motion.div>
                <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-[16px] font-bold text-text-secondary">
                    {isLogin ? 'Welcome back' : 'Create your account'}
                </motion.p>
            </div>

            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} whileTap={{ scale: 0.97 }} onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 py-4 rounded-[var(--radius-button)] border border-border bg-white shadow-sm text-[15px] font-bold text-primary mb-6">
                <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
            </motion.button>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border-light" />
                <span className="text-[13px] font-bold text-text-muted uppercase">or</span>
                <div className="flex-1 h-px bg-border-light" />
            </motion.div>

            <motion.form initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} onSubmit={handleEmailAuth} className="space-y-4 w-full">
                <div className="relative flex items-center bg-white border border-border-light shadow-sm rounded-[var(--radius-input)] overflow-hidden">
                    <Mail size={18} className="text-text-muted ml-4" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        className="w-full bg-transparent px-3 py-4 text-[15px] font-medium text-primary placeholder:text-text-muted focus:outline-none"
                    />
                </div>
                <div className="relative flex items-center bg-white border border-border-light shadow-sm rounded-[var(--radius-input)] overflow-hidden">
                    <Lock size={18} className="text-text-muted ml-4" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-transparent pl-3 pr-12 py-4 text-[15px] font-medium text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-text-muted">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[13px] text-center">{error}</motion.p>}

                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} className="w-full mt-2 py-4 bg-primary text-white rounded-[16px] font-extrabold text-[16px] shadow-md disabled:opacity-50">
                    {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
                </motion.button>
            </motion.form>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center mt-6">
                <p className="text-[14px] text-text-secondary">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={() => { setIsLogin(!isLogin); setError('') }} className="font-bold text-accent">
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </motion.div>
        </div>
    )
}

// --- Main Root Component ---
export default function Onboarding() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [showAuth, setShowAuth] = useState(false)
    const [isTailoring, setIsTailoring] = useState(false)
    const [tailoringMsg, setTailoringMsg] = useState('Configuring toxicity models...')

    // Profiles state
    const [selectedDiseases, setSelectedDiseases] = useState([])
    const [selectedAllergies, setSelectedAllergies] = useState([])
    const [selectedPrefs, setSelectedPrefs] = useState([])
    const [commitmentCount, setCommitmentCount] = useState(null)

    const { hasSeenOnboarding, setHealthPreferences } = useStore()
    const totalSlides = 8

    useEffect(() => {
        if (hasSeenOnboarding) setShowAuth(true)
    }, [hasSeenOnboarding])

    const handleBack = () => {
        if (currentSlide > 0) setCurrentSlide(prev => prev - 1)
    }

    const checkLimit = (setter, currentArray) => {
        const totalCount =
            (setter === setSelectedDiseases ? 0 : selectedDiseases.filter(x => x !== 'None').length) +
            (setter === setSelectedAllergies ? 0 : selectedAllergies.filter(x => x !== 'None').length) +
            (setter === setSelectedPrefs ? 0 : selectedPrefs.filter(x => x !== 'None').length) +
            currentArray.length

        if (totalCount >= 15) {
            alert('Limit Reached: You can only select a maximum of 15 health preferences completely.')
            return false
        }
        return true
    }

    const toggleArrayItem = (setter) => (item, isExclusiveNode = false) => {
        setter(prev => {
            if (isExclusiveNode) return ['None']
            if (item === 'None') return []
            const fresh = prev.filter(p => p !== 'None')
            if (fresh.includes(item)) {
                return fresh.filter(i => i !== item)
            }
            if (!checkLimit(setter, fresh)) return fresh
            return [...fresh, item]
        })
    }

    const handleAddCustom = (setter) => (item) => {
        setter(prev => {
            const fresh = prev.filter(x => x !== 'None')
            if (fresh.includes(item)) return fresh
            if (!checkLimit(setter, fresh)) return fresh
            return [...fresh, item]
        })
    }

    const handleNext = async () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1)
        } else {
            // Save payload to store
            const payload = {
                diseases: selectedDiseases,
                allergies: selectedAllergies,
                goals: selectedPrefs,
            }
            setHealthPreferences(payload)

            // Initiating Fake Tailoring Loader -> Auth
            setIsTailoring(true)
            setTailoringMsg('Cross-referencing EWG database...')
            setTimeout(() => setTailoringMsg('Analyzing custom health profile...'), 900)
            setTimeout(() => setTailoringMsg('Applying personalized filters...'), 1800)
            setTimeout(() => {
                setIsTailoring(false)
                setShowAuth(true)
            }, 2700)
        }
    }

    if (showAuth) return <AuthScreen />

    if (isTailoring) {
        return (
            <div className="flex flex-col items-center justify-center min-h-dvh bg-white px-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.6, type: 'spring' }} className="mb-6">
                    <div className="w-16 h-16 flex items-center justify-center bg-accent/10 rounded-2xl">
                        <span className="text-3xl">🎛️</span>
                    </div>
                </motion.div>
                <motion.h2 initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-[24px] font-black text-primary mb-2">
                    Tailoring Your AI
                </motion.h2>
                <motion.p initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-[14px] text-text-secondary mb-8">
                    {tailoringMsg}
                </motion.p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                    <PulsingDot color="#0a0a0a" />
                </motion.div>
            </div>
        )
    }

    const renderSlide = () => {
        switch (currentSlide) {
            case 0: return <Slide1 />
            case 1: return <SlideDisease selections={selectedDiseases} onToggle={toggleArrayItem(setSelectedDiseases)} onAddCustom={handleAddCustom(setSelectedDiseases)} />
            case 2: return <SlideAllergy selections={selectedAllergies} onToggle={toggleArrayItem(setSelectedAllergies)} onAddCustom={handleAddCustom(setSelectedAllergies)} />
            case 3: return <SlideGoals selectedPrefs={selectedPrefs} onTogglePref={toggleArrayItem(setSelectedPrefs)} onAddCustom={handleAddCustom(setSelectedPrefs)} />
            case 4: return <SlideCommitment selection={commitmentCount} onSelect={setCommitmentCount} />
            case 5: return <SlideMockScan />
            case 6: return <SlideChemicals />
            case 7: return <SlideScience />
            default: return <Slide1 />
        }
    }

    const slideVariants = {
        enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
    }

    const direction = 1

    return (
        <div className="min-h-dvh flex flex-col bg-white overflow-hidden max-w-[480px] mx-auto relative">
            {/* Skip Header */}
            <div className="flex justify-end pt-10 px-6">
                <button onClick={() => setShowAuth(true)} className="px-3 py-1.5 rounded-full hover:bg-black/5 text-text-secondary text-[14px] font-medium transition-colors">
                    Skip
                </button>
            </div>

            {/* Slide Viewer */}
            <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar pt-4 pb-24">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentSlide}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, type: 'spring', bounce: 0 }}
                        className="w-full h-full flex items-center mb-0"
                    >
                        {renderSlide()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 px-6 pt-4 pb-[env(safe-area-inset-bottom)] bg-white border-t border-black/5 flex flex-col items-center z-10">
                {/* Dots indicator */}
                <div className="flex justify-center gap-1.5 mb-6">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                width: i === currentSlide ? 28 : 8,
                                backgroundColor: i === currentSlide ? '#0a0a0a' : '#d1d5db'
                            }}
                            className="h-2 rounded-full"
                        />
                    ))}
                </div>

                <div className="w-full flex gap-3 mb-5 mt-auto">
                    {currentSlide > 0 && (
                        <button onClick={handleBack} className="w-16 h-14 flex items-center justify-center border border-border-light bg-surface-elevated rounded-[16px] shadow-sm active:scale-95 transition-transform">
                            <ChevronRight size={24} className="text-text-secondary rotate-180" />
                        </button>
                    )}
                    <button onClick={handleNext} className="flex-1 h-14 bg-primary text-white rounded-[16px] flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform font-bold text-[16px]">
                        {currentSlide === totalSlides - 1 ? 'Build My Profile' : 'Continue'}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
