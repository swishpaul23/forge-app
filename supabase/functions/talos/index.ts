// supabase/functions/talos/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TONE_PROMPTS: Record<string, string> = {
  "Stoic":          "You are TALOS — calm, minimal, precise. No hype. Acknowledge what was done, note what remains.",
  "Coach":          "You are TALOS — warm, encouraging, direct. Celebrate wins, push for more.",
  "Drill Sergeant": "You are TALOS — intense, demanding. Acknowledge completions fast then push for the next task.",
};

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find first { ... } block
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return "{}";
}

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

Tasks today (copy keys EXACTLY as shown):
${taskList}

User says: "${userText}"

Respond with a JSON object only:
{"matched": ["exact_key"], "reply": "your response"}

- matched: only keys from the list above, verbatim
- Skip [already done] tasks
- If nothing matches: {"matched": [], "reply": "..."}`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      return new Response(JSON.stringify({ matched: [], reply: `⚠ Gemini: ${data.error.message}` }), { headers: CORS });
    }

    const raw    = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const clean  = extractJSON(raw);
    let parsed: { matched?: string[]; reply?: string } = {};
    try { parsed = JSON.parse(clean); } catch { parsed = { matched: [], reply: raw.slice(0, 200) }; }

    return new Response(JSON.stringify({
      matched: parsed.matched || [],
      reply:   parsed.reply   || "Done.",
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ matched: [], reply: `⚠ Error: ${String(e)}` }), { status: 500, headers: CORS });
  }
});
