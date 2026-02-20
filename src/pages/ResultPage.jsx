import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
    ArrowLeft,
    AlertTriangle,
    Shield,
    Leaf,
    Beaker,
    ChevronDown,
    ChevronUp,
    X,
    Wheat,
    Droplets,
} from 'lucide-react'

const GRADE_COLORS = {
    A: { bg: 'bg-grade-a', text: 'text-white' },
    B: { bg: 'bg-grade-b', text: 'text-white' },
    C: { bg: 'bg-grade-c', text: 'text-white' },
    D: { bg: 'bg-grade-d', text: 'text-white' },
    E: { bg: 'bg-grade-e', text: 'text-white' },
}

const RISK_COLORS = {
    high: 'bg-red-100 text-red-700 border-red-200',
    moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-green-100 text-green-700 border-green-200',
}

const CATEGORY_ICONS = {
    carcinogen: '☢️',
    endocrine_disruptor: '⚠️',
    neurotoxin: '🧠',
    irritant: '🔴',
    allergen: '🤧',
    safe: '✅',
}

const TABS = ['Overview', 'Harmful', 'Ingredients', 'Macros']

export default function ResultPage() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [result, setResult] = useState(location.state?.result || null)
    const [imageUrl, setImageUrl] = useState(location.state?.imageUrl || null)
    const [activeTab, setActiveTab] = useState(0)
    const [expandedChemical, setExpandedChemical] = useState(null)
    const [loading, setLoading] = useState(!location.state?.result)

    useEffect(() => {
        if (!result && id && id !== 'temp') {
            loadScan()
        }
    }, [id])

    const loadScan = async () => {
        try {
            const { data } = await supabase
                .from('scans')
                .select('*')
                .eq('id', id)
                .single()

            if (data) {
                setResult({
                    productName: data.product_name,
                    overallGrade: data.grade,
                    toxicityScore: data.score,
                    ingredients: data.ingredients || [],
                    harmfulChemicals: data.harmful_chemicals || [],
                })
                setImageUrl(data.image_url)
            }
        } catch (err) {
            console.error('Error loading scan:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-dvh bg-white flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full"
                />
            </div>
        )
    }

    if (!result) {
        return (
            <div className="min-h-dvh bg-white flex flex-col items-center justify-center px-6">
                <p className="text-text-secondary mb-4">Result not found</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-sm"
                >
                    Go Home
                </button>
            </div>
        )
    }

    const grade = result.overallGrade || 'C'
    const score = result.toxicityScore || 50
    const harmfulCount = result.harmfulChemicals?.length || 0

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="min-h-dvh bg-white"
        >
            {/* Product Image Header */}
            <div className="relative h-72 bg-surface-muted">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={result.productName}
                        className="w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center"
                >
                    <ArrowLeft size={20} />
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center"
                >
                    <X size={20} />
                </button>

                {/* Floating Chemical Bubbles */}
                {result.harmfulChemicals?.slice(0, 4).map((chem, i) => {
                    const positions = [
                        'top-16 left-4',
                        'top-12 right-4',
                        'top-36 left-8',
                        'top-32 right-8',
                    ]
                    return (
                        <motion.div
                            key={chem.name}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.15, type: 'spring' }}
                            className={`absolute ${positions[i]} px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-xs font-medium`}
                        >
                            {chem.name}
                        </motion.div>
                    )
                })}
            </div>

            {/* Product Info Card */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-5 -mt-6 relative z-10"
            >
                <div className="bg-white rounded-t-[1.5rem] pt-6 pb-4 text-center">
                    <h1 className="text-display text-xl mb-1">
                        {result.productName || 'Unknown Product'}
                    </h1>
                    {result.brand && (
                        <p className="text-text-secondary text-sm">{result.brand}</p>
                    )}
                </div>
            </motion.div>

            {/* Nutri/Toxicity Score Section */}
            <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-5 pb-4"
            >
                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-5 border border-border-light">
                    <h3 className="text-brand text-xs tracking-widest text-text-secondary mb-4">
                        {result.productType === 'cosmetic' ? 'TOXICITY SCORE' : 'NUTRI-SCORE'}
                    </h3>

                    {/* Grade Blocks */}
                    <div className="flex gap-1.5 mb-4">
                        {['A', 'B', 'C', 'D', 'E'].map((g) => {
                            const isActive = g === grade
                            const colors = {
                                A: 'bg-grade-a',
                                B: 'bg-grade-b',
                                C: 'bg-grade-c',
                                D: 'bg-grade-d',
                                E: 'bg-grade-e',
                            }
                            return (
                                <motion.div
                                    key={g}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{
                                        scale: isActive ? 1.15 : 1,
                                        opacity: isActive ? 1 : 0.35,
                                    }}
                                    transition={{ delay: 0.4 + ['A', 'B', 'C', 'D', 'E'].indexOf(g) * 0.08, type: 'spring' }}
                                    className={`flex-1 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg ${colors[g]} ${isActive ? 'shadow-lg ring-2 ring-offset-2 ring-current' : ''
                                        }`}
                                >
                                    {g}
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Description */}
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {result.summary || getGradeDescription(grade)}
                    </p>

                    {/* Toxicity Meter */}
                    {result.productType === 'cosmetic' && (
                        <div className="mt-4 bg-accent-light rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-sm">Toxicity Meter</h4>
                                <span className="font-bold text-sm">{Math.round(score / 20)}/5</span>
                            </div>
                            <div className="relative h-3 rounded-full gradient-toxicity overflow-hidden">
                                <motion.div
                                    initial={{ left: '0%' }}
                                    animate={{ left: `${Math.min(score, 100)}%` }}
                                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-primary"
                                />
                            </div>
                            <p className="text-text-secondary text-xs mt-2">
                                {harmfulCount > 0
                                    ? `${harmfulCount} ingredients have toxicity concerns`
                                    : 'No significant toxicity concerns found'}
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Additives Badges */}
            {result.additives?.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="px-5 pb-4"
                >
                    <h3 className="font-bold text-sm mb-2">Additives</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.additives.map((additive) => (
                            <span
                                key={additive}
                                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-xs font-semibold"
                            >
                                {additive}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Allergens */}
            {result.allergens?.length > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.42 }}
                    className="px-5 pb-4"
                >
                    <h3 className="font-bold text-sm mb-2">⚠️ Allergens</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.allergens.map((allergen) => (
                            <span
                                key={allergen}
                                className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold capitalize"
                            >
                                {allergen}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Nova Group + Nutrient Levels */}
            {(result.novaGroup || result.nutrientLevels) && (
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.44 }}
                    className="px-5 pb-4"
                >
                    <div className="flex gap-3">
                        {result.novaGroup && (
                            <div className="flex-1 bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light text-center">
                                <Wheat size={18} className="text-amber-500 mx-auto mb-1.5" />
                                <p className="text-[10px] text-text-muted mb-1">Processing</p>
                                <p className="text-lg font-bold">NOVA {result.novaGroup}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">
                                    {result.novaGroup === 1 ? 'Unprocessed' : result.novaGroup === 2 ? 'Processed Ingredients' : result.novaGroup === 3 ? 'Processed' : 'Ultra-processed'}
                                </p>
                            </div>
                        )}
                        {result.nutrientLevels && Object.keys(result.nutrientLevels).length > 0 && (
                            <div className="flex-1 bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                                <Droplets size={18} className="text-blue-500 mb-1.5" />
                                <p className="text-[10px] text-text-muted mb-2">Nutrient Levels</p>
                                <div className="space-y-1.5">
                                    {Object.entries(result.nutrientLevels).map(([key, level]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <span className="text-[11px] capitalize">{key.replace(/-/g, ' ')}</span>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${level === 'low' ? 'bg-green-100 text-green-700' :
                                                    level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>{level}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Tabs */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="px-5 mb-2"
            >
                <div className="flex gap-1 p-1 bg-surface-muted rounded-full">
                    {TABS.filter(
                        (tab) => tab !== 'Macros' || result.productType === 'food'
                    ).map((tab, i) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(i)}
                            className={`flex-1 py-2 text-xs font-medium rounded-full transition-all ${activeTab === i
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-text-muted'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <div className="px-5 pb-8">
                <AnimatePresence mode="wait">
                    {activeTab === 0 && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                                    <Shield size={20} className="text-success mb-2" />
                                    <p className="text-xs text-text-muted">Safe Ingredients</p>
                                    <p className="text-xl font-bold">
                                        {result.ingredients?.filter((i) => i.category === 'safe').length || 0}
                                    </p>
                                </div>
                                <div className="bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                                    <AlertTriangle size={20} className="text-danger mb-2" />
                                    <p className="text-xs text-text-muted">Harmful</p>
                                    <p className="text-xl font-bold">{harmfulCount}</p>
                                </div>
                            </div>
                            <div className="bg-surface-elevated rounded-[var(--radius-card)] p-4 border border-border-light">
                                <Leaf size={20} className="text-success mb-2" />
                                <p className="text-xs text-text-muted">Total Ingredients</p>
                                <p className="text-xl font-bold">
                                    {result.ingredients?.length || 0}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 1 && (
                        <motion.div
                            key="harmful"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                        >
                            {result.harmfulChemicals?.length === 0 ? (
                                <div className="text-center py-8">
                                    <Shield size={40} className="text-success mx-auto mb-3" />
                                    <p className="font-semibold text-sm">No harmful chemicals detected!</p>
                                    <p className="text-text-muted text-xs mt-1">This product looks safe.</p>
                                </div>
                            ) : (
                                result.harmfulChemicals?.map((chem, i) => (
                                    <motion.div
                                        key={chem.name}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-surface-elevated rounded-[var(--radius-card)] border border-border-light overflow-hidden"
                                    >
                                        <button
                                            onClick={() =>
                                                setExpandedChemical(
                                                    expandedChemical === i ? null : i
                                                )
                                            }
                                            className="w-full flex items-center gap-3 p-4"
                                        >
                                            <span className="text-xl">
                                                {CATEGORY_ICONS[chem.category] || '⚠️'}
                                            </span>
                                            <div className="flex-1 text-left">
                                                <h4 className="font-semibold text-sm">{chem.name}</h4>
                                                <span
                                                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${RISK_COLORS[chem.riskLevel] || RISK_COLORS.moderate
                                                        }`}
                                                >
                                                    {chem.riskLevel?.toUpperCase()} RISK
                                                </span>
                                            </div>
                                            {expandedChemical === i ? (
                                                <ChevronUp size={16} className="text-text-muted" />
                                            ) : (
                                                <ChevronDown size={16} className="text-text-muted" />
                                            )}
                                        </button>
                                        <AnimatePresence>
                                            {expandedChemical === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-0">
                                                        <p className="text-text-secondary text-xs leading-relaxed">
                                                            {chem.explanation}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {activeTab === 2 && (
                        <motion.div
                            key="ingredients"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-2"
                        >
                            {result.ingredients?.map((ing, i) => (
                                <div
                                    key={ing.name}
                                    className="flex items-center gap-3 p-3 bg-surface-elevated rounded-xl border border-border-light"
                                >
                                    <span className="text-sm">
                                        {CATEGORY_ICONS[ing.category] || '•'}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{ing.name}</p>
                                        <p className="text-[10px] text-text-muted capitalize">
                                            {ing.category?.replace('_', ' ')}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${RISK_COLORS[ing.riskLevel] || RISK_COLORS.low
                                            }`}
                                    >
                                        {ing.riskLevel}
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 3 && result.macros && (
                        <motion.div
                            key="macros"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-surface-elevated rounded-[var(--radius-card)] p-5 border border-border-light space-y-4">
                                {[
                                    { label: 'Calories', value: result.macros.calories, unit: 'kcal', color: 'bg-orange-400' },
                                    { label: 'Protein', value: result.macros.protein, unit: 'g', color: 'bg-blue-400' },
                                    { label: 'Carbs', value: result.macros.carbs, unit: 'g', color: 'bg-yellow-400' },
                                    { label: 'Fats', value: result.macros.fats, unit: 'g', color: 'bg-red-400' },
                                    { label: 'Sugar', value: result.macros.sugar, unit: 'g', color: 'bg-pink-400' },
                                    { label: 'Fiber', value: result.macros.fiber, unit: 'g', color: 'bg-green-400' },
                                    { label: 'Salt', value: result.macros.salt, unit: 'g', color: 'bg-gray-400' },
                                    { label: 'Saturated Fat', value: result.macros.saturatedFat, unit: 'g', color: 'bg-rose-400' },
                                ].map(
                                    (macro) =>
                                        macro.value != null && macro.value > 0 && (
                                            <div key={macro.label} className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${macro.color}`} />
                                                <span className="text-sm flex-1">{macro.label}</span>
                                                <span className="font-bold text-sm">
                                                    {macro.value}
                                                    {macro.unit}
                                                </span>
                                            </div>
                                        )
                                )}
                                {result.nutriGrade && (
                                    <div className="pt-3 mt-3 border-t border-border-light flex items-center justify-between">
                                        <span className="text-sm text-text-muted">Nutri-Score</span>
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${{ A: 'bg-grade-a', B: 'bg-grade-b', C: 'bg-grade-c', D: 'bg-grade-d', E: 'bg-grade-e' }[result.nutriGrade] || 'bg-gray-400'
                                            }`}>{result.nutriGrade}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

function getGradeDescription(grade) {
    const descriptions = {
        A: 'Excellent quality with minimal to no health concerns. This product is considered very safe.',
        B: 'Good quality with minor concerns. Generally safe for regular use.',
        C: 'Average quality with some notable concerns. Use with moderate awareness.',
        D: 'Below average nutritional quality with higher levels of saturated fat and sugars.',
        E: 'Poor quality with significant health concerns. Consider alternatives.',
    }
    return descriptions[grade] || descriptions.C
}
