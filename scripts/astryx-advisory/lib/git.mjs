import { execFileSync } from "node:child_process";

export function gitDiff(base, head, pathspec = ["."]) {
  const spec = `${base}...${head}`;
  const args = ["diff", spec, "--", ...pathspec];
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
}
