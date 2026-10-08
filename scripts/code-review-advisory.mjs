#!/usr/bin/env node
/**
 * General advisory code review at PR time (Layer 3, separate from Astryx design-system review).
 * Provider-agnostic: Anthropic or OpenAI via the same prompt (Claude Code /code-review–style scope).
 *
 * Local dry-run:
 *   BASE=origin/dev HEAD=HEAD node scripts/code-review-advisory.mjs --dry-run
 */

import {
  appendStepSummary,
  changedFileList,
  completeAdvisoryLlm,
  env,
  gitDiff,
  isOnlyLowSignalChanges,
  prCommentWithMarkerExists,
  readRepoContext,
  upsertPrComment,
} from "./lib/pr-advisory-common.mjs";

const MARKER = "<!-- code-review-advisory:v1 -->";
const MAX_DIFF_CHARS = 56_000;
const ADVISORY_FOOTER = "_Advisory only — does not block merge._";
const dryRun = process.argv.includes("--dry-run");

const DIFF_PATHS = [
  ".",
  ":(exclude)package-lock.json",
  ":(exclude)**/*.png",
  ":(exclude)**/*.jpg",
  ":(exclude)**/*.webp",
];

async function runReview() {
  const repo = env("GITHUB_REPOSITORY");
  const prNumber = env("PR_NUMBER");
  const base = env("BASE_SHA") ?? env("BASE_REF") ?? "origin/dev";
  const head = env("HEAD_SHA") ?? env("HEAD_REF") ?? "HEAD";

  if (
    !dryRun &&
    repo &&
    prNumber &&
    env("FORCE_REVIEW") !== "true" &&
    (await prCommentWithMarkerExists(repo, prNumber, MARKER))
  ) {
    console.log(
      "Code review comment already exists for this PR; skipping (use workflow re-run with force, or FORCE_REVIEW=true).",
    );
    return;
  }

  const files = changedFileList(base, head);
  if (isOnlyLowSignalChanges(files)) {
    const msg =
      "No substantive code changes detected (or only lock/assets) — code review skipped.";
    if (dryRun) {
      console.log(msg);
      return;
    }
    if (repo && prNumber) {
      await upsertPrComment(
        repo,
        prNumber,
        `## Code review (advisory)\n\n${msg}\n\n${ADVISORY_FOOTER}`,
        MARKER,
      );
    }
    return;
  }

  let diff = gitDiff(base, head, DIFF_PATHS);
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… [diff truncated]`;
  }

  const repoContext = readRepoContext();

  const system = `You are a senior engineer reviewing a pull request for the Bricola (music-cloud) Next.js app.
Review ONLY the provided diff. Be concise, specific, and actionable. This is advisory feedback.

Focus on:
- Correctness and likely bugs (edge cases, async/race, null handling)
- Security (secrets, auth, user input, SSR/client boundaries)
- Performance and unnecessary work
- Maintainability and clarity
- Test gaps when behavior clearly changed

Do NOT review Astryx design-system usage, component choice, or Tailwind tokens — a separate bot handles that.
Do not ask the author to run tools or paste commands; give direct suggestions.

Output GitHub-flavored Markdown:
- Start with "## Code review (advisory)"
- Then either "### Looks good" (short paragraph) OR "### Findings" with bullets: \`path:line\` or file — issue — suggested fix
- Optional "### Questions" if blocking clarity is needed (still advisory)
- End with exactly: ${ADVISORY_FOOTER}`;

  const user = `Changed files (${files.length}):
${files.map((f) => `- ${f}`).join("\n")}

Repository context (excerpt):
${repoContext || "(none)"}

Git diff:
\`\`\`diff
${diff}
\`\`\``;

  if (dryRun) {
    console.log("--- system ---\n", system.slice(0, 600), "...");
    console.log("--- user (truncated) ---\n", user.slice(0, 4000), "...");
    return;
  }

  const { text, skipped } = await completeAdvisoryLlm(system, user);

  if (skipped) {
    const skipBody = `## Code review (advisory)

Advisory review did not run: add repository secret **\`ANTHROPIC_API_KEY\`** or **\`OPENAI_API_KEY\`** (see [docs/astryx-ci.md](docs/astryx-ci.md)).

${ADVISORY_FOOTER}`;
    if (repo && prNumber) await upsertPrComment(repo, prNumber, skipBody, MARKER);
    console.log("Skipped: no LLM API key configured.");
    return;
  }

  let review = text;
  if (!review.includes("## Code review (advisory)")) {
    review = `## Code review (advisory)\n\n${review}\n\n${ADVISORY_FOOTER}`;
  }

  if (repo && prNumber) {
    const action = await upsertPrComment(repo, prNumber, review, MARKER);
    console.log(`PR comment ${action} on #${prNumber}`);
  } else {
    console.log(review);
  }

  appendStepSummary(review);
}

runReview().catch((err) => {
  console.error(err);
  process.exit(1);
});
