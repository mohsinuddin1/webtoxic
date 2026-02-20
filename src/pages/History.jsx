import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import BottomNav from '../components/BottomNav'
import { ArrowLeft, Search, Scan, Filter, X } from 'lucide-react'

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

const FILTER_OPTIONS = ['All', 'A', 'B', 'C', 'D', 'E']

export default function History() {
    const navigate = useNavigate()
    const { scanHistory, fetchScanHistory, loading, profile, canScan } = useStore()
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState('All')
    const [showSearch, setShowSearch] = useState(false)

    useEffect(() => {
        if (!loading && profile) {
            fetchScanHistory()
        }
    }, [loading, profile])

    const filteredScans = scanHistory.filter((scan) => {
        const matchesSearch = !searchQuery ||
            (scan.product_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = activeFilter === 'All' || scan.grade === activeFilter
        return matchesSearch && matchesFilter
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
        show: { transition: { staggerChildren: 0.05 } },
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    }

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="min-h-dvh bg-white pb-32"
        >
            {/* Header */}
            <motion.div variants={item} className="pt-8 px-5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-display text-2xl">Collections</h1>
                        <p className="text-text-secondary text-sm mt-0.5">
                            {scanHistory.length} total scans
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center"
                    >
                        {showSearch ? <X size={18} /> : <Search size={18} />}
                    </button>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-surface-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    autoFocus
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Filter Chips */}
            <motion.div variants={item} className="px-5 mb-4">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {FILTER_OPTIONS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter
                                ? 'bg-primary text-white'
                                : 'bg-surface-muted text-text-secondary'
                                }`}
                        >
                            {filter === 'All' ? 'All' : `Grade ${filter}`}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Scan List */}
            <motion.div variants={item} className="px-5">
                {filteredScans.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
                            <Scan size={32} className="text-text-muted" />
                        </div>
                        <h3 className="text-display text-lg mb-2">
                            {searchQuery || activeFilter !== 'All'
                                ? 'No matching scans'
                                : 'No scans yet'}
                        </h3>
                        <p className="text-text-secondary text-sm max-w-[240px] mx-auto mb-6">
                            {searchQuery || activeFilter !== 'All'
                                ? 'Try adjusting your search or filter'
                                : 'Tap the scan button to analyze your first product'}
                        </p>
                        {!searchQuery && activeFilter === 'All' && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleScan}
                                className="px-6 py-3 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-sm"
                            >
                                Start Scanning
                            </motion.button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        {filteredScans.map((scan, i) => (
                            <motion.div
                                key={scan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * i }}
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
                                {/* Grade & Date */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <span className="text-text-muted text-xs">
                                        {new Date(scan.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
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
                                        {scan.grade || '?'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Bottom Nav */}
            <BottomNav />
        </motion.div>
    )
}
