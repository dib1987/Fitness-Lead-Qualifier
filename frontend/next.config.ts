import type { NextConfig } from "next";
import path from "path";

// T/ (shared pure logic, imported via the "@shared/*" path alias) lives
// outside this directory and has no node_modules of its own. Point webpack
// at frontend/node_modules so its dependencies (e.g. zod) resolve.
const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.modules = [
      ...(config.resolve.modules ?? []),
      path.resolve(__dirname, "node_modules"),
    ];
    return config;
  },
};

export default nextConfig;
