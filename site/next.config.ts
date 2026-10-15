import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: { root: import.meta.dirname },
};

export default config;
