import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAX_DOC_CHARS = 36_000;

export function runAstryx(args, { maxChars = 12_000 } = {}) {
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

export function loadAgentsRules() {
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

export function extractCoreComponents(text) {
  const names = new Set();
  const re = /@astryxdesign\/core\/([A-Za-z][A-Za-z0-9]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) names.add(m[1]);
  return [...names].sort();
}

export function gatherComponentDocs(names) {
  let blob = "";
  for (const name of names.slice(0, 12)) {
    blob += `\n### ${name}\n`;
    blob += runAstryx(["component", name, "--dense"], { maxChars: 6000 });
  }
  return blob.length > MAX_DOC_CHARS
    ? `${blob.slice(0, MAX_DOC_CHARS)}\n… [truncated]`
    : blob;
}

export function gatherTopicDocs() {
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
