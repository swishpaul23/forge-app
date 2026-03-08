// supabase/functions/ai-insight/index.ts
// Generates daily insights using Gemini Flash — server-side to protect the API key.
// Deploy: supabase functions deploy ai-insight
// Secret:  supabase secrets set GEMINI_API_KEY=your-key-here

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_VOICES: Record<string, string> = {
  "Stoic":          "Speak like Marcus Aurelius. Blunt, philosophical, no flattery. Identify the gap between what they say they want and what the data shows.",
  "Coach":          "Speak like a sharp personal coach. Warm but direct. Identify patterns and give one clear tactical suggestion.",
  "Drill Sergeant": "Speak like a no-nonsense drill sergeant. No softening. Call out exactly what's weak and demand better.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { prompt, tone } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "missing prompt" }), { status: 400, headers: CORS });

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), { status: 500, headers: CORS });

    const voice = TONE_VOICES[tone] || TONE_VOICES["Coach"];
    const fullPrompt = `You are Forge Intelligence. ${voice}\n\n${prompt}\n\nWrite ONE insight. 2-3 sentences max. No preamble. Speak directly to the user. Reference their actual data.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 150 },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: CORS });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No insight generated.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});
