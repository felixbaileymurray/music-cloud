import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  // Parent home-dir package-lock.json confuses Turbopack / file tracing.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  // Spotify redirect URI and README use 127.0.0.1; Next advertises localhost.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
