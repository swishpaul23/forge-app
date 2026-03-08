// Runs every hour via pg_cron
// Finds users whose preferred check-in hour matches now AND haven't logged today
// Deploy as: supabase/functions/daily-reminder/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../send-push/index.ts";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const FALLBACK_HOUR = 20; // 8pm if fewer than 3 check-ins recorded
const MIN_SAMPLES   = 3;  // minimum check-ins before smart timing kicks in

function smartHour(checkinHours: number[]): number {
  if (!checkinHours || checkinHours.length < MIN_SAMPLES) return FALLBACK_HOUR;
  // Average of last 14 entries, rounded
  const recent = checkinHours.slice(-14);
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
}

Deno.serve(async () => {
  const nowHour = new Date().getUTCHours();
  const todayStr = new Date().toISOString().split("T")[0];

  // Get all users with notifications enabled
  const { data: prefs } = await sb
    .from("notification_prefs")
    .select("user_id, timing_mode, manual_hour, daily_reminder, checkin_hours")
    .eq("enabled", true)
    .eq("daily_reminder", true);

  if (!prefs?.length) return new Response("no prefs", { status: 200 });

  // Filter to users whose preferred hour = nowHour
  const due = prefs.filter(p => {
    const preferred = p.timing_mode === "manual"
      ? p.manual_hour
      : smartHour(p.checkin_hours || []);
    return preferred === nowHour;
  });

  if (!due.length) return new Response("none due", { status: 200 });

  // Exclude users who already checked in today
  const userIds = due.map(p => p.user_id);
  const { data: alreadyLogged } = await sb
    .from("checkins")
    .select("challenge_id, date, challenges!inner(user_id)")
    .eq("date", todayStr)
    .in("challenges.user_id", userIds);

  const loggedIds = new Set((alreadyLogged || []).map((c: any) => c.challenges.user_id));
  const toNotify  = due.filter(p => !loggedIds.has(p.user_id));

  // Fetch their push subscriptions and send
  let sent = 0;
  for (const pref of toNotify) {
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("user_id", pref.user_id);

    for (const sub of subs || []) {
      try {
        await sendPush(sub, {
          title: "⚡ Forge — Log your day",
          body:  "Your streak is waiting. Don't let today be the miss.",
          url:   "/",
        });
        sent++;
      } catch (e) {
        console.error("push failed:", e);
      }
    }
  }

  return new Response(JSON.stringify({ checked: due.length, notified: toNotify.length, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
