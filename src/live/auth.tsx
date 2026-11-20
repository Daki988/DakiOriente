import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Role } from './supabase'

export type Profile = { id: string; full_name: string; phone: string | null; role: Role; is_active: boolean }

type AuthCtx = {
  ready: boolean
  session: Session | null
  profile: Profile | null
  role: Role | null
  /** Le profil n'a pas pu être chargé (réseau) : l'écran propose de réessayer */
  profileError: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ ready: !supabase, session: null, profile: null, role: null, profileError: false, refresh: async () => {}, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(!supabase)
  const [profileError, setProfileError] = useState(false)

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) return setProfile(null)
    const { data, error } = await supabase.from('profiles').select('id, full_name, phone, role, is_active').eq('id', s.user.id).maybeSingle()
    setProfileError(!!error)
    if (!error) setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        setSession(data.session)
        await loadProfile(data.session)
      })
      .finally(() => setReady(true))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      // Différé : ne pas appeler Supabase depuis le rappel lui-même
      setTimeout(() => loadProfile(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  return (
    <Ctx.Provider
      value={{
        ready,
        session,
        profile,
        role: profile?.role ?? null,
        profileError,
        refresh: () => loadProfile(session),
        signOut: async () => {
          await supabase?.auth.signOut()
          setProfile(null)
          // Rien de personnel ne reste sur l'appareil après la déconnexion
          try {
            for (const k of Object.keys(localStorage)) if (k.startsWith('neam:')) localStorage.removeItem(k)
          } catch {
            /* stockage indisponible */
          }
        },
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
