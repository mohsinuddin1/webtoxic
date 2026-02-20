import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useStore = create((set, get) => ({
    // Auth state
    user: null,
    profile: null,
    session: null,
    loading: true,

    // Scan state
    scanResult: null,
    isAnalyzing: false,
    scanHistory: [],

    // UI state
    hasSeenOnboarding: localStorage.getItem('purescan_onboarded') === 'true',

    // Auth actions
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setLoading: (loading) => set({ loading }),

    setOnboarded: () => {
        localStorage.setItem('purescan_onboarded', 'true')
        set({ hasSeenOnboarding: true })
    },

    fetchProfile: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error && error.code === 'PGRST116') {
                // Profile doesn't exist, create it
                const { data: newProfile, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: userId,
                        email: get().user?.email,
                        daily_scans: 0,
                        current_streak: 0,
                        level_xp: 0,
                        is_pro: false,
                    })
                    .select()
                    .single()

                if (createError) throw createError
                set({ profile: newProfile })
                return newProfile
            }

            if (error) throw error

            // Reset daily scans if new day
            const today = new Date().toISOString().split('T')[0]
            if (data.last_scan_date !== today) {
                const { data: updated } = await supabase
                    .from('users')
                    .update({ daily_scans: 0, last_scan_date: today })
                    .eq('id', userId)
                    .select()
                    .single()
                set({ profile: updated || { ...data, daily_scans: 0 } })
                return updated || { ...data, daily_scans: 0 }
            }

            set({ profile: data })
            return data
        } catch (err) {
            console.error('Error fetching profile:', err)
            return null
        }
    },

    // Scan actions
    canScan: () => {
        const { profile } = get()
        if (!profile) return true // Allow scanning while profile is loading
        if (profile.is_pro) return true
        return (profile.daily_scans || 0) < 3
    },

    getRemainingScans: () => {
        const { profile } = get()
        if (!profile) return 0
        if (profile.is_pro) return Infinity
        return Math.max(0, 3 - (profile.daily_scans || 0))
    },

    setScanResult: (result) => set({ scanResult: result }),
    setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

    incrementScan: async () => {
        const { profile, user } = get()
        if (!profile || !user) return

        const today = new Date().toISOString().split('T')[0]
        const newCount = (profile.daily_scans || 0) + 1
        const newXp = (profile.level_xp || 0) + 10

        // Update streak
        let newStreak = profile.current_streak || 0
        if (profile.last_scan_date !== today) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]
            newStreak = profile.last_scan_date === yesterdayStr ? newStreak + 1 : 1
        }

        const { data } = await supabase
            .from('users')
            .update({
                daily_scans: newCount,
                last_scan_date: today,
                current_streak: newStreak,
                level_xp: newXp,
            })
            .eq('id', user.id)
            .select()
            .single()

        if (data) set({ profile: data })
    },

    saveScan: async (scanData) => {
        const { user } = get()
        if (!user) return null

        const { data, error } = await supabase
            .from('scans')
            .insert({
                user_id: user.id,
                image_url: scanData.imageUrl,
                product_name: scanData.productName,
                ingredients: scanData.ingredients,
                harmful_chemicals: scanData.harmfulChemicals,
                grade: scanData.grade,
                score: scanData.score,
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving scan:', error)
            return null
        }

        return data
    },

    fetchScanHistory: async () => {
        const { user } = get()
        if (!user) return

        const { data } = await supabase
            .from('scans')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50)

        set({ scanHistory: data || [] })
    },

    // Sign out
    signOut: async () => {
        // Clear local state immediately for UI responsiveness
        set({ user: null, profile: null, session: null, scanHistory: [] })
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error signing out:', error)
        }
    },
}))

export default useStore
