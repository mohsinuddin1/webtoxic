import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import BottomNav from '../components/BottomNav'
import { Flame, Scan, Zap, Trophy, TrendingUp, Crown } from 'lucide-react'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getWeekDays() {
    const today = new Date()
    const days = []
    for (let i = -3; i <= 3; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        days.push({
            label: DAYS[d.getDay()],
            date: d.getDate(),
            isToday: i === 0,
            isPast: i < 0,
        })
    }
    return days
}

function ToxicityBar({ score }) {
    return (
        <div className="relative w-full max-w-[140px]">
            <div className="h-2 rounded-full gradient-toxicity overflow-hidden opacity-80" />
            <motion.div
                initial={{ left: '0%' }}
                animate={{ left: `${Math.min(score, 100)}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            >
                <div className="w-3 h-3 rounded-full bg-white border-2 border-primary shadow-sm" />
            </motion.div>
        </div>
    )
}

function getLevelInfo(xp) {
    if (xp < 50) return { name: 'Beginner', current: xp, max: 50, emoji: '🌱' }
    if (xp < 150) return { name: 'Explorer', current: xp - 50, max: 100, emoji: '🔍' }
    if (xp < 300) return { name: 'Detective', current: xp - 150, max: 150, emoji: '🕵️' }
    if (xp < 500) return { name: 'Expert', current: xp - 300, max: 200, emoji: '⚡' }
    return { name: 'Master', current: xp - 500, max: 500, emoji: '👑' }
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

function getGradeColor(grade) {
    const colors = {
        A: 'from-emerald-400 to-green-500',
        B: 'from-lime-400 to-green-400',
        C: 'from-amber-400 to-yellow-500',
        D: 'from-orange-400 to-amber-500',
        E: 'from-red-400 to-rose-500',
    }
    return colors[grade] || colors.C
}

function getGradeBg(grade) {
    const colors = {
        A: 'bg-grade-a/15 text-grade-a',
        B: 'bg-grade-b/15 text-grade-b',
        C: 'bg-grade-c/15 text-grade-c',
        D: 'bg-grade-d/15 text-grade-d',
        E: 'bg-grade-e/15 text-grade-e',
    }
    return colors[grade] || colors.C
}

export default function Home() {
    const navigate = useNavigate()
    const { user, profile, scanHistory, fetchScanHistory, canScan, getRemainingScans, loading } =
        useStore()
    const weekDays = getWeekDays()
    const level = getLevelInfo(profile?.level_xp || 0)
    const greeting = getGreeting()
    const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

    useEffect(() => {
        if (!loading && profile) {
            fetchScanHistory()
        }
    }, [loading, profile])

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    const todayScans = scanHistory.filter((s) => {
        const scanDate = new Date(s.created_at).toDateString()
        return scanDate === new Date().toDateString()
    })

    const handleScan = () => {
        if (!canScan()) {
            navigate('/paywall')
        } else {
            navigate('/scan')
        }
    }

    const container = {
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="min-h-dvh bg-white pb-24"
        >
            {/* ── Header with Greeting ── */}
            <motion.div variants={item} className="pt-8 pb-1 px-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-text-muted text-xs font-medium tracking-wide">{greeting}</p>
                        <h1 className="text-display text-xl mt-0.5">
                            {firstName} <span className="inline-block animate-pulse">👋</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-lg">☣️</span>
                        <span className="text-brand text-xs tracking-[0.2em]">
                            PURE<span className="text-accent">SCAN</span>
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* ── Hero Stats Card (Dark Gradient) ── */}
            <motion.div variants={item} className="px-5 mt-4 mb-5">
                <div className="relative overflow-hidden rounded-2xl p-5"
                    style={{
                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                    }}
                >
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(232,168,56,0.15) 0%, transparent 70%)' }}
                    />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)' }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            {profile?.is_pro ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
                                    style={{ background: 'linear-gradient(135deg, #e8a838, #f0c060)', color: '#0a0a0a' }}
                                >
                                    <Crown size={10} /> PRO
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 rounded-full text-[10px] text-white/70 font-medium">
                                    Free Plan
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Scan size={18} className="text-white/90" />
                                </div>
                                <p className="text-white font-bold text-lg">{scanHistory.length}</p>
                                <p className="text-white/50 text-[10px]">Total Scans</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Flame size={18} className="text-orange-400" />
                                </div>
                                <p className="text-white font-bold text-lg">{profile?.current_streak || 0}</p>
                                <p className="text-white/50 text-[10px]">Day Streak</p>
                            </div>
                            <div className="text-center">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                                    <Trophy size={18} className="text-accent" />
                                </div>
                                <p className="text-white font-bold text-lg">{level.emoji}</p>
                                <p className="text-white/50 text-[10px]">{level.name}</p>
                            </div>
                        </div>

                        {/* XP Progress */}
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-white/60 text-[10px] font-medium flex items-center gap-1">
                                    <Zap size={10} /> LEVEL PROGRESS
                                </span>
                                <span className="text-white/40 text-[10px]">{level.current}/{level.max} XP</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(level.current / level.max) * 100}%` }}
                                    transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                                    className="h-1.5 rounded-full"
                                    style={{ background: 'linear-gradient(90deg, #e8a838, #f0c060)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Week Calendar ── */}
            <motion.div variants={item} className="px-5 py-2">
                <div className="flex justify-between items-center">
                    {weekDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                            <span className={`text-[10px] font-semibold tracking-wide ${day.isToday ? 'text-primary' : 'text-text-muted'}`}>
                                {day.label}
                            </span>
                            <motion.div
                                initial={day.isToday ? { scale: 0.8 } : {}}
                                animate={day.isToday ? { scale: 1 } : {}}
                                transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${day.isToday
                                    ? 'bg-primary text-white shadow-lg ring-4 ring-primary/15'
                                    : day.isPast
                                        ? 'bg-surface-muted text-text-secondary'
                                        : 'text-text-muted'
                                    }`}
                            >
                                {day.date}
                            </motion.div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ── Daily Progress ── */}
            <motion.div variants={item} className="px-5 mt-4 mb-5">
                <div className="bg-surface-elevated rounded-2xl p-4 border border-border-light">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <TrendingUp size={16} className="text-primary" />
                            </div>
                            <div>
                                <h2 className="font-bold text-sm">Today's Scans</h2>
                                <p className="text-text-muted text-[10px]">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <span className="text-display text-lg">
                            {todayScans.length}<span className="text-text-muted text-xs font-normal">/5</span>
                        </span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((todayScans.length / 5) * 100, 100)}%` }}
                            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                            className="h-2 rounded-full"
                            style={{ background: 'linear-gradient(90deg, #22c55e, #84cc16)' }}
                        />
                    </div>
                    {!profile?.is_pro && (
                        <p className="text-text-muted text-[10px] mt-2 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                            {getRemainingScans()} of 3 free scans remaining
                        </p>
                    )}
                </div>
            </motion.div>

            {/* ── Recent Scans ── */}
            <motion.div variants={item} className="px-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-display text-base">Recent Scans</h2>
                    {scanHistory.length > 0 && (
                        <button
                            onClick={() => navigate('/history')}
                            className="text-primary text-xs font-semibold"
                        >
                            View All →
                        </button>
                    )}
                </div>

                {scanHistory.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 bg-surface-elevated rounded-2xl border border-border-light"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
                            <Scan size={28} className="text-text-muted" />
                        </div>
                        <h3 className="text-display text-base mb-1">No scans yet</h3>
                        <p className="text-text-muted text-xs max-w-[200px] mx-auto mb-5">
                            Scan your first product to see how safe it really is
                        </p>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleScan}
                            className="px-6 py-2.5 text-white rounded-full font-semibold text-sm"
                            style={{ background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)' }}
                        >
                            Start Scanning
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="space-y-2.5">
                        {scanHistory.slice(0, 10).map((scan, i) => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 * i }}
                                onClick={() => navigate(`/result/${scan.id}`)}
                                className="flex items-center gap-3 p-3 rounded-2xl bg-surface-elevated border border-border-light cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm"
                            >
                                {/* Thumbnail */}
                                <div className="w-14 h-14 rounded-xl bg-surface-muted overflow-hidden flex-shrink-0">
                                    {scan.image_url ? (
                                        <img
                                            src={scan.image_url}
                                            alt={scan.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Scan size={18} className="text-text-muted" />
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate mb-1.5">
                                        {scan.product_name || 'Unknown Product'}
                                    </h4>
                                    <ToxicityBar score={scan.score || 0} />
                                </div>
                                {/* Grade Badge */}
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <span className="text-text-muted text-[10px]">
                                        {new Date(scan.created_at).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    <span className={`text-xs font-bold w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br text-white ${getGradeColor(scan.grade)}`}>
                                        {scan.grade || '?'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* ── FAB Scan Button ── */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleScan}
                className="fixed z-50 flex items-center justify-center animate-pulse-glow"
                style={{
                    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
                    right: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0a0a0a, #1a1a2e)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(255,255,255,1)',
                }}
            >
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <path d="M4 10V6a2 2 0 012-2h4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M22 4h4a2 2 0 012 2v4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M28 22v4a2 2 0 01-2 2h-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 28H6a2 2 0 01-2-2v-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="16" y="20" textAnchor="middle" fontSize="14" fill="white">☣</text>
                </svg>
            </motion.button>

            {/* Bottom Nav */}
            <BottomNav />
        </motion.div>
    )
}
