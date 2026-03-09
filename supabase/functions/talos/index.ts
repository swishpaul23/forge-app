// supabase/functions/talos/index.ts
// Uses Cerebras (Llama 3.3 70B) — free tier, 1M tokens/day, OpenAI-compatible
// Secret: supabase secrets set CEREBRAS_API_KEY=your-key-here
// Get key: console.groq.com/keys

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
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const { userText, tasks, kpis, tone } = await req.json();

    if (!userText || !tasks?.length) {
      return respond({ matched: [], reply: "No tasks found for your active challenge." });
    }

    const CEREBRAS_KEY = Deno.env.get("CEREBRAS_API_KEY");
    if (!CEREBRAS_KEY) return respond({ matched: [], reply: "⚠ CEREBRAS_API_KEY not set in Supabase secrets." }, 500);

    const tonePersonality = TONE_PROMPTS[tone] || TONE_PROMPTS["Stoic"];
    const taskList = tasks
      .map((t: { key: string; label: string }) =>
        `key="${t.key}" label="${t.label}"${kpis?.[t.key] ? " [already done]" : ""}`)
      .join("\n");

    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${CEREBRAS_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b",
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `${tonePersonality}\n\nYou match what the user says to their task list and return JSON only.\n\nTasks today (copy keys EXACTLY):\n${taskList}\n\nRespond ONLY with: {"matched": ["exact_key"], "reply": "your response"}\n- matched: only exact keys from the list, verbatim\n- Skip [already done] tasks\n- If nothing matches: {"matched": [], "reply": "..."}`,
          },
          { role: "user", content: userText },
        ],
      }),
    });

    const data = await res.json();
    if (data.error) return respond({ matched: [], reply: `⚠ Groq: ${data.error.message}` });

    const raw    = data.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = extractJSON(raw);

    return respond({ matched: parsed.matched || [], reply: parsed.reply || "Done." });

  } catch (e) {
    return respond({ matched: [], reply: `⚠ Error: ${String(e)}` }, 500);
  }
});