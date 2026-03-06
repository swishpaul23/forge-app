import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile, upsertProfile } from '../lib/db'

export function useAuth() {
  const [session,  setSession]  = useState(undefined)
  const [profile,  setProfile]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId || !supabase) { setProfile(null); return }
    try { setProfile(await getProfile(userId)) }
    catch (e) { console.warn('Profile load error:', e) }
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      loadProfile(s?.user?.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      loadProfile(s?.user?.id)
    })
    return () => subscription.unsubscribe()
  }, [loadProfile])

  const saveProfile = useCallback(async (updates) => {
    if (!session?.user?.id || !supabase) return
    const updated = await upsertProfile(session.user.id, updates)
    setProfile(updated)
    return updated
  }, [session])

  return {
    session,
    user:     session?.user ?? null,
    profile,
    loading,
    saveProfile,
    isAuthed: !!session,
  }
}
