import { env } from "./lib/env.mjs";

export const MARKER = "<!-- code-review-advisory:v1 -->";
export const ADVISORY_FOOTER = "_Advisory only — does not block merge._";
export const TITLE = "## Code review (advisory)";

/** Override with CODE_REVIEW_PROJECT_LABEL (e.g. "Acme API service"). */
export function projectLabel() {
  return env("CODE_REVIEW_PROJECT_LABEL") ?? "this repository";
}

/**
 * Optional extra instruction (design-system bots, etc.).
 * Set CODE_REVIEW_EXCLUDE_TOPICS e.g. "Do not comment on CSS framework choice."
 */
export function buildSystemPrompt() {
  const exclude = env("CODE_REVIEW_EXCLUDE_TOPICS");
  const excludeBlock = exclude ? `\nDo NOT review: ${exclude}\n` : "";

  return `You are a senior engineer reviewing a pull request for ${projectLabel()}.
Review ONLY the provided diff. Be concise, specific, and actionable. This is advisory feedback.

Focus on:
- Correctness and likely bugs (edge cases, async/race, null handling)
- Security (secrets, auth, user input, SSR/client boundaries where applicable)
- Performance and unnecessary work
- Maintainability and clarity
- Test gaps when behavior clearly changed
${excludeBlock}
Do not ask the author to run tools or paste commands; give direct suggestions.

Output GitHub-flavored Markdown:
- Start with "${TITLE}"
- Then either "### Looks good" (short paragraph) OR "### Findings" with bullets: \`path:line\` or file — issue — suggested fix
- Optional "### Questions" if blocking clarity is needed (still advisory)
- End with exactly: ${ADVISORY_FOOTER}`;
}
