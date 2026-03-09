// supabase/functions/ai-insight/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_VOICES: Record<string, string> = {
  "Stoic":          "Speak like Marcus Aurelius. Blunt, philosophical, no flattery. Identify what the data reveals about their discipline.",
  "Coach":          "Speak like a sharp personal coach. Warm but direct. Identify patterns and give one clear tactical suggestion.",
  "Drill Sergeant": "Speak like a no-nonsense drill sergeant. No softening. Call out what's weak and demand better.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { prompt, tone } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "missing prompt" }), { status: 400, headers: CORS });

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), { status: 500, headers: CORS });

    const voice = TONE_VOICES[tone] || TONE_VOICES["Coach"];

    const fullPrompt = `You are TALOS Insights, an embedded discipline coach in the Forge app. ${voice}

Here is the user's current data:
${prompt}

Write EXACTLY 2 sentences. No more. Rules:
- Speak directly to the user using "you"
- Reference their specific numbers (streak, consistency %, tasks)
- Do NOT mention the challenge name or mission statement
- Do NOT start with "You declare" or reference what they said they would do
- Focus only on what the data shows about their current momentum
- Stop after the 2nd sentence. Do not write a 3rd.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 },
        }),
      }
    );

    const data = await res.json();
    if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: CORS });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No insight generated.";
    return new Response(JSON.stringify({ text }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});