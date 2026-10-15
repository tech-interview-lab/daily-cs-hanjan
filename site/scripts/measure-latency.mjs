// 운영 사이트의 새 댓글 반영 지연을 잰다(ADR-0001 6장, FR-4).
// 측정 구간: GitHub이 기록한 댓글 createdAt → 공개 URL에서 그 댓글이 보이는 시각.
// 사용법: GITHUB_TOKEN=$(gh auth token) node scripts/measure-latency.mjs <사이트 주소> <질문 번호> [횟수=3] [라운드 제한 초=300]
// 실행 중 안내가 나올 때마다 해당 질문 글에 댓글을 하나씩 단다. 일반 방문자와 같은 요청(캐시 우회 없음)으로 1초마다 확인한다.
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [site, number, roundsArg = "3", limitArg = "300"] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN;
if (!site || !number || !token) {
  console.error("사용법: GITHUB_TOKEN=... node scripts/measure-latency.mjs <사이트 주소> <질문 번호> [횟수] [라운드 제한 초]");
  process.exit(2);
}
const ROUNDS = Number(roundsArg);
const LIMIT_MS = Number(limitArg) * 1000;
const url = `${site.replace(/\/$/, "")}/q/${number}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString().slice(11, 23);

async function graphql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "cs-hanjan-latency" },
    body: JSON.stringify({ query, variables }),
  });
  return { json: await res.json(), serverDate: res.headers.get("date"), receivedAt: Date.now() };
}

async function page() {
  const res = await fetch(url);
  const html = await res.text();
  const ids = [...new Set([...html.matchAll(/id="answer-([A-Za-z0-9_]+)"/g)].map((m) => m[1]))];
  return { status: res.status, ids, cache: res.headers.get("x-vercel-cache"), age: res.headers.get("age"), at: Date.now() };
}

// 이 컴퓨터 시계와 GitHub 서버 시계의 차이(초 단위 해상도). 양수면 내 시계가 빠름
const skew = await graphql("{ viewer { login } }");
const clockSkewMs = Date.now() - new Date(skew.serverDate).getTime();
console.log(`[${stamp()}] 대상 ${url} | 시계 차이(내 시계 - GitHub, 초 해상도) ${clockSkewMs}ms`);

const results = [];
for (let round = 1; round <= ROUNDS; round++) {
  const base = await page();
  if (base.status !== 200) throw new Error(`기준 요청 실패: HTTP ${base.status}`);
  const known = new Set(base.ids);
  console.log(`\n[${stamp()}] 라운드 ${round}/${ROUNDS} 시작. 현재 답변 ${known.size}개. >>> 지금 질문 글에 댓글을 하나 달아 주세요 <<<`);

  const started = Date.now();
  let found = null;
  let polls = 0;
  const trace = [];
  while (Date.now() - started < LIMIT_MS) {
    const snapshot = await page();
    polls++;
    trace.push({ t: stamp(), cache: snapshot.cache, n: snapshot.ids.length });
    const added = snapshot.ids.filter((id) => !known.has(id));
    if (added.length) {
      found = { id: added[0], at: snapshot.at, cache: snapshot.cache, age: snapshot.age, count: snapshot.ids.length };
      break;
    }
    await sleep(1000);
  }
  if (!found) {
    console.log(`[${stamp()}] 라운드 ${round}: ${LIMIT_MS / 1000}초 안에 새 댓글이 나타나지 않았습니다.`);
    results.push({ round, ok: false, polls });
    continue;
  }

  const meta = await graphql(`query($id: ID!) { node(id: $id) { ... on DiscussionComment { createdAt author { login } } } }`, { id: found.id });
  const createdAt = meta.json.data?.node?.createdAt;
  const delayMs = createdAt ? found.at - new Date(createdAt).getTime() : null;
  results.push({
    round, ok: true, commentId: found.id, createdAt, appearedAt: new Date(found.at).toISOString(),
    delayMs, delayMsClockAdjusted: delayMs === null ? null : delayMs - clockSkewMs,
    vercelCache: found.cache, polls,
  });
  console.log(`[${stamp()}] 라운드 ${round}: 반영 확인. createdAt ${createdAt} → 노출 ${new Date(found.at).toISOString()} = ${delayMs}ms (시계 보정 ${delayMs - clockSkewMs}ms), x-vercel-cache=${found.cache}`);
  if (round < ROUNDS) await sleep(5000);
}

const ok = results.filter((r) => r.ok).map((r) => r.delayMsClockAdjusted).sort((a, b) => a - b);
const median = ok.length ? ok[Math.floor(ok.length / 2)] : null;
const summary = {
  site: url, rounds: results.length, succeeded: ok.length, clockSkewMs,
  medianMs: median, maxMs: ok.length ? ok[ok.length - 1] : null, minMs: ok.length ? ok[0] : null, results,
};
console.log("\n===== 요약 =====");
console.log(JSON.stringify(summary, null, 2));
const outFile = join(tmpdir(), "hanjan-latency-result.json");
writeFileSync(outFile, JSON.stringify(summary, null, 2));
console.log(`결과 파일: ${outFile}`);
process.exit(ok.length === results.length ? 0 : 1);
