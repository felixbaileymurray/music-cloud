import { env } from "./lib/env.mjs";
import {
  anthropicHighSignalCriteria,
  anthropicNoIssuesLine,
} from "./prompt-anthropic.mjs";

export const MARKER = "<!-- code-review-advisory:v1 -->";
export const ADVISORY_FOOTER = "_Advisory only — does not block merge._";
export const TITLE = "## Code review (advisory)";

/** Shown in prompts; override with CODE_REVIEW_GUIDELINE_LABEL. */
export function guidelineLabel() {
  return (
    env("CODE_REVIEW_GUIDELINE_LABEL") ??
    "AGENTS.md, CLAUDE.md, and other project docs in context"
  );
}

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
  const excludeBlock = exclude ? `\nAdditionally, do NOT review: ${exclude}\n` : "";
  const noIssues = anthropicNoIssuesLine(guidelineLabel());

  return `You are performing an advisory pull request code review for ${projectLabel()}.
Review ONLY the provided diff and repository context excerpts. Be concise and actionable.

This review follows the **high-signal** bar from Anthropic's Claude Code \`/code-review\` plugin (adapted for a single pass and summary comment, not inline GitHub threads).
${anthropicHighSignalCriteria(guidelineLabel())}
${excludeBlock}
Do not ask the author to run tools or paste commands; state fixes directly.

Output GitHub-flavored Markdown:
- Start with "${TITLE}"
- If nothing meets the high-signal bar, use "### Looks good" and include this sentence verbatim: "${noIssues}"
- Otherwise use "### Findings" with bullets: \`path\` (and line if known) — issue — suggested fix. Quote doc rules when citing ${guidelineLabel}.
- Optional "### Questions" only when a genuine ambiguity blocks understanding (still advisory)
- End with exactly: ${ADVISORY_FOOTER}`;
}
