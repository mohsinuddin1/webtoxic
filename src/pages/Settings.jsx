import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useStore from '../store/useStore'
import { supabase } from '../lib/supabase'
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
    CalendarClock,
    CreditCard,
    Loader2,
    ExternalLink,
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

    // Subscription state
    const [subInfo, setSubInfo] = useState(null)
    const [subLoading, setSubLoading] = useState(false)
    const [portalLoading, setPortalLoading] = useState(false)

    // Fetch subscription info on mount for pro users
    useEffect(() => {
        if (profile?.is_pro) {
            setSubLoading(true)
            supabase.functions.invoke('manage-subscription', {
                body: { action: 'get-info' }
            }).then(({ data, error }) => {
                if (!error && data?.subscription) {
                    setSubInfo(data.subscription)
                }
            }).finally(() => setSubLoading(false))
        }
    }, [profile?.is_pro])

    const handleSignOut = async () => {
        await storeSignOut()
        navigate('/')
    }

    // Open Stripe Customer Portal
    const handleManageSubscription = async () => {
        setPortalLoading(true)
        try {
            const { data, error } = await supabase.functions.invoke('manage-subscription', {
                body: { action: 'create-portal' }
            })
            if (error) throw new Error(error.message)
            if (data?.url) {
                window.location.href = data.url
            } else {
                console.error('No portal URL returned')
            }
        } catch (err) {
            console.error('Portal error:', err)
        } finally {
            setPortalLoading(false)
        }
    }

    // Format date helper
    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        })
    }

    // Get status label and color
    const getStatusBadge = (status) => {
        const map = {
            active: { label: 'Active', color: 'bg-green-100 text-green-700' },
            trialing: { label: 'Free Trial', color: 'bg-blue-100 text-blue-700' },
            past_due: { label: 'Past Due', color: 'bg-amber-100 text-amber-700' },
            canceled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
            unpaid: { label: 'Unpaid', color: 'bg-red-100 text-red-700' },
        }
        return map[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
    }

    const menuItems = [
        ...(!profile?.is_pro ? [{
            icon: Crown,
            label: 'Upgrade to Pro',
            subtitle: '3 free scans/day',
            action: () => navigate('/paywall'),
            accent: true,
        }] : []),
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

            {/* Subscription Card (Pro users only) */}
            {profile?.is_pro && (
                <motion.div variants={item} className="px-5 mb-4">
                    <div className="rounded-[var(--radius-card)] border border-accent/30 overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(232,168,56,0.08) 0%, rgba(240,192,96,0.04) 100%)' }}
                    >
                        {/* Header */}
                        <div className="p-4 pb-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #e8a838, #f0c060)' }}
                                    >
                                        <Crown size={16} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">Pro Subscription</h3>
                                        {subInfo && (
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${getStatusBadge(subInfo.status).color}`}>
                                                {getStatusBadge(subInfo.status).label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {subLoading && <Loader2 size={16} className="text-text-muted animate-spin" />}
                            </div>

                            {/* Subscription Details */}
                            {subInfo && (
                                <div className="space-y-2">
                                    {/* Plan */}
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <CreditCard size={14} className="text-text-muted flex-shrink-0" />
                                        <span className="text-text-secondary">
                                            {subInfo.plan.name} Plan — ₹{subInfo.plan.amount.toLocaleString()}/{subInfo.plan.interval}
                                        </span>
                                    </div>

                                    {/* Renewal / Trial / Cancellation date */}
                                    <div className="flex items-center gap-2.5 text-sm">
                                        <CalendarClock size={14} className="text-text-muted flex-shrink-0" />
                                        <span className="text-text-secondary">
                                            {subInfo.status === 'trialing' && subInfo.trialEnd
                                                ? `Trial ends ${formatDate(subInfo.trialEnd)}`
                                                : subInfo.cancelAtPeriodEnd
                                                    ? `Cancels on ${formatDate(subInfo.currentPeriodEnd)}`
                                                    : `Renews ${formatDate(subInfo.currentPeriodEnd)}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!subInfo && !subLoading && (
                                <p className="text-text-muted text-xs">Unlimited scans active</p>
                            )}
                        </div>

                        {/* Manage Button */}
                        <button
                            onClick={handleManageSubscription}
                            disabled={portalLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 border-t border-accent/15 text-sm font-medium text-accent hover:bg-accent/5 transition-colors disabled:opacity-50"
                        >
                            {portalLoading ? (
                                <><Loader2 size={14} className="animate-spin" /> Opening...
                                </>
                            ) : (
                                <><ExternalLink size={14} /> Manage Subscription</>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

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
