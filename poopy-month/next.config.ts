import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile sits one level up).
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
