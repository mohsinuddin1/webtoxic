import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import BottomNav from '../components/BottomNav'

import {
    ArrowLeft,
    LogOut,
    Crown,
    User,
    Bell,
    Shield,
    HelpCircle,
    ChevronRight,
    Mail,
} from 'lucide-react'

function getLevelInfo(xp) {
    if (xp < 50) return { name: 'Beginner', current: xp, max: 50, level: 1 }
    if (xp < 150) return { name: 'Explorer', current: xp - 50, max: 100, level: 2 }
    if (xp < 300) return { name: 'Detective', current: xp - 150, max: 150, level: 3 }
    if (xp < 500) return { name: 'Expert', current: xp - 300, max: 200, level: 4 }
    return { name: 'Master', current: xp - 500, max: 500, level: 5 }
}

export default function Settings() {
    const navigate = useNavigate()
    const { user, profile, signOut: storeSignOut } = useStore()
    const level = getLevelInfo(profile?.level_xp || 0)

    const handleSignOut = async () => {
        await storeSignOut()
        navigate('/')
    }

    const menuItems = [
        {
            icon: Crown,
            label: profile?.is_pro ? 'Pro Member' : 'Upgrade to Pro',
            subtitle: profile?.is_pro ? 'Unlimited scans active' : '3 free scans/day',
            action: () => !profile?.is_pro && navigate('/paywall'),
            accent: true,
        },
        {
            icon: User,
            label: 'Account',
            subtitle: user?.email || 'Not signed in',
            action: () => { },
        },
        {
            icon: Bell,
            label: 'Notifications',
            subtitle: 'Manage alerts',
            action: () => { },
        },
        {
            icon: Shield,
            label: 'Privacy & Security',
            subtitle: 'Data protection',
            action: () => { },
        },
        {
            icon: HelpCircle,
            label: 'Help & Support',
            subtitle: 'FAQ and contact us',
            action: () => { },
        },
    ]

    const container = {
        hidden: {},
        show: { transition: { staggerChildren: 0.05 } },
    }

    const item = {
        hidden: { opacity: 0, y: 15 },
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
            <div className="flex items-center gap-3 px-5 pt-8 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-display text-xl">Settings</h1>
            </div>

            {/* Profile Card */}
            <motion.div variants={item} className="px-5 mb-6">
                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-5 border border-border-light">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-base">
                                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-text-muted text-xs mt-0.5">
                                <Mail size={12} />
                                {user?.email || 'Not signed in'}
                            </div>
                        </div>
                        {profile?.is_pro && (
                            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-bold">
                                PRO
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-border-light">
                        <div className="text-center">
                            <p className="text-xl font-bold">{profile?.current_streak || 0}</p>
                            <p className="text-text-muted text-[10px]">Day Streak</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold">{level.name}</p>
                            <p className="text-text-muted text-[10px]">Level {level.level}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold">{profile?.level_xp || 0}</p>
                            <p className="text-text-muted text-[10px]">Total XP</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Menu Items */}
            <div className="px-5 space-y-2">
                {menuItems.map((menuItem) => {
                    const Icon = menuItem.icon
                    return (
                        <motion.button
                            key={menuItem.label}
                            variants={item}
                            whileTap={{ scale: 0.98 }}
                            onClick={menuItem.action}
                            className={`w-full flex items-center gap-4 p-4 rounded-[var(--radius-card)] border border-border-light bg-surface-elevated text-left transition-colors active:bg-surface-muted ${menuItem.accent ? 'border-accent/30 bg-accent-light/50' : ''
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${menuItem.accent ? 'bg-accent/20' : 'bg-surface-muted'
                                    }`}
                            >
                                <Icon
                                    size={18}
                                    className={menuItem.accent ? 'text-accent' : 'text-text-secondary'}
                                />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-sm">{menuItem.label}</p>
                                <p className="text-text-muted text-xs">{menuItem.subtitle}</p>
                            </div>
                            <ChevronRight size={16} className="text-text-muted" />
                        </motion.button>
                    )
                })}
            </div>

            {/* Sign Out */}
            <motion.div variants={item} className="px-5 mt-8">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-[var(--radius-button)] border border-danger/30 text-danger font-medium text-sm hover:bg-danger/5 transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </motion.div>

            {/* Version */}
            <p className="text-center text-text-muted text-[10px] mt-6 mb-4">
                PureScan AI v1.0.0
            </p>

            {/* Bottom Nav */}
            <BottomNav />
        </motion.div>
    )
}
