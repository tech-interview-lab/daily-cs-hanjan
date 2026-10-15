/** 레이어 의존 규칙. 근거: .claude/rules/site-layer-rules.md, docs/site/site-structure.md 5장 */
module.exports = {
  forbidden: [
    {
      name: "domain-is-pure",
      comment: "domain은 다른 레이어와 외부 라이브러리, 입출력을 모른다",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: "^src/domain/" },
    },
    {
      name: "application-only-domain",
      comment: "application은 domain만 안다. 프레임워크와 입출력 금지",
      severity: "error",
      from: { path: "^src/application/" },
      to: { pathNot: "^src/(domain|application)/" },
    },
    {
      name: "adapters-no-upper-layers",
      comment: "adapters는 application(ports)과 domain만 안다",
      severity: "error",
      from: { path: "^src/adapters/" },
      to: { path: "^src/(presentation|main|app)/" },
    },
    {
      name: "adapters-no-cross-adapter",
      comment: "어댑터끼리 서로 알지 못한다",
      severity: "error",
      from: { path: "^src/adapters/([^/]+)/" },
      to: { path: "^src/adapters/", pathNot: "^src/adapters/$1/" },
    },
    {
      name: "presentation-no-adapters",
      comment: "presentation은 adapters, main, app을 모른다",
      severity: "error",
      from: { path: "^src/presentation/" },
      to: { path: "^src/(adapters|main|app)/" },
    },
    {
      name: "app-thin",
      comment: "app은 main/container와 presentation/controllers만 호출한다",
      severity: "error",
      from: { path: "^src/app/" },
      to: { path: "^src/(domain|application|adapters)/|^src/presentation/(?!controllers/)|^src/main/(?!container/)" },
    },
    {
      name: "no-framework-in-inner-layers",
      comment: "react, next는 presentation, app, main에서만 import한다",
      severity: "error",
      from: { path: "^src/(domain|application|adapters)/" },
      to: { path: "node_modules/(react|react-dom|next)/" },
    },
    {
      name: "next-cache-only-in-main",
      comment: "Next.js 캐시 API는 main에서만 import한다",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/main/" },
      to: { path: "node_modules/next/(cache|dist/server/web/spec-extension/(unstable-cache|revalidate))" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    doNotFollow: { path: "node_modules" },
    moduleSystems: ["es6", "cjs"],
  },
};
