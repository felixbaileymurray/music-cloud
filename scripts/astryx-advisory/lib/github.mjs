import fs from "node:fs";
import { env } from "./env.mjs";

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

export function appendStepSummary(markdown) {
  const summaryPath = env("GITHUB_STEP_SUMMARY");
  if (summaryPath) fs.appendFileSync(summaryPath, `${markdown}\n`);
}
