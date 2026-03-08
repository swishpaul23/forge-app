// Shared VAPID push sender — import from other functions
// Deploy as: supabase/functions/send-push/index.ts

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC  = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:hello@forge.app";

// Minimal VAPID signing using Web Crypto (no npm dep needed in Deno)
async function signVapid(audience: string): Promise<string> {
  const header  = btoa(JSON.stringify({ typ:"JWT", alg:"ES256" })).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
  const now     = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({ aud: audience, exp: now + 43200, sub: VAPID_SUBJECT }))
    .replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");

  const sigInput = `${header}.${payload}`;
  // Import private key (base64url encoded raw EC key)
  const keyBytes = Uint8Array.from(atob(VAPID_PRIVATE.replace(/-/g,"+").replace(/_/g,"/")), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name:"ECDSA", namedCurve:"P-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign({ name:"ECDSA", hash:"SHA-256" }, key, new TextEncoder().encode(sigInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");

  return `${sigInput}.${sigB64}`;
}

export async function sendPush(sub: { endpoint: string; p256dh: string; auth_key: string }, payload: { title: string; body: string; url?: string }) {
  const url    = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt    = await signVapid(audience);

  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url || "/" });

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      "TTL": "86400",
    },
    body,
  });

  return res.status;
}

// HTTP handler — can also be called directly via HTTP for testing
Deno.serve(async (req) => {
  const { sub, payload } = await req.json();
  const status = await sendPush(sub, payload);
  return new Response(JSON.stringify({ status }), { headers: { "Content-Type": "application/json" } });
});
