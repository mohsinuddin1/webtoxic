import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import { Flame, ChevronRight, Scan } from 'lucide-react'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getWeekDays() {
    const today = new Date()
    const dayOfWeek = today.getDay()
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

function GradeBar({ grade }) {
    const grades = ['A', 'B', 'C', 'D', 'E']
    const colors = [
        'bg-grade-a',
        'bg-grade-b',
        'bg-grade-c',
        'bg-grade-d',
        'bg-grade-e',
    ]

    return (
        <div className="flex gap-0.5 w-full max-w-[140px]">
            {grades.map((g, i) => {
                const isActive = g === grade
                return (
                    <div
                        key={g}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${colors[i]
                            } ${isActive ? 'scale-y-150 opacity-100' : 'opacity-30'}`}
                    />
                )
            })}
        </div>
    )
}

function ToxicityBar({ score }) {
    return (
        <div className="relative w-full max-w-[140px]">
            <div className="h-2.5 rounded-full gradient-toxicity overflow-hidden" />
            <motion.div
                initial={{ left: '0%' }}
                animate={{ left: `${Math.min(score, 100)}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[7px] border-b-primary rotate-180" />
            </motion.div>
        </div>
    )
}

function getLevelInfo(xp) {
    if (xp < 50) return { name: 'Beginner', current: xp, max: 50 }
    if (xp < 150) return { name: 'Explorer', current: xp - 50, max: 100 }
    if (xp < 300) return { name: 'Detective', current: xp - 150, max: 150 }
    if (xp < 500) return { name: 'Expert', current: xp - 300, max: 200 }
    return { name: 'Master', current: xp - 500, max: 500 }
}

export default function Home() {
    const navigate = useNavigate()
    const { profile, scanHistory, fetchScanHistory, canScan, getRemainingScans } =
        useStore()
    const weekDays = getWeekDays()
    const level = getLevelInfo(profile?.level_xp || 0)

    useEffect(() => {
        fetchScanHistory()
    }, [])

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
            {/* Header */}
            <motion.div variants={item} className="pt-8 pb-2 px-5 text-center">
                <div className="inline-flex items-center gap-1.5">
                    <span className="text-xl">☣️</span>
                    <h1 className="text-brand text-lg tracking-[0.2em]">
                        PURE<span className="text-accent">SCAN</span>
                    </h1>
                    <span className="text-xl">☣️</span>
                </div>
            </motion.div>

            {/* Week Calendar */}
            <motion.div variants={item} className="px-5 py-4">
                <div className="flex justify-between items-center">
                    {weekDays.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                            <span className={`text-xs font-medium ${day.isToday ? 'text-primary' : 'text-text-muted'}`}>
                                {day.label}
                            </span>
                            <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${day.isToday
                                        ? 'bg-primary text-white shadow-md'
                                        : day.isPast
                                            ? 'bg-surface-muted text-text-secondary'
                                            : 'text-text-muted'
                                    }`}
                            >
                                {day.date}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Streak & Level Cards */}
            <motion.div variants={item} className="px-5 grid grid-cols-2 gap-3 mb-6">
                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                    <div className="flex items-center gap-2 mb-1">
                        <Flame size={18} className="text-orange-500" />
                        <span className="font-bold text-sm">
                            {profile?.current_streak || 0} day streak!
                        </span>
                    </div>
                    <p className="text-text-muted text-xs">Keep scanning daily</p>
                </div>
                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">{level.name}</span>
                        <span className="text-text-muted text-xs">
                            {level.current}/{level.max}
                        </span>
                    </div>
                    <div className="w-full bg-surface-muted rounded-full h-2">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(level.current / level.max) * 100}%`,
                            }}
                            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                            className="bg-primary h-2 rounded-full"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Daily Progress */}
            <motion.div variants={item} className="px-5 mb-4">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h2 className="text-display text-lg">
                            Scans from{' '}
                            {new Date().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </h2>
                        <p className="text-text-secondary text-sm">Daily Goal Progress</p>
                    </div>
                    <span className="text-text-muted text-sm font-semibold">
                        {todayScans.length}/5
                    </span>
                </div>
                <div className="w-full bg-surface-muted rounded-full h-2.5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${Math.min((todayScans.length / 5) * 100, 100)}%`,
                        }}
                        transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                        className="bg-primary h-2.5 rounded-full"
                    />
                </div>
                {!profile?.is_pro && (
                    <p className="text-text-muted text-xs mt-2">
                        {getRemainingScans()}/3 free scans remaining
                    </p>
                )}
            </motion.div>

            {/* Scan History */}
            <motion.div variants={item} className="px-5">
                {scanHistory.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
                            <Scan size={32} className="text-text-muted" />
                        </div>
                        <h3 className="text-display text-lg mb-2">No scans yet</h3>
                        <p className="text-text-secondary text-sm max-w-[240px] mx-auto">
                            Tap the scan button to analyze your first product
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {scanHistory.map((scan, i) => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                onClick={() => navigate(`/result/${scan.id}`)}
                                className="flex items-center gap-3 p-3 rounded-[var(--radius-card)] bg-surface-elevated border border-border-light cursor-pointer active:scale-[0.98] transition-transform"
                            >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 rounded-xl bg-surface-muted overflow-hidden flex-shrink-0">
                                    {scan.image_url ? (
                                        <img
                                            src={scan.image_url}
                                            alt={scan.product_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Scan size={20} className="text-text-muted" />
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm truncate mb-1">
                                        {scan.product_name || 'Unknown Product'}
                                    </h4>
                                    <ToxicityBar score={scan.score || 0} />
                                </div>
                                {/* Grade & Time */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-text-muted text-xs">
                                        {new Date(scan.created_at).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    <span
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${scan.grade === 'A'
                                                ? 'bg-grade-a/20 text-grade-a'
                                                : scan.grade === 'B'
                                                    ? 'bg-grade-b/20 text-grade-b'
                                                    : scan.grade === 'C'
                                                        ? 'bg-grade-c/20 text-grade-c'
                                                        : scan.grade === 'D'
                                                            ? 'bg-grade-d/20 text-grade-d'
                                                            : 'bg-grade-e/20 text-grade-e'
                                            }`}
                                    >
                                        {scan.grade || '?'}/{scan.score != null ? Math.round(scan.score / 20) : '?'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* FAB Scan Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleScan}
                className="fixed bottom-6 right-5 w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-fab animate-pulse-glow z-50"
                style={{ maxWidth: '430px' }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 8v1M12 15v1M8 12h1M15 12h1" />
                </svg>
            </motion.button>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border-light safe-bottom z-40">
                <div className="flex items-center justify-around py-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center gap-0.5 px-4 py-1 text-primary"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3l9 8h-3v10h-5v-6h-2v6H6V11H3l9-8z" />
                        </svg>
                        <span className="text-[11px] font-medium">Home</span>
                    </button>
                    <button
                        onClick={() => navigate('/history')}
                        className="flex flex-col items-center gap-0.5 px-4 py-1 text-text-muted"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        <span className="text-[11px] font-medium">Collections</span>
                    </button>
                    <button
                        onClick={() => navigate('/settings')}
                        className="flex flex-col items-center gap-0.5 px-4 py-1 text-text-muted"
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        <span className="text-[11px] font-medium">Settings</span>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
