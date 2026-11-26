import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    return apiOrigin ? [{
      source: "/store-branding.json",
      destination: `${apiOrigin}/api/v1/branding`,
    }, {
      source: "/media/:folder(banners|logos)/:filename",
      destination: `${apiOrigin}/media/:folder/:filename`,
    }] : [];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
