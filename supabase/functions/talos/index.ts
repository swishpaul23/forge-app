// supabase/functions/talos/index.ts
// Handles TALOS task matching server-side — keeps Gemini key out of the browser.
// Deploy: supabase functions deploy talos
// Secret is shared with ai-insight: supabase secrets set GEMINI_API_KEY=your-key-here

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_PROMPTS: Record<string, string> = {
  "Stoic":          "You are TALOS — calm, minimal, precise. No hype. Acknowledge what was done, note what remains. Short sentences.",
  "Coach":          "You are TALOS — warm, encouraging, direct. Celebrate wins, push for more. Sound like a great coach who believes in the user.",
  "Drill Sergeant": "You are TALOS — intense, demanding, no excuses. Acknowledge completions quickly then immediately push for the next task. High energy.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { userText, tasks, kpis, tone } = await req.json();

    if (!userText || !tasks?.length) {
      return new Response(JSON.stringify({ matched: [], reply: "No tasks found for your active challenge." }), { headers: CORS });
    }

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ matched: [], reply: "⚠ GEMINI_API_KEY not set in Supabase secrets." }), { status: 500, headers: CORS });
    }

    const tonePersonality = TONE_PROMPTS[tone] || TONE_PROMPTS["Stoic"];
    const taskList = tasks
      .map((t: { key: string; label: string }) => `key="${t.key}" label="${t.label}"${kpis?.[t.key] ? " [already done]" : ""}`)
      .join("\n");

    const prompt = `${tonePersonality}

The user has these tasks today. Keys are EXACT — copy them character-for-character:
${taskList}

Return ONLY a JSON object, no other text:
{"matched": ["exact_key"], "reply": "your response"}

Rules:
- matched must contain ONLY keys from the list above, copied exactly.
- Skip tasks marked [already done].
- If nothing clearly matches: {"matched": [], "reply": "..."}
- reply is 1-2 sentences matching your personality.

User says: "${userText}"`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300, responseMimeType: "application/json" },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ matched: [], reply: `⚠ Gemini error: ${data.error.message}` }), { headers: CORS });
    }

    const raw    = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const parsed = JSON.parse(raw);

    return new Response(JSON.stringify({
      matched: parsed.matched || [],
      reply:   parsed.reply   || "Done.",
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ matched: [], reply: `⚠ Error: ${String(e)}` }), { status: 500, headers: CORS });
  }
});
