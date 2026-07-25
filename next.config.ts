import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  outputFileTracingIncludes: {
    "/": ["./db/custom.db", "./.z-ai-config", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
