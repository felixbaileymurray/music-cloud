#!/usr/bin/env node
/**
 * Portable advisory PR code review (no framework dependencies).
 * Copy scripts/code-review/ and .github/workflows/code-review-advisory.yml to any repo.
 *
 * Local dry-run:
 *   BASE=origin/main HEAD=HEAD node scripts/code-review/advisory.mjs --dry-run
 */

import { readRepoContext } from "./lib/context.mjs";
import { env } from "./lib/env.mjs";
import { changedFileList, gitDiff, isOnlyLowSignalChanges } from "./lib/git.mjs";
import {
  appendStepSummary,
  prCommentWithMarkerExists,
  upsertPrComment,
} from "./lib/github.mjs";
import { completeLlm } from "./lib/llm.mjs";
import {
  ADVISORY_FOOTER,
  MARKER,
  TITLE,
  buildSystemPrompt,
} from "./prompt.mjs";

const MAX_DIFF_CHARS = 56_000;
const dryRun = process.argv.includes("--dry-run");

const DIFF_PATHS = [
  ".",
  ":(exclude)package-lock.json",
  ":(exclude)**/*.png",
  ":(exclude)**/*.jpg",
  ":(exclude)**/*.webp",
];

const LLM_OPTIONS = {
  modelEnv: "CODE_REVIEW_MODEL",
  anthropicDefault: "claude-sonnet-4-20250514",
  openaiDefault: "gpt-4o-mini",
};

async function runReview() {
  const repo = env("GITHUB_REPOSITORY");
  const prNumber = env("PR_NUMBER");
  const base = env("BASE_SHA") ?? env("BASE_REF") ?? "origin/main";
  const head = env("HEAD_SHA") ?? env("HEAD_REF") ?? "HEAD";

  if (
    !dryRun &&
    repo &&
    prNumber &&
    env("FORCE_REVIEW") !== "true" &&
    (await prCommentWithMarkerExists(repo, prNumber, MARKER))
  ) {
    console.log(
      "Code review comment already exists for this PR; skipping (workflow re-run with force, or FORCE_REVIEW=true).",
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
        `${TITLE}\n\n${msg}\n\n${ADVISORY_FOOTER}`,
        MARKER,
      );
    }
    return;
  }

  let diff = gitDiff(base, head, DIFF_PATHS);
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… [diff truncated]`;
  }

  const system = buildSystemPrompt();
  const user = `Changed files (${files.length}):
${files.map((f) => `- ${f}`).join("\n")}

Repository context (excerpt):
${readRepoContext() || "(none)"}

Git diff:
\`\`\`diff
${diff}
\`\`\``;

  if (dryRun) {
    console.log("--- system ---\n", system.slice(0, 600), "...");
    console.log("--- user (truncated) ---\n", user.slice(0, 4000), "...");
    return;
  }

  const { text, skipped } = await completeLlm(system, user, LLM_OPTIONS);

  if (skipped) {
    const skipBody = `${TITLE}

Advisory review did not run: add repository secret **\`ANTHROPIC_API_KEY\`** or **\`OPENAI_API_KEY\`** (see [docs/code-review-ci.md](docs/code-review-ci.md)).

${ADVISORY_FOOTER}`;
    if (repo && prNumber) await upsertPrComment(repo, prNumber, skipBody, MARKER);
    console.log("Skipped: no LLM API key configured.");
    return;
  }

  let review = text;
  if (!review.includes(TITLE)) {
    review = `${TITLE}\n\n${review}\n\n${ADVISORY_FOOTER}`;
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
