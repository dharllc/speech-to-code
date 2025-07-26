import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [],
  env: {
    BACKEND_PORT: process.env.BACKEND_PORT || '8000',
    FRONTEND_PORT: process.env.FRONTEND_PORT || '3000'
  }
};

export default nextConfig;
