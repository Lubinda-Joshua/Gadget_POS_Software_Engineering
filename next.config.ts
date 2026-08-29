import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Allow cross-origin requests from the local network IP during development
  // (e.g. accessing via 192.168.x.x:3000 from another device).
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.*.*"],
  // Disable client-side router cache for dynamic pages so navigation always
  // re-fetches fresh data instead of serving stale RSC payloads.
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
  // standalone output is only for Docker/Linux builds; keep disabled on Windows
  // to avoid Turbopack chunk names with ':' being invalid Windows paths.
  // Enable via NEXT_STANDALONE=1 in CI/Docker environments.
  ...(process.env.NEXT_STANDALONE === "1" ? { output: "standalone" } : {}),
  // Allow images from any origin for product images
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
