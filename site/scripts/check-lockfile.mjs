// npm 선택 의존성 버그(npm/cli#4828)로 플랫폼별 바이너리 항목이 lockfile에서 빠지면 Vercel(Linux) 빌드가 깨진다.
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf-8"));
const required = [
  "node_modules/@rolldown/binding-linux-x64-gnu",
  "node_modules/@rolldown/binding-darwin-arm64",
  "node_modules/@next/swc-linux-x64-gnu",
  "node_modules/@next/swc-darwin-arm64",
];
const missing = required.filter((key) => !lock.packages?.[key]);
if (missing.length) {
  console.error(`package-lock.json에 플랫폼별 패키지가 없습니다: ${missing.join(", ")}`);
  console.error("node_modules와 package-lock.json을 지우고 npm install을 다시 실행하세요.");
  process.exit(1);
}
console.log("lockfile 플랫폼 패키지 확인: 통과");
