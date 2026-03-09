// supabase/functions/ai-insight/index.ts
// Uses Cerebras (Llama 3.3 70B) — free tier, 1M tokens/day, OpenAI-compatible
// Secret: supabase secrets set CEREBRAS_API_KEY=your-key-here

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

// Guarantee no mid-sentence cutoff — extract first 2 complete sentences
function twoSentences(text: string): string {
  const matches = text.match(/[^.!?]*[.!?]+/g);
  if (!matches || matches.length === 0) return text.trim();
  return matches.slice(0, 2).join(" ").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { prompt, tone } = await req.json();
    if (!prompt) return new Response(JSON.stringify({ error: "missing prompt" }), { status: 400, headers: CORS });

    const CEREBRAS_KEY = Deno.env.get("CEREBRAS_API_KEY");
    if (!CEREBRAS_KEY) return new Response(JSON.stringify({ error: "CEREBRAS_API_KEY not set" }), { status: 500, headers: CORS });

    const voice = TONE_VOICES[tone] || TONE_VOICES["Coach"];

    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: `You are TALOS Insights, an embedded discipline coach in the Forge app. ${voice}\n\nWrite exactly 2 sentences about the user's momentum based only on their stats. Speak directly using "you". Do not mention the challenge name or mission. Reference specific numbers. Stop after the 2nd sentence.`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await res.json();
    if (data.error) return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: CORS });

    const raw  = data.choices?.[0]?.message?.content?.trim() || "No insight generated.";
    const text = twoSentences(raw);

    return new Response(JSON.stringify({ text }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: CORS });
  }
});