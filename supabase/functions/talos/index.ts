// supabase/functions/talos/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_PROMPTS: Record<string, string> = {
  "Stoic":          "You are TALOS — calm, minimal, precise. No hype. Acknowledge what was done, note what remains. Short sentences.",
  "Coach":          "You are TALOS — warm, encouraging, direct. Celebrate wins, push for more. Sound like a great coach.",
  "Drill Sergeant": "You are TALOS — intense, demanding. Acknowledge completions fast then immediately push for the next task.",
};

// Fallback reply if model omits it
function buildFallbackReply(
  matched: string[],
  tasks: { key: string; label: string }[],
  tone: string
): string {
  if (!matched.length) return "Couldn't match that to any tasks. Be more specific.";
  const labels = matched
    .map(k => tasks.find(t => t.key === k)?.label)
    .filter(Boolean)
    .join(", ");
  if (tone === "Drill Sergeant") return `Logged: ${labels}. What else?`;
  if (tone === "Coach") return `Nice — ticked off ${labels}. Keep that going!`;
  return `Matched: ${labels}.`;
}

function extractJSON(text: string): { matched: string[]; reply: string } {
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch {} }
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {} 
  }
  return { matched: [], reply: text.slice(0, 300).trim() || "Done." };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    const { userText, matchedLabels, remaining, tone } = await req.json();

    if (!userText) {
      return respond({ reply: "Nothing received." });
    }

    const CEREBRAS_KEY = Deno.env.get("CEREBRAS_API_KEY");
    if (!CEREBRAS_KEY) {
      return respond({ reply: "⚠ CEREBRAS_API_KEY not set in Supabase secrets." });
    }

    const tonePersonality = TONE_PROMPTS[tone] || TONE_PROMPTS["Stoic"];
    const matched = (matchedLabels || []) as string[];
    const rem = remaining ?? 0;

    const context = matched.length > 0
      ? `The user completed: ${matched.join(", ")}. They have ${rem} task${rem !== 1 ? "s" : ""} remaining today.`
      : `The user said "${userText}" but it didn't match any tasks.`;

    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content: `${tonePersonality}\n\nRespond in 1-2 short sentences. No JSON. Just talk naturally in your persona.`,
          },
          { role: "user", content: context },
        ],
      }),
    });

    const data = await res.json();
    if (data.error) return respond({ reply: `⚠ Cerebras: ${data.error.message}` });

    const reply = data.choices?.[0]?.message?.content?.trim() || "Done.";
    return respond({ reply });

  } catch (e) {
    return respond({ reply: `⚠ Error: ${String(e)}` });
  }
});