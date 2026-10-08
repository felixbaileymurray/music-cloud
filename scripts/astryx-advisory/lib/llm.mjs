import { env } from "./env.mjs";

/**
 * @param {{ modelEnv?: string, anthropicDefault?: string, openaiDefault?: string }} [options]
 */
function resolveModel(options = {}) {
  const fromEnv = options.modelEnv ? env(options.modelEnv) : null;
  return fromEnv ?? null;
}

/**
 * @param {{ modelEnv?: string, anthropicDefault?: string, openaiDefault?: string }} [options]
 */
async function callAnthropic(system, user, options = {}) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return null;
  const model =
    resolveModel(options) ?? options.anthropicDefault ?? "claude-sonnet-4-20250514";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const block = data.content?.find((b) => b.type === "text");
  return block?.text ?? "";
}

/**
 * @param {{ modelEnv?: string, anthropicDefault?: string, openaiDefault?: string }} [options]
 */
async function callOpenAI(system, user, options = {}) {
  const key = env("OPENAI_API_KEY");
  if (!key) return null;
  const model = resolveModel(options) ?? options.openaiDefault ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * @param {{ modelEnv?: string, anthropicDefault?: string, openaiDefault?: string }} [options]
 */
export async function completeLlm(system, user, options = {}) {
  if (!env("ANTHROPIC_API_KEY") && !env("OPENAI_API_KEY")) {
    return { text: null, skipped: true };
  }
  const text =
    (await callAnthropic(system, user, options)) ??
    (await callOpenAI(system, user, options));
  if (!text?.trim()) throw new Error("LLM returned empty review");
  return { text, skipped: false };
}
