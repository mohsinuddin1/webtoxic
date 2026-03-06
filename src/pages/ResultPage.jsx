import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import {
    ArrowLeft,
    Share2,
    Shield,
    Leaf,
    Beaker,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    CheckSquare,
    CheckCircle2,
    FlaskConical,
    UserCircle,
    Activity,
    ShieldCheck,
    AlertCircle
} from 'lucide-react'

const TABS = ['Overview', 'Harmful', 'Ingredients', 'Macros']

const GRADE_COLORS = {
    A: 'bg-[#059669]', // Green
    B: 'bg-[#84cc16]', // Light Green
    C: 'bg-[#eab308]', // Yellow
    D: 'bg-[#f97316]', // Orange
    E: 'bg-[#ef4444]', // Red
}

function getGradeDescription(grade) {
    const descriptions = {
        A: { title: 'Excellent', desc: 'This product is very safe with minimal toxicity concerns.' },
        B: { title: 'Good', desc: 'Generally safe with minor ingredients to be aware of.' },
        C: { title: 'Moderate', desc: 'Some ingredients may pose risks. Review details below.' },
        D: { title: 'Concerning', desc: 'Contains multiple ingredients with known health risks.' },
        E: { title: 'Dangerous', desc: 'High toxicity. Several harmful chemicals detected.' },
    }
    return descriptions[grade] || descriptions.C
}

function getNutriScoreColor(score) {
    if (!score) return 'bg-gray-400'
    const s = score.toLowerCase()
    if (s === 'a') return 'bg-[#059669]'
    if (s === 'b') return 'bg-[#84cc16]'
    if (s === 'c') return 'bg-[#eab308]'
    if (s === 'd') return 'bg-[#f97316]'
    if (s === 'e') return 'bg-[#ef4444]'
    return 'bg-gray-400'
}

function getNovaColor(group) {
    if (group === 1) return 'text-[#059669]'
    if (group === 2) return 'text-[#84cc16]'
    if (group === 3) return 'text-[#eab308]'
    if (group === 4) return 'text-[#ef4444]'
    return 'text-text-muted'
}

function getNovaDescription(group) {
    if (group === 1) return 'Unprocessed/minimally processed foods'
    if (group === 2) return 'Processed culinary ingredients'
    if (group === 3) return 'Processed foods'
    if (group === 4) return 'Ultra-processed foods'
    return 'Unknown processing level'
}

function getNutrientLevelColor(level) {
    if (!level) return { bg: 'bg-transparent', text: 'text-text-muted' }
    const l = level.toLowerCase()
    if (l === 'high') return { bg: 'bg-red-500/10', text: 'text-red-500' }
    if (l === 'moderate') return { bg: 'bg-amber-500/10', text: 'text-amber-500' }
    if (l === 'low') return { bg: 'bg-green-500/10', text: 'text-green-500' }
    return { bg: 'bg-slate-500/10', text: 'text-slate-500' }
}

function getRiskPillStyle(riskLevel) {
    switch (riskLevel?.toLowerCase()) {
        case 'high':
            return { bg: 'bg-red-500/15', color: 'text-red-500', label: 'high' }
        case 'moderate':
            return { bg: 'bg-amber-500/15', color: 'text-amber-500', label: 'moderate' }
        case 'low':
            return { bg: 'bg-green-500/15', color: 'text-green-500', label: 'low' }
        case 'negligible':
            return { bg: 'bg-slate-400/15', color: 'text-slate-400', label: 'trace' }
        default:
            return { bg: 'bg-slate-400/15', color: 'text-slate-400', label: riskLevel || 'unknown' }
    }
}

function getRiskIcon(riskLevel) {
    switch (riskLevel?.toLowerCase()) {
        case 'high': return <AlertTriangle size={22} className="text-red-500 mt-[2px]" />
        case 'moderate': return <AlertCircle size={22} className="text-amber-500 mt-[2px]" />
        case 'low': return <CheckSquare size={22} className="text-green-500 mt-[2px]" />
        case 'negligible': return <CheckCircle2 size={22} className="text-slate-400 mt-[2px]" />
        default: return <AlertCircle size={22} className="text-slate-400 mt-[2px]" />
    }
}

function MinimalCard({ item, expanded, onToggle }) {
    const riskLevel = typeof item === 'string' ? 'low' : (item.riskLevel || 'low')
    const name = typeof item === 'string' ? item : (item.name || 'Unknown')
    const risk = getRiskPillStyle(riskLevel)
    const riskIcon = getRiskIcon(riskLevel)
    const statusLabel = riskLevel === 'high' ? 'Concerning' : riskLevel === 'moderate' ? 'Moderate' : item.category ? item.category.replace('_', ' ') : 'Safe'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-5 mb-3 bg-white rounded-[16px] border border-border-light shadow-sm overflow-hidden"
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center p-4 text-left"
            >
                <div>{riskIcon}</div>
                <div className="flex-1 px-3">
                    <h4 className="text-[16px] font-extrabold text-primary mb-[2px] leading-tight">{name}</h4>
                    <span className="text-[13px] text-text-secondary capitalize leading-tight">
                        {statusLabel}
                        {item.estimatedConcentration ? ` · ${item.estimatedConcentration}` : ''}
                    </span>
                </div>
                <div className={`px-2.5 py-1 rounded-full ${risk.bg}`}>
                    <span className={`text-[12px] font-extrabold lowercase ${risk.color}`}>{risk.label}</span>
                </div>
                {expanded ? (
                    <ChevronUp size={20} className="text-text-muted ml-2" />
                ) : (
                    <ChevronDown size={20} className="text-text-muted ml-2" />
                )}
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border-light"
                    >
                        <div className="p-4 pt-3 bg-white">
                            {item.explanation && (
                                <p className="text-[14px] text-text-secondary leading-[22px] mb-3">
                                    {item.explanation}
                                </p>
                            )}
                            {item.contextualNote && (
                                <div className="flex items-center gap-[6px] bg-slate-100 px-2.5 py-1.5 rounded-md w-fit mb-2">
                                    <FlaskConical size={14} className="text-text-secondary" />
                                    <span className="text-[12px] font-semibold text-text-secondary">{item.contextualNote}</span>
                                </div>
                            )}
                            {item.personalNote && (
                                <div className="flex items-center gap-[6px] bg-red-500/10 px-2.5 py-1.5 rounded-md w-fit mb-2">
                                    <UserCircle size={14} className="text-red-500" />
                                    <span className="text-[12px] font-semibold text-red-500">{item.personalNote}</span>
                                </div>
                            )}
                            {item.estimatedConcentration && (
                                <div className="flex items-center gap-[6px] bg-slate-100 px-2.5 py-1.5 rounded-md w-fit mb-2">
                                    <Activity size={14} className="text-text-secondary" />
                                    <span className="text-[12px] font-semibold text-text-secondary">Est. concentration: {item.estimatedConcentration}</span>
                                </div>
                            )}
                            {item.regulatoryStatus && (
                                <div className="flex items-center gap-[6px] bg-slate-100 px-2.5 py-1.5 rounded-md w-fit mb-2">
                                    <ShieldCheck size={14} className="text-text-secondary" />
                                    <span className="text-[12px] font-semibold text-text-secondary">{item.regulatoryStatus}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default function ResultPage() {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const [result, setResult] = useState(location.state?.result || null)
    const [imageUrl, setImageUrl] = useState(location.state?.imageUrl || null)
    const [activeTab, setActiveTab] = useState(0)
    const [expandedItems, setExpandedItems] = useState({})
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
                    productType: data.scan_type || 'food',
                    method: data.method || 'barcode',
                    nutriGrade: data.nutriscore,
                    novaGroup: data.nova_group,
                    macros: data.macros || null,
                    nutrientLevels: data.nutrient_levels || null,
                    additives: data.additives || [],
                    allergens: data.allergens || [],
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
                    onClick={() => navigate(-1)}
                    className="px-6 py-3 bg-primary text-white rounded-[var(--radius-button)] font-semibold text-sm"
                >
                    Go Back
                </button>
            </div>
        )
    }

    const grade = result.overallGrade || 'C'
    const score = result.toxicityScore || 50
    const gradeDesc = getGradeDescription(grade)
    const ingredients = result.ingredients || []
    const harmfulChemicals = result.harmfulChemicals || []
    const availableTabs = (result.productType === 'food' && result.macros) ? TABS : TABS.filter(t => t !== 'Macros')

    const getTailwindGradeTextColor = (g) => {
        const map = {
            A: 'text-[#059669]',
            B: 'text-[#84cc16]',
            C: 'text-[#eab308]',
            D: 'text-[#f97316]',
            E: 'text-[#ef4444]'
        }
        return map[g] || 'text-primary'
    }

    const handleShare = async () => {
        const productName = result.productName || 'Scanned Product'
        const text = `Check out the safety scan for ${productName} on WebToxic! Grade: ${grade}, Score: ${score}/100. ${harmfulChemicals.length} harmful chemicals found.`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'WebToxic Result',
                    text: text,
                    url: window.location.href,
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard!')
        }
    }

    const toggleExpand = (id) => {
        setExpandedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }))
    }

    return (
        <div className="min-h-dvh bg-background relative max-w-[480px] mx-auto overflow-x-hidden">
            {/* Background Image Container */}
            <div className="absolute top-0 left-0 right-0 h-[350px]">
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt={result.productName}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </>
                ) : (
                    <div className="absolute -top-[100px] -left-[100px] w-[600px] h-[600px] flex items-center justify-center">
                        <div className={`w-[600px] h-[600px] rounded-full blur-3xl opacity-10 ${GRADE_COLORS[grade] || 'bg-slate-200'} animate-pulse`} />
                    </div>
                )}
            </div>

            {/* Absolute Header */}
            <div className="absolute top-10 left-5 right-5 flex justify-between z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
                >
                    <ArrowLeft size={20} className="text-primary" />
                </button>
                <button
                    onClick={handleShare}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
                >
                    <Share2 size={20} className="text-primary" />
                </button>
            </div>

            <div className="relative z-10 w-full mb-0 pb-0 flex flex-col pt-[260px]">
                {/* Main Content Rounded Wrap */}
                <div className="bg-background rounded-t-[32px] pt-6 min-h-[600px] pb-16 flex-1 shadow-2xl">

                    {/* Title Section */}
                    <div className="items-center text-center mb-6 px-5">
                        <h1 className="text-[22px] font-extrabold text-primary mb-1">
                            {result.productName || 'Scanned Product'}
                        </h1>
                        <p className="text-[14px] text-text-secondary">WebToxic Analysis</p>
                    </div>

                    {/* Toxicity Score Re-Design */}
                    <div className="mx-5 p-5 bg-white rounded-[16px] mb-6 shadow-sm border border-border-light">
                        <h3 className="text-[11px] font-extrabold text-text-secondary tracking-[1.5px] uppercase mb-3 text-left">
                            {result.productType === 'cosmetic' ? 'TOXICITY-SCORE' : 'NUTRI-SCORE'}
                        </h3>
                        <div className="flex gap-1.5 mb-4">
                            {['A', 'B', 'C', 'D', 'E'].map(g => {
                                const isActive = g === grade;
                                return (
                                    <div
                                        key={g}
                                        className={`flex-1 h-11 rounded-lg flex items-center justify-center transition-all duration-300 ${GRADE_COLORS[g]} ${isActive ? 'opacity-100 scale-[1.15] shadow-lg z-10' : 'opacity-35'
                                            }`}
                                    >
                                        <span className={`font-black text-white ${isActive ? 'text-[22px]' : 'text-[18px]'}`}>
                                            {g}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="text-[14px] text-text-secondary leading-[22px] text-left">
                            {gradeDesc.desc}
                        </p>
                    </div>

                    {/* Instant Open Data Badges (Food Only) */}
                    {result.productType === 'food' && (result.nutriGrade || result.novaGroup) && (
                        <div className="flex gap-2.5 mx-5 mb-6">
                            {result.nutriGrade && (
                                <div className="flex-1 flex gap-3 p-3 rounded-[16px] items-center bg-[#fffdf6] border border-yellow-500/30 shadow-sm">
                                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${getNutriScoreColor(result.nutriGrade)}`}>
                                        <span className="text-[22px] font-black text-white">{result.nutriGrade.toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 justify-center">
                                        <span className="text-[13px] font-bold text-primary leading-tight">Nutri-Score {result.nutriGrade.toUpperCase()}</span>
                                    </div>
                                </div>
                            )}
                            {result.novaGroup && (
                                <div className="flex-[1.2] flex gap-3 p-3 rounded-[16px] items-center bg-[#fff5f5] border border-red-500/30 shadow-sm">
                                    <div className="w-11 h-11 rounded flex flex-col items-center pt-1 bg-red-500">
                                        <span className="text-[8px] font-extrabold text-white mb-0.5">NOVA</span>
                                        <div className="flex-1 w-full flex items-center justify-center">
                                            <span className="text-[20px] font-black text-white leading-none">{result.novaGroup}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 justify-center">
                                        <span className={`text-[13px] font-bold ${getNovaColor(result.novaGroup)} leading-tight line-clamp-2`}>
                                            {getNovaDescription(result.novaGroup)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tabs Row */}
                    <div className="flex mx-5 mb-4 bg-surface-muted rounded-full p-1">
                        {availableTabs.map((tab, i) => {
                            const originalIndex = TABS.indexOf(tab);
                            const isActive = activeTab === originalIndex;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(originalIndex)}
                                    className={`flex-1 py-2.5 text-[13px] font-bold rounded-full transition-all ${isActive
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-text-muted'
                                        }`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 0 && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-0"
                            >
                                {/* Summary Grid */}
                                <div className="flex gap-2.5 mx-5 mb-4">
                                    <div className="flex-1 p-4 bg-white rounded-[16px] border border-border-light shadow-sm text-center">
                                        <p className="text-[22px] font-black text-primary leading-none">{ingredients.length}</p>
                                        <p className="text-[10px] text-text-muted mt-1">Total Ingredients</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-white rounded-[16px] border border-border-light shadow-sm text-center">
                                        <p className="text-[22px] font-black text-red-500 leading-none">{harmfulChemicals.length}</p>
                                        <p className="text-[10px] text-text-muted mt-1">Harmful Found</p>
                                    </div>
                                    <div className="flex-1 p-4 bg-white rounded-[16px] border border-border-light shadow-sm text-center">
                                        <p className={`text-[22px] font-black leading-none ${getTailwindGradeTextColor(grade)}`}>{grade}</p>
                                        <p className="text-[10px] text-text-muted mt-1">Safety Grade</p>
                                    </div>
                                </div>

                                {/* Quick harmful list */}
                                {harmfulChemicals.length > 0 && (
                                    <div className="mb-4 pt-2">
                                        <h3 className="px-5 text-[16px] font-extrabold text-primary mb-3">⚠️ Chemicals of Concern</h3>
                                        {harmfulChemicals.slice(0, 5).map((chem, i) => (
                                            <MinimalCard
                                                key={`quick-${chem.name || i}-${i}`}
                                                item={chem}
                                                expanded={expandedItems[`quick-${i}`]}
                                                onToggle={() => toggleExpand(`quick-${i}`)}
                                            />
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleShare}
                                    className="flex items-center justify-center gap-2 bg-primary py-3.5 mx-5 mb-5 rounded-[var(--radius-button)] shadow-md hover:bg-primary/90 transition-colors w-[calc(100%-40px)]"
                                >
                                    <Share2 size={20} className="text-white" />
                                    <span className="text-[16px] font-extrabold text-white">Share Result Ticket</span>
                                </button>
                            </motion.div>
                        )}

                        {activeTab === 1 && (
                            <motion.div
                                key="harmful"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {harmfulChemicals.length === 0 ? (
                                    <div className="flex flex-col items-center py-10">
                                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                            <ShieldCheck size={40} className="text-green-500" />
                                        </div>
                                        <p className="text-[16px] font-bold text-primary mt-2">No harmful chemicals detected!</p>
                                        <p className="text-[13px] text-text-secondary mt-1">This product appears to be safe.</p>
                                    </div>
                                ) : (
                                    <>
                                        {harmfulChemicals.map((chem, i) => (
                                            <MinimalCard
                                                key={`detail-${chem.name || i}-${i}`}
                                                item={chem}
                                                expanded={expandedItems[`detail-${i}`]}
                                                onToggle={() => toggleExpand(`detail-${i}`)}
                                            />
                                        ))}
                                        <p className="text-[11px] text-text-muted text-center mx-8 mt-3 mb-5 leading-normal">
                                            Note: The dosage and risk calculations provided are estimations and do not substitute professional safety or medical advice. Acceptable daily intake varies.
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 2 && (
                            <motion.div
                                key="ingredients"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {ingredients.length === 0 ? (
                                    <div className="flex flex-col items-center py-10">
                                        <p className="text-[16px] font-bold text-primary mt-2">No ingredients parsed</p>
                                    </div>
                                ) : (
                                    <>
                                        {ingredients.map((ing, i) => (
                                            <MinimalCard
                                                key={`ing-${(ing.name || ing) || i}-${i}`}
                                                item={ing}
                                                expanded={expandedItems[`ing-${i}`]}
                                                onToggle={() => toggleExpand(`ing-${i}`)}
                                            />
                                        ))}
                                    </>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 3 && result.macros && (
                            <motion.div
                                key="macros"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <div className="flex flex-wrap gap-3 mx-5 pb-5">
                                    {[
                                        { label: 'Calories', value: result.macros?.calories, unit: 'kcal', level: null },
                                        { label: 'Protein', value: result.macros?.protein, unit: 'g', level: null },
                                        { label: 'Carbs', value: result.macros?.carbs, unit: 'g', level: null },
                                        { label: 'Sugar', value: result.macros?.sugar, unit: 'g', level: result.nutrientLevels?.sugars },
                                        { label: 'Fats', value: result.macros?.fats, unit: 'g', level: result.nutrientLevels?.fat },
                                        { label: 'Sat Fat', value: result.macros?.saturatedFat, unit: 'g', level: result.nutrientLevels?.['saturated-fat'] },
                                        { label: 'Salt', value: result.macros?.salt, unit: 'g', level: result.nutrientLevels?.salt },
                                        { label: 'Fiber', value: result.macros?.fiber, unit: 'g', level: null },
                                    ].filter(m => m.value != null).map((m, i) => {
                                        const nutColor = getNutrientLevelColor(m.level);
                                        return (
                                            <div key={m.label} className="w-[calc(50%-6px)] p-4 bg-white rounded-[16px] border border-border-light flex flex-col items-center">
                                                <p className="text-[18px] font-extrabold text-primary">
                                                    {m.value} <span className="text-[12px] font-semibold">{m.unit}</span>
                                                </p>
                                                <p className="text-[13px] font-semibold text-text-secondary mt-1">{m.label}</p>
                                                {m.level && (
                                                    <div className={`mt-2 px-2 py-0.5 rounded ${nutColor.bg}`}>
                                                        <span className={`text-[10px] font-extrabold uppercase ${nutColor.text}`}>
                                                            {m.level}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {result.additives && result.additives.length > 0 && (
                                    <div className="mx-5 mt-2 pb-5">
                                        <h3 className="text-[16px] font-extrabold text-primary mb-3">Additives & Tags Detected</h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {result.additives.map((tag, i) => (
                                                <div key={i} className="bg-surface-muted px-3 py-1.5 rounded-full border border-border-light">
                                                    <span className="text-[12px] font-bold text-text-secondary">{tag.replace('en:', '').toUpperCase()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-text-muted text-center leading-normal">
                                            These additives are evaluated in the AI toxicity score.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    )
}
