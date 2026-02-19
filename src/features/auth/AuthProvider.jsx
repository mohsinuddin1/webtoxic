import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const { setUser, setSession, setLoading, fetchProfile } = useStore()
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            if (session?.user) {
                setUser(session.user)
                fetchProfile(session.user.id)
            }
            setLoading(false)
            setInitialized(true)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            if (session?.user) {
                setUser(session.user)
                await fetchProfile(session.user.id)
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            },
        })
        if (error) throw error
    }

    const signInWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signUpWithEmail = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider
            value={{
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                signOut,
                initialized,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
