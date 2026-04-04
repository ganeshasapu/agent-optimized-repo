import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@biarritz/ui",
    "@biarritz/db",
    "@biarritz/shared",
    "@biarritz/domain-users",
  ],
};

export default nextConfig;
