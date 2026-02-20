import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useStore from '../../store/useStore'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const { setUser, setSession, setLoading, fetchProfile } = useStore()
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        let isMounted = true

        // We use safety timeout just in case nothing fires
        const safetyTimeout = setTimeout(() => {
            if (isMounted) {
                setLoading(false)
                setInitialized(true)
            }
        }, 3000)

        // Supabase v2 fires onAuthStateChange immediately upon subscription with INITIAL_SESSION.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return

            console.log('Firebase-style Auth Event ->', event)

            if (event === 'SIGNED_OUT') {
                setUser(null)
                useStore.setState({ profile: null, session: null })
                setLoading(false)
                setInitialized(true)
                return
            }

            // Ignore failures to refresh due to being offline. Keep their local state alive!
            if (event === 'TOKEN_REFRESH_FAILED') {
                console.warn('Network offline or token expiring. Keeping user logged in locally.')
                return
            }

            if (session?.user) {
                setSession(session)
                setUser(session.user)

                // Fetch profile gracefully in the background so offline mode doesn't crash the app
                fetchProfile(session.user.id).catch(err => console.warn('Offline: Profile fetch delayed', err))

                setLoading(false)
                setInitialized(true)
            } else if (event === 'INITIAL_SESSION') {
                // If there's no session initially, they are naturally logged out
                setUser(null)
                useStore.setState({ profile: null, session: null })
                setLoading(false)
                setInitialized(true)
            }

            clearTimeout(safetyTimeout)
        })

        return () => {
            isMounted = false
            clearTimeout(safetyTimeout)
            subscription.unsubscribe()
        }
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
