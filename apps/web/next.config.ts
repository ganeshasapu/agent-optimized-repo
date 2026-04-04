import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@biarritz/ui",
    "@biarritz/db",
    "@biarritz/shared",
    "@biarritz/domain-users",
    "@biarritz/domain-settings",
  ],
};

export default nextConfig;
