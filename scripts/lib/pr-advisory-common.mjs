/**
 * Shared helpers for advisory PR review scripts (GitHub comment + LLM providers).
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";

export function env(name) {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : null;
}

export function resolveModel() {
  return (
    env("CODE_REVIEW_MODEL") ??
    env("ASTRYX_REVIEW_MODEL") ??
    null
  );
}

export function gitDiff(base, head, pathspec = ["."]) {
  const spec = `${base}...${head}`;
  const args = ["diff", spec, "--", ...pathspec];
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}

export function changedFileList(base, head) {
  const spec = `${base}...${head}`;
  const raw = execFileSync("git", ["diff", "--name-only", spec], {
    encoding: "utf8",
  });
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Skip review when the PR only touches low-signal generated or lock files. */
export function isOnlyLowSignalChanges(files) {
  if (files.length === 0) return true;
  const lowSignal =
    /^(package-lock\.json|.*\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?))$/;
  return files.every((f) => lowSignal.test(f));
}

export async function githubRequest(url, { method = "GET", body } = {}) {
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

export async function prCommentWithMarkerExists(repo, prNumber, marker) {
  const listUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const comments = await githubRequest(listUrl);
  return comments.some(
    (c) => typeof c.body === "string" && c.body.includes(marker),
  );
}

export async function upsertPrComment(repo, prNumber, body, marker) {
  const fullBody = `${marker}\n${body}`;
  const listUrl = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`;
  const comments = await githubRequest(listUrl);
  const existing = comments.find(
    (c) => typeof c.body === "string" && c.body.includes(marker),
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

export async function callAnthropic(system, user) {
  const key = env("ANTHROPIC_API_KEY");
  if (!key) return null;
  const model = resolveModel() ?? "claude-sonnet-4-20250514";
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

export async function callOpenAI(system, user) {
  const key = env("OPENAI_API_KEY");
  if (!key) return null;
  const model = resolveModel() ?? "gpt-4o-mini";
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

export async function completeAdvisoryLlm(system, user) {
  if (!env("ANTHROPIC_API_KEY") && !env("OPENAI_API_KEY")) {
    return { text: null, skipped: true };
  }
  const text =
    (await callAnthropic(system, user)) ?? (await callOpenAI(system, user));
  if (!text?.trim()) throw new Error("LLM returned empty review");
  return { text, skipped: false };
}

export function appendStepSummary(markdown) {
  const summaryPath = env("GITHUB_STEP_SUMMARY");
  if (summaryPath) fs.appendFileSync(summaryPath, `${markdown}\n`);
}

export function readRepoContext() {
  const hints = [];
  const contributing = "docs/contributing.md";
  const architecture = "docs/architecture.md";
  for (const file of [contributing, architecture]) {
    try {
      const body = fs.readFileSync(file, "utf8");
      hints.push(`## ${file}\n${body.slice(0, 6000)}`);
    } catch {
      /* optional */
    }
  }
  return hints.join("\n\n");
}
