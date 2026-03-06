import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Plus } from 'lucide-react'
import useStore from '../store/useStore'

const DISEASES = ['Cancer', 'Diabetes', 'Obesity', 'Asthma', 'Heart Disease', 'Eczema']
const ALLERGENS = ['Peanuts', 'Dairy', 'Gluten', 'Soy', 'Fragrance', 'Sulfates']
const HEALTH_OPTIONS = [
    { id: 'skin', label: 'Skin Health', emoji: '✨' },
    { id: 'hormonal', label: 'Hormonal Balance', emoji: '⚖️' },
    { id: 'cancer', label: 'Cancer Prevention', emoji: '🛡️' },
    { id: 'baby', label: 'Baby Safety', emoji: '👶' },
    { id: 'eco', label: 'Eco-Friendly', emoji: '🌿' },
]

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
            <Plus size={16} className="text-text-muted mr-1" />
            <input
                type="text"
                placeholder={placeholder}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={handleSubmit}
                className="bg-transparent border-none text-[14px] text-primary placeholder:text-text-muted focus:outline-none min-w-[100px]"
            />
        </div>
    )
}

export default function HealthPreferences() {
    const navigate = useNavigate()
    const { healthPreferences, setHealthPreferences } = useStore()

    const [selectedDiseases, setSelectedDiseases] = useState(healthPreferences?.diseases || [])
    const [selectedAllergies, setSelectedAllergies] = useState(healthPreferences?.allergies || [])
    const [selectedGoals, setSelectedGoals] = useState(healthPreferences?.goals || [])

    const hasChanges =
        JSON.stringify(selectedDiseases) !== JSON.stringify(healthPreferences?.diseases || []) ||
        JSON.stringify(selectedAllergies) !== JSON.stringify(healthPreferences?.allergies || []) ||
        JSON.stringify(selectedGoals) !== JSON.stringify(healthPreferences?.goals || [])

    const checkLimit = (setter, currentArray) => {
        const totalCount =
            (setter === setSelectedDiseases ? 0 : selectedDiseases.filter(x => x !== 'None').length) +
            (setter === setSelectedAllergies ? 0 : selectedAllergies.filter(x => x !== 'None').length) +
            (setter === setSelectedGoals ? 0 : selectedGoals.filter(x => x !== 'None').length) +
            currentArray.length

        if (totalCount >= 25) {
            alert('Limit Reached: You can only select a maximum of 25 health preferences completely.')
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

    const handleSave = async () => {
        try {
            await setHealthPreferences({
                diseases: selectedDiseases,
                allergies: selectedAllergies,
                goals: selectedGoals,
            })
            alert('Health preferences updated successfully.')
            navigate(-1)
        } catch (error) {
            alert('Failed to save preferences.')
        }
    }

    return (
        <div className="min-h-dvh bg-surface-muted flex flex-col max-w-[480px] mx-auto relative">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 pt-8 pb-5 bg-white border-b border-black/5">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
                >
                    <ArrowLeft size={22} className="text-text-primary" />
                </button>
                <h1 className="text-[18px] font-bold text-primary">Health Preferences</h1>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-32">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 pt-5">
                    <h2 className="text-[20px] font-extrabold text-primary mb-2">Tracked Conditions</h2>
                    <p className="text-[14px] text-text-secondary leading-snug mb-4">Select health conditions or concerns you want our AI model to cross-reference against products.</p>

                    <div className="flex flex-wrap gap-2.5">
                        {DISEASES.map(d => (
                            <SelectablePill key={d} label={d} isSelected={selectedDiseases.includes(d)} onClick={() => toggleArrayItem(setSelectedDiseases)(d)} />
                        ))}
                        {selectedDiseases.filter(s => !DISEASES.includes(s) && s !== 'None').map(custom => (
                            <SelectablePill key={custom} label={custom} isSelected={true} onClick={() => toggleArrayItem(setSelectedDiseases)(custom)} />
                        ))}
                        <CustomInputPill placeholder="Add condition..." onAdd={handleAddCustom(setSelectedDiseases)} />
                    </div>
                    <div className="mt-3">
                        <SelectablePill label="None of the above" isSelected={selectedDiseases.includes('None')} onClick={() => toggleArrayItem(setSelectedDiseases)('None', true)} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
                    <h2 className="text-[20px] font-extrabold text-primary mb-2">Allergies & Sensitivities</h2>
                    <p className="text-[14px] text-text-secondary leading-snug mb-4">Ingredients matching these allergens will be immediately flagged in red.</p>

                    <div className="flex flex-wrap gap-2.5">
                        {ALLERGENS.map(a => (
                            <SelectablePill key={a} label={a} isSelected={selectedAllergies.includes(a)} onClick={() => toggleArrayItem(setSelectedAllergies)(a)} />
                        ))}
                        {selectedAllergies.filter(s => !ALLERGENS.includes(s) && s !== 'None').map(custom => (
                            <SelectablePill key={custom} label={custom} isSelected={true} onClick={() => toggleArrayItem(setSelectedAllergies)(custom)} />
                        ))}
                        <CustomInputPill placeholder="Add allergy..." onAdd={handleAddCustom(setSelectedAllergies)} />
                    </div>
                    <div className="mt-3">
                        <SelectablePill label="None" isSelected={selectedAllergies.includes('None')} onClick={() => toggleArrayItem(setSelectedAllergies)('None', true)} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                    <h2 className="text-[20px] font-extrabold text-primary mb-2">What Matters Most</h2>
                    <p className="text-[14px] text-text-secondary leading-snug mb-4">We'll personalize your scan results based on your goals.</p>

                    <div className="flex flex-wrap gap-2.5">
                        {HEALTH_OPTIONS.map((opt) => {
                            const isSelected = selectedGoals.includes(opt.id)
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleArrayItem(setSelectedGoals)(opt.id)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 transition-all duration-200 ${isSelected ? 'bg-accent/10 border-accent' : 'bg-surface-muted border-transparent'
                                        }`}
                                >
                                    <span className="text-[16px]">{opt.emoji}</span>
                                    <span className={`text-[13px] font-semibold ${isSelected ? 'text-primary' : 'text-text-secondary'}`}>{opt.label}</span>
                                    {isSelected && <CheckCircle2 size={16} className="text-accent" />}
                                </button>
                            )
                        })}
                        {selectedGoals.filter(s => !HEALTH_OPTIONS.map(h => h.id).includes(s) && s !== 'None').map(custom => (
                            <button
                                key={custom}
                                onClick={() => toggleArrayItem(setSelectedGoals)(custom)}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border-2 bg-accent/10 border-accent transition-all duration-200"
                            >
                                <span className="text-[16px]">🎯</span>
                                <span className="text-[13px] font-semibold text-primary">{custom}</span>
                                <CheckCircle2 size={16} className="text-accent" />
                            </button>
                        ))}
                        <CustomInputPill placeholder="Add custom goal..." onAdd={handleAddCustom(setSelectedGoals)} />
                    </div>
                </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-black/5 pb-[env(safe-area-inset-bottom)]">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="w-full py-4 rounded-[var(--radius-button)] font-bold text-[16px] text-white bg-primary disabled:opacity-50 disabled:bg-text-muted transition-all"
                >
                    Save Changes
                </button>
            </div>
        </div>
    )
}
