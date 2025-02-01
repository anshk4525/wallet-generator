import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack
  experimental: {
    appDir: true, // Enable if you're using the App Router
    turbopack: false, // Explicitly disable Turbopack
  },
  // Custom Webpack configuration (optional)
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;