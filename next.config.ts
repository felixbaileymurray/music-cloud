import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  // Parent home-dir package-lock.json confuses Turbopack / file tracing.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
