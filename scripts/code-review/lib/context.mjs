import fs from "node:fs";

/**
 * Optional repo docs for the reviewer. Override with CODE_REVIEW_CONTEXT_FILES
 * (comma-separated paths). Copy this module to other repos and adjust defaults.
 */
export function readRepoContext() {
  const fromEnv = process.env.CODE_REVIEW_CONTEXT_FILES?.trim();
  const files = fromEnv
    ? fromEnv.split(",").map((f) => f.trim()).filter(Boolean)
    : [
        "AGENTS.md",
        "CLAUDE.md",
        "docs/contributing.md",
        "docs/architecture.md",
        "README.md",
      ];

  const hints = [];
  for (const file of files) {
    try {
      const body = fs.readFileSync(file, "utf8");
      hints.push(`## ${file}\n${body.slice(0, 6000)}`);
    } catch {
      /* optional */
    }
  }
  return hints.join("\n\n");
}
