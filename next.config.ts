import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: compress responses
  compress: true,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Experimental performance features
  experimental: {
    optimizeCss: true,
  },

  // Production optimizations
  poweredByHeader: false,

  // Font optimization is built-in with next/font
};

export default nextConfig;
