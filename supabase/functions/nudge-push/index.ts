// DB webhook: fires on INSERT to partner_messages where type='nudge'
// Deploy as: supabase/functions/nudge-push/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPush } from "../send-push/index.ts";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const { record } = await req.json(); // Supabase DB webhook payload

  // Only fire on nudge messages
  if (record.type !== "nudge") return new Response("skip", { status: 200 });

  const recipientId = record.to_user_id;
  const senderId    = record.from_user_id;

  // Check recipient has nudge alerts enabled
  const { data: prefs } = await sb
    .from("notification_prefs")
    .select("enabled, nudge_alerts")
    .eq("user_id", recipientId)
    .maybeSingle();

  if (!prefs?.enabled || !prefs?.nudge_alerts) return new Response("opted out", { status: 200 });

  // Get sender name
  const { data: sender } = await sb
    .from("profiles")
    .select("full_name")
    .eq("id", senderId)
    .maybeSingle();

  const senderName = sender?.full_name?.split(" ")[0] || "Your partner";

  // Send to all recipient devices
  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", recipientId);

  for (const sub of subs || []) {
    await sendPush(sub, {
      title: `🔥 ${senderName} sent you a nudge`,
      body:  "They're watching. Go log your day.",
      url:   "/?page=partners",
    });
  }

  return new Response("ok", { status: 200 });
});
