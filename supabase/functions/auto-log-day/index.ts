import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get yesterday's date (since we're running at 3 AM, "yesterday" is the day that just ended)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  // Find all active challenges without a checkin for yesterday
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, user_id')
    .eq('archived', false)

  for (const ch of challenges || []) {
    // Check if checkin exists
    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('challenge_id', ch.id)
      .eq('date', dateStr)
      .maybeSingle()

    if (!existing) {
      // Auto-log with 0% (missed day)
      await supabase.from('checkins').insert({
        challenge_id: ch.id,
        date: dateStr,
        score: 0,
        completed_keys: [],
        day_mode: 'auto'  // Flag to indicate auto-logged
      })

      // Reset streak to 0
      await supabase.from('challenges').update({ streak: 0 }).eq('id', ch.id)
    }
  }

  return new Response('OK', { status: 200 })
})