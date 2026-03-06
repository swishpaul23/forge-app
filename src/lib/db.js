import { supabase } from './supabase'

// ─── Profiles ────────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function upsertProfile(userId, updates) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, updated_at: new Date().toISOString(), ...updates })
    .select().single()
  if (error) throw error
  return data
}

// ─── Challenges ──────────────────────────────────────────────

export async function getChallenges(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('challenges')
    .select('*, challenge_tasks(*)')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createChallenge(userId, challenge) {
  if (!supabase) return null
  const { tasks, ...cd } = challenge
  const { data: ch, error: chErr } = await supabase
    .from('challenges')
    .insert({
      user_id: userId, name: cd.name, tag: cd.tag || 'CUSTOM',
      total_days: cd.totalDays, day_num: 1, streak: 0, consistency: 100,
      color: cd.color || '#9A9690', mission: cd.mission || null,
      is_main: cd.isMain || false, archived: false,
    })
    .select().single()
  if (chErr) throw chErr
  if (tasks?.length) {
    const { error: tErr } = await supabase.from('challenge_tasks').insert(
      tasks.map((t, i) => ({
        challenge_id: ch.id, key: t.key || `task_${i}`,
        label: t.label, cat: t.cat || 'other',
        non_neg: t.nonNeg || false, sort_order: i,
      }))
    )
    if (tErr) throw tErr
  }
  return ch
}

export async function updateChallengeTasks(challengeId, tasks) {
  if (!supabase) return
  await supabase.from('challenge_tasks').delete().eq('challenge_id', challengeId)
  if (tasks.length) {
    await supabase.from('challenge_tasks').insert(
      tasks.map((t, i) => ({
        challenge_id: challengeId, key: t.key || `task_${i}`,
        label: t.label, cat: t.cat || 'other',
        non_neg: t.nonNeg || false, sort_order: i,
      }))
    )
  }
}

export async function getCompletedChallenges(userId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('challenges').select('*')
    .eq('user_id', userId).eq('archived', true)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
  if (error) throw error
  return data || []
}
