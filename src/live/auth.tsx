import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LIVE, supabase, type Role } from './supabase'

export type Profile = { id: string; full_name: string; phone: string | null; role: Role; is_active: boolean }

type AuthCtx = {
  ready: boolean
  session: Session | null
  profile: Profile | null
  role: Role | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({ ready: !LIVE, session: null, profile: null, role: null, refresh: async () => {}, signOut: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [ready, setReady] = useState(!LIVE)

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) return setProfile(null)
    const { data } = await supabase.from('profiles').select('id, full_name, phone, role, is_active').eq('id', s.user.id).maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setReady(true)
    })
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
        refresh: () => loadProfile(session),
        signOut: async () => {
          await supabase?.auth.signOut()
          setProfile(null)
        },
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
