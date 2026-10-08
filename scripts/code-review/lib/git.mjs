import { execFileSync } from "node:child_process";

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
