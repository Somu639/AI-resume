import type { NextConfig } from "next";

/**
 * Proxy /api/v1 → Express API so the browser always hits the same origin.
 * Local default: :4002. On Vercel, set API_PROXY_TARGET to the API deployment URL
 * (or set NEXT_PUBLIC_API_URL to call the API host directly).
 */
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "http://localhost:4002";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `standalone` is for Docker; Vercel uses its own Next.js output.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  transpilePackages: ["@resumeai/shared", "@resumeai/resume-export"],
  images: {
    remotePatterns: [],
  },
  async rewrites() {
    // When the browser already uses an absolute NEXT_PUBLIC_API_URL, rewrites are unused.
    if (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")) {
      return [];
    }
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
