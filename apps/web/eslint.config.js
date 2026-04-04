import config from "@biarritz/config-eslint/next";

export default [
  ...config,
  { ignores: ["next-env.d.ts"] },
];
