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

function extractJSON(text: string): { matched: string[]; reply: string } {
  // Try direct parse first
  try { return JSON.parse(text); } catch {}
  // Strip markdown fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1].trim()); } catch {} }
  // Find first { ... } block
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  // Nothing worked — return the raw text as the reply
  return { matched: [], reply: text.slice(0, 300).trim() || "Done." };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const { userText, tasks, kpis, tone } = await req.json();

    if (!userText || !tasks?.length) {
      return respond({ matched: [], reply: "No tasks found for your active challenge." });
    }

    const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_KEY) return respond({ matched: [], reply: "⚠ GEMINI_API_KEY not set." }, 500);

    const tonePersonality = TONE_PROMPTS[tone] || TONE_PROMPTS["Stoic"];
    const taskList = tasks
      .map((t: { key: string; label: string }) =>
        `key="${t.key}" label="${t.label}"${kpis?.[t.key] ? " [already done]" : ""}`)
      .join("\n");

    const prompt = `${tonePersonality}

Tasks today (keys are EXACT — copy verbatim):
${taskList}

User says: "${userText}"

You MUST respond with ONLY a raw JSON object — no markdown, no explanation, no preamble:
{"matched": ["exact_key"], "reply": "your response"}

- matched: only exact keys from the list above
- Skip [already done] tasks
- If nothing matches: {"matched": [], "reply": "..."}`;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
          },
          // Disable thinking for JSON tasks — faster + no preamble
        }),
      }
    );

    const data = await res.json();

    if (data.error) return respond({ matched: [], reply: `⚠ Gemini: ${data.error.message}` });

    const raw    = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const parsed = extractJSON(raw);

    return respond({ matched: parsed.matched || [], reply: parsed.reply || "Done." });

  } catch (e) {
    return respond({ matched: [], reply: `⚠ Error: ${String(e)}` }, 500);
  }
});