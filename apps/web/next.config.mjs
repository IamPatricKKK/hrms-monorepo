import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Cố định root monorepo để bundle standalone luôn ở
  // apps/web/.next/standalone/apps/web/server.js (khớp Dockerfile.prod).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@hrms/shared"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
