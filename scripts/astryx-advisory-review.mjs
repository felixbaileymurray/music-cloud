#!/usr/bin/env node
/**
 * Advisory Astryx PR review (Layer 3). Posts or updates a single PR comment.
 * Requires GITHUB_TOKEN plus ANTHROPIC_API_KEY or OPENAI_API_KEY.
 *
 * Local dry-run (no PR comment):
 *   BASE=origin/dev HEAD=HEAD node scripts/astryx-advisory-review.mjs --dry-run
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MARKER = "<!-- astryx-advisory-review:v1 -->";
const MAX_DIFF_CHARS = 48_000;
const MAX_DOC_CHARS = 36_000;
const UI_PATH_RE = /^src\/(app|components)\/.+\.(tsx|ts)$/;

const dryRun = process.argv.includes("--dry-run");

function env(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

function runAstryx(args, { maxChars = 12_000 } = {}) {
  try {
    const out = execFileSync("npx", ["astryx", ...args], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
      cwd: process.cwd(),
    });
    return out.length > maxChars ? `${out.slice(0, maxChars)}\n… [truncated]` : out;
  } catch (err) {
    const stderr = err.stderr?.toString?.() ?? "";
    return `[astryx ${args.join(" ")} failed: ${err.message}]\n${stderr.slice(0, 2000)}`;
  }
}

function gitDiff(base, head) {
  const spec = `${base}...${head}`;
  return execFileSync("git", ["diff", spec, "--", "src/"], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

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

function extractCoreComponents(text) {
  const names = new Set();
  const re = /@astryxdesign\/core\/([A-Za-z][A-Za-z0-9]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) names.add(m[1]);
  return [...names].sort();
}

function loadAgentsRules() {
  const agentsPath = path.join(process.cwd(), "AGENTS.md");
  if (!fs.existsSync(agentsPath)) return "";
  const body = fs.readFileSync(agentsPath, "utf8");
  const start = body.indexOf("<!-- ASTRYX:START -->");
  const end = body.indexOf("<!-- ASTRYX:END -->");
  if (start >= 0 && end > start) {
    return body.slice(start, end).trim();
  }
  return body.slice(0, 4000);
}

function gatherComponentDocs(names) {
  let blob = "";
  for (const name of names.slice(0, 12)) {
    blob += `\n### ${name}\n`;
    blob += runAstryx(["component", name, "--dense"], { maxChars: 6000 });
  }
  return blob.length > MAX_DOC_CHARS
    ? `${blob.slice(0, MAX_DOC_CHARS)}\n… [truncated]`
    : blob;
}

function gatherTopicDocs() {
  const topics = ["layout", "principles", "styling", "tokens"];
  let blob = "";
  for (const topic of topics) {
    blob += `\n## docs ${topic}\n`;
    blob += runAstryx(["docs", topic, "--dense"], { maxChars: 8000 });
  }
  return blob.length > MAX_DOC_CHARS
    ? `${blob.slice(0, MAX_DOC_CHARS)}\n… [truncated]`
    : blob;
}

async function githubRequest(url, { method = "GET", body } = {}) {
  const token = env("GITHUB_TOKEN");
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${url}: ${res.status} ${text}`);
  }
  return res.json();
}

async function upsertPrComment(repo, prNumber, body) {
  const fullBody = `${MARKER}\n${body}`;
  const listUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const comments = await githubRequest(listUrl);
  const existing = comments.find(
    (c) => typeof c.body === "string" && c.body.includes(MARKER),
  );
  if (existing) {
    await githubRequest(
      `https://api.github.com/repos/${repo}/issues/comments/${existing.id}`,
      { method: "PATCH", body: { body: fullBody } },
    );
    return "updated";
  }
  await githubRequest(listUrl, { method: "POST", body: { body: fullBody } });
  return "created";
}

async function callAnthropic(system, user) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: env("ASTRYX_REVIEW_MODEL") ?? "claude-sonnet-4-20250514",
      max_tokens: 2048,
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

async function callOpenAI(system, user) {
  const key = env("OPENAI_API_KEY");
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env("ASTRYX_REVIEW_MODEL") ?? "gpt-4o-mini",
      max_tokens: 2048,
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

async function runReview() {
  const repo = env("GITHUB_REPOSITORY");
  const prNumber = env("PR_NUMBER");
  const base =
    env("BASE_SHA") ?? env("BASE_REF") ?? "origin/dev";
  const head = env("HEAD_SHA") ?? env("HEAD_REF") ?? "HEAD";

  const files = changedUiFiles(base, head);
  if (files.length === 0) {
    const msg = "No changes under `src/app` or `src/components` — advisory review skipped.";
    if (dryRun) {
      console.log(msg);
      return;
    }
    if (repo && prNumber) {
      await upsertPrComment(
        repo,
        prNumber,
        `## Astryx advisory review\n\n${msg}\n\n_Advisory only — does not block merge._`,
      );
    }
    return;
  }

  let diff = gitDiff(base, head);
  if (diff.length > MAX_DIFF_CHARS) {
    diff = `${diff.slice(0, MAX_DIFF_CHARS)}\n… [diff truncated]`;
  }

  const componentNames = extractCoreComponents(diff);
  const agents = loadAgentsRules();
  const componentDocs = gatherComponentDocs(componentNames);
  const topicDocs = gatherTopicDocs();

  const system = `You are a design-system reviewer for the Bricola app using Astryx (@astryxdesign/core).
Review ONLY the PR diff. Be concise and actionable. This is advisory feedback for humans.

Focus on:
- Component choice (e.g. IconButton vs Button with an empty or icon-only label; List vs hand-rolled stacks; Layout frame vs ad-hoc divs)
- Prop configuration vs official component docs
- AGENTS.md dos and don'ts (no layout divs where Astryx stacks exist, token-backed Tailwind, no inline style, no arbitrary Tailwind values)
- When docs suggest a better pattern, cite the component or doc topic by name

Do NOT nitpick pre-existing canvas/D3 shells unless the diff touches them.
If the diff looks compliant, say so briefly.

Output GitHub-flavored Markdown:
- Start with "## Astryx advisory review"
- Then either "### Looks good" with one short paragraph, OR "### Suggestions" with a bullet list (file path, issue, recommended fix).
- End with a line: "_Advisory only — does not block merge._"`;

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

  if (!env("ANTHROPIC_API_KEY") && !env("OPENAI_API_KEY")) {
    const skip = `## Astryx advisory review

Advisory review did not run: add repository secret **\`ANTHROPIC_API_KEY\`** or **\`OPENAI_API_KEY\`** (see [docs/astryx-ci.md](docs/astryx-ci.md)).

_Advisory only — does not block merge._`;
    if (repo && prNumber) await upsertPrComment(repo, prNumber, skip);
    console.log("Skipped: no LLM API key configured.");
    return;
  }

  let review =
    (await callAnthropic(system, user)) ?? (await callOpenAI(system, user));
  if (!review?.trim()) {
    throw new Error("LLM returned empty review");
  }
  if (!review.includes("## Astryx advisory review")) {
    review = `## Astryx advisory review\n\n${review}\n\n_Advisory only — does not block merge._`;
  }

  if (repo && prNumber) {
    const action = await upsertPrComment(repo, prNumber, review);
    console.log(`PR comment ${action} on #${prNumber}`);
  } else {
    console.log(review);
  }

  const summaryPath = env("GITHUB_STEP_SUMMARY");
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `${review}\n`);
  }
}

runReview().catch((err) => {
  console.error(err);
  process.exit(1);
});
