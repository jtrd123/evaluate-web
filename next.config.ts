import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // enables minimal Docker image via .next/standalone
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      // Self-hosted Supabase storage (any IP / domain on the school server)
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
