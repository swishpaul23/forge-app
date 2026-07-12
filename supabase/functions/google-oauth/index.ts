// supabase/functions/google-oauth/index.ts
// Handles everything that requires the Google OAuth client secret:
// authorization-code exchange, access-token refresh, and disconnect (revoke).
// The frontend never sees the client secret — it only ever gets back a
// short-lived access_token to call the Calendar/Tasks APIs directly.
//
// Deploy:  supabase functions deploy google-oauth
// Secrets: supabase secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_URL    = "https://oauth2.googleapis.com/token";
const REVOKE_URL   = "https://oauth2.googleapis.com/revoke";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const respond = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return respond({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return respond({ error: "missing authorization" }, 401);

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Resolves auth.uid() for the RLS-scoped queries below — never trust a
  // user id passed in the request body.
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData?.user) return respond({ error: "invalid session" }, 401);
  const userId = userData.user.id;

  const CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID");
  const CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return respond({ error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in Supabase secrets" }, 500);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { action, code, redirectUri } = body as {
      action?: string;
      code?: string;
      redirectUri?: string;
    };

    // ── Authorization code → tokens ──────────────────────────────────
    if (action === "exchange") {
      if (!code || !redirectUri) return respond({ error: "missing code or redirectUri" }, 400);

      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) {
        return respond({ error: tokenData.error_description || tokenData.error || "token exchange failed" }, 400);
      }

      const { access_token, refresh_token, expires_in } = tokenData;
      if (!access_token) return respond({ error: "no access_token returned" }, 400);

      // Google only sends a refresh_token on first consent, or when the
      // request forces the consent screen (prompt=consent, which connect()
      // always sets) — fall back to the previously stored one otherwise.
      let finalRefreshToken: string | undefined = refresh_token;
      if (!finalRefreshToken) {
        const { data: existing } = await sb
          .from("google_tokens")
          .select("refresh_token")
          .eq("user_id", userId)
          .maybeSingle();
        finalRefreshToken = existing?.refresh_token;
      }
      if (!finalRefreshToken) {
        return respond({
          error: "Google did not return a refresh token. Remove Forge's access at https://myaccount.google.com/permissions and try connecting again.",
        }, 400);
      }

      const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString();

      // Best-effort — email is only for display in Settings, never block on it.
      let email: string | null = null;
      try {
        const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
        if (infoRes.ok) email = (await infoRes.json()).email ?? null;
      } catch (_e) { /* non-fatal */ }

      const { error: upsertErr } = await sb.from("google_tokens").upsert({
        user_id: userId,
        access_token,
        refresh_token: finalRefreshToken,
        expires_at: expiresAt,
        google_email: email,
        updated_at: new Date().toISOString(),
      });
      if (upsertErr) return respond({ error: upsertErr.message }, 500);

      return respond({ email, expiresAt });
    }

    // ── Refresh an expired access token ──────────────────────────────
    if (action === "refresh") {
      const { data: row, error: rowErr } = await sb
        .from("google_tokens")
        .select("refresh_token")
        .eq("user_id", userId)
        .maybeSingle();
      if (rowErr || !row?.refresh_token) return respond({ error: "not connected" }, 400);

      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: row.refresh_token,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) {
        // Refresh token itself may have been revoked on Google's side —
        // caller treats a non-2xx here as "disconnected, prompt reconnect".
        return respond({ error: tokenData.error_description || tokenData.error || "refresh failed" }, 401);
      }

      const { access_token, expires_in } = tokenData;
      const expiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString();

      const { error: updateErr } = await sb
        .from("google_tokens")
        .update({ access_token, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (updateErr) return respond({ error: updateErr.message }, 500);

      return respond({ accessToken: access_token, expiresAt });
    }

    // ── Disconnect: revoke + delete ───────────────────────────────────
    if (action === "disconnect") {
      // Routed through the function (rather than a direct browser call to
      // Google's revoke endpoint) since that endpoint's CORS support for
      // browser requests is inconsistent — this way it's a server-to-server call.
      const { data: row } = await sb
        .from("google_tokens")
        .select("access_token")
        .eq("user_id", userId)
        .maybeSingle();

      if (row?.access_token) {
        try {
          await fetch(`${REVOKE_URL}?token=${row.access_token}`, { method: "POST" });
        } catch (_e) { /* non-fatal — still delete the local row below */ }
      }

      const { error: delErr } = await sb.from("google_tokens").delete().eq("user_id", userId);
      if (delErr) return respond({ error: delErr.message }, 500);

      return respond({ ok: true });
    }

    return respond({ error: `unknown action: ${action}` }, 400);
  } catch (e) {
    return respond({ error: String(e) }, 500);
  }
});
