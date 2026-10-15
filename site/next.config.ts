import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  // true면 목록에 없는 경로에 미리 만든 틀을 먼저 보내 상태 코드가 200으로 고정된다(없는 카테고리가 404가 아닌 200)
  partialPrefetching: false,
  turbopack: { root: import.meta.dirname },
};

export default config;
