import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 一時的に静的サイトに戻す
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // API Routesの代替として、n8nへの直接アクセスを検討
};

export default nextConfig;
