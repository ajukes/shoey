import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
