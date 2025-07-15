import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // API Routesを使用するためコメントアウト
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
