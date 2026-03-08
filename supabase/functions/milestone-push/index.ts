// DB webhook: fires on INSERT/UPDATE to checkins
// Checks for milestone thresholds and fires once per milestone
// Deploy as: supabase/functions/milestone-push/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../send-push/index.ts";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const STREAK_MILESTONES: Record<number, string> = {
  3:  "3-day streak 🔥 You're building something real.",
  7:  "7 days straight. One week of not quitting.",
  14: "Two weeks. Habit is forming.",
  30: "30 days. You said you would. You did.",
  75: "75 days. You finished. That's rare.",
};

Deno.serve(async (req) => {
  const { record } = await req.json();
  const challengeId = record.challenge_id;

  // Get challenge + user
  const { data: challenge } = await sb
    .from("challenges")
    .select("user_id, streak, day_num, total_days, name")
    .eq("id", challengeId)
    .maybeSingle();

  if (!challenge) return new Response("no challenge", { status: 200 });

  const userId = challenge.user_id;

  // Check prefs
  const { data: prefs } = await sb
    .from("notification_prefs")
    .select("enabled, milestone_alerts, milestones_sent")
    .eq("user_id", userId)
    .maybeSingle();

  if (!prefs?.enabled || !prefs?.milestone_alerts) return new Response("opted out", { status: 200 });

  const sent: string[] = prefs.milestones_sent || [];
  const toSend: { key: string; title: string; body: string }[] = [];

  // Check streak milestones
  const streak = challenge.streak;
  for (const [days, msg] of Object.entries(STREAK_MILESTONES)) {
    const key = `streak_${days}`;
    if (streak >= Number(days) && !sent.includes(key)) {
      toSend.push({ key, title: `⚡ ${days}-day streak`, body: msg });
    }
  }

  // Check challenge completion
  const completeKey = `challenge_complete_${challengeId}`;
  if (challenge.day_num >= challenge.total_days && !sent.includes(completeKey)) {
    toSend.push({
      key:   completeKey,
      title: `🏆 ${challenge.name} — Complete`,
      body:  `${challenge.total_days} days done. You finished what you started.`,
    });
  }

  if (!toSend.length) return new Response("no new milestones", { status: 200 });

  // Mark as sent
  const newSent = [...sent, ...toSend.map(m => m.key)];
  await sb.from("notification_prefs").update({ milestones_sent: newSent }).eq("user_id", userId);

  // Fetch subs and push all milestones
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  for (const milestone of toSend) {
    for (const sub of subs || []) {
      await sendPush(sub, { title: milestone.title, body: milestone.body, url: "/" });
    }
  }

  return new Response(JSON.stringify({ fired: toSend.map(m => m.key) }), {
    headers: { "Content-Type": "application/json" },
  });
});
