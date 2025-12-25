import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Vercel deploylarında build'in lint hataları yüzünden kesilmesini engelle
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
