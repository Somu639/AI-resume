import type { NextConfig } from "next";

/**
 * Proxy /api/v1 → Express API so the browser always hits the same origin.
 * Avoids 404s when another local app (e.g. JobPilot) already owns :4000.
 */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "http://localhost:4002";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  transpilePackages: ["@resumeai/shared", "@resumeai/resume-export"],
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
