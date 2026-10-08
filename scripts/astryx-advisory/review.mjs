#!/usr/bin/env node
/**
 * Astryx design-system advisory PR review. Requires @astryxdesign/cli in the repo.
 * General code review lives in scripts/code-review/ (portable, separate workflow).
 *
 * Local dry-run:
 *   BASE=origin/dev HEAD=HEAD node scripts/astryx-advisory/review.mjs --dry-run
 */

import { execFileSync } from "node:child_process";
import { env } from "../code-review/lib/env.mjs";
import { gitDiff } from "../code-review/lib/git.mjs";
import {
  appendStepSummary,
  prCommentWithMarkerExists,
  upsertPrComment,
} from "../code-review/lib/github.mjs";
import { completeLlm } from "../code-review/lib/llm.mjs";
import {
  extractCoreComponents,
  gatherComponentDocs,
  gatherTopicDocs,
  loadAgentsRules,
} from "./lib/astryx-docs.mjs";
import {
  ADVISORY_FOOTER,
  MARKER,
  TITLE,
  buildSystemPrompt,
} from "./prompt.mjs";

const MAX_DIFF_CHARS = 48_000;
const UI_PATH_RE = /^src\/(app|components)\/.+\.(tsx|ts)$/;
const dryRun = process.argv.includes("--dry-run");

const LLM_OPTIONS = {
  modelEnv: "ASTRYX_REVIEW_MODEL",
  anthropicDefault: "claude-sonnet-4-20250514",
  openaiDefault: "gpt-4o-mini",
};

function changedUiFiles(base, head) {
  const spec = `${base}...${head}`;
  const raw = execFileSync("git", ["diff", "--name-only", spec], {
    encoding: "utf8",
  });
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((f) => f && UI_PATH_RE.test(f));
}

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
      "Astryx review comment already exists for this PR; skipping (workflow re-run with force, or FORCE_REVIEW=true).",
    );
    return;
  }

  const files = changedUiFiles(base, head);
  if (files.length === 0) {
    const msg =
      "No changes under `src/app` or `src/components` — advisory review skipped.";
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

  let diff = gitDiff(base, head, ["src/"]);
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… [diff truncated]`;
  }

  const componentNames = extractCoreComponents(diff);
  const agents = loadAgentsRules();
  const componentDocs = gatherComponentDocs(componentNames);
  const topicDocs = gatherTopicDocs();
  const system = buildSystemPrompt();

  const user = `Changed UI files:\n${files.map((f) => `- ${f}`).join("\n")}

AGENTS.md (Astryx section):
${agents}

Relevant component CLI docs:
${componentDocs || "(none detected in diff imports)"}

Topic docs excerpts:
${topicDocs}

Git diff:
\`\`\`diff
${diff}
\`\`\``;

  if (dryRun) {
    console.log("--- system ---\n", system.slice(0, 500), "...");
    console.log("--- user (truncated) ---\n", user.slice(0, 4000), "...");
    return;
  }

  const { text, skipped } = await completeLlm(system, user, LLM_OPTIONS);

  if (skipped) {
    const skip = `${TITLE}

Advisory review did not run: add repository secret **\`ANTHROPIC_API_KEY\`** or **\`OPENAI_API_KEY\`** (see [docs/astryx-ci.md](docs/astryx-ci.md)).

${ADVISORY_FOOTER}`;
    if (repo && prNumber) await upsertPrComment(repo, prNumber, skip, MARKER);
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
