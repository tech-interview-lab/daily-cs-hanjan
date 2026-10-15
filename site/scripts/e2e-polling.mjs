// 열린 질문 상세에 새 답변이 15초 폴링으로 붙는지 실제 브라우저에서 확인한다(site-design.md 5.3).
// 사용법: node scripts/e2e-polling.mjs   (fixture로 빌드하므로 끝나면 실제 데이터로 다시 빌드할 것)
import { execFileSync, spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { copyFileSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { launchChrome, sleep, waitForServer } from "./lib/cdp.mjs";

const PORT = 3126;
const BASE = `http://localhost:${PORT}`;
const SECRET = "e2e-secret";
const fixture = join(mkdtempSync(join(tmpdir(), "hanjan-polling-")), "discussions.json");
copyFileSync(new URL("../tests/fixtures/edge-discussions.json", import.meta.url), fixture);
const env = { ...process.env, HANJAN_FIXTURE_FILE: fixture, GITHUB_WEBHOOK_SECRET: SECRET, GITHUB_TOKEN: "" };

const results = [];
const check = (name, ok, detail = "") => results.push({ 확인: name, 결과: ok ? "통과" : "실패", 상세: String(detail) });

function addAnswers(mutate) {
  const data = JSON.parse(readFileSync(fixture, "utf-8"));
  mutate(data);
  writeFileSync(fixture, JSON.stringify(data));
}
const answer = (id, questionNumber, text, createdAt, parentId = null) => ({
  id, questionNumber, author: "newcomer", body: text, bodyHtml: `<p>${text}</p>`, bodyText: text, createdAt, parentId,
});
async function webhook(number) {
  const body = JSON.stringify({ action: "created", discussion: { number } });
  const signature = `sha256=${createHmac("sha256", SECRET).update(body).digest("hex")}`;
  return (await fetch(`${BASE}/api/webhooks/github`, {
    method: "POST", headers: { "x-github-event": "discussion_comment", "x-hub-signature-256": signature }, body,
  })).status;
}

console.log("fixture로 빌드 중...");
execFileSync("npx", ["next", "build"], { env, stdio: "ignore" });
let server = spawn("npx", ["next", "start", "-p", String(PORT)], { env, stdio: "ignore" });
await waitForServer(BASE);
const browser = await launchChrome(9334);
const state = `({
  title: document.getElementById("answers-title")?.textContent,
  cards: document.querySelectorAll("#answers-title ~ ol > li").length,
  columns: document.querySelector("#answers-title ~ ol")?.dataset.columns,
  newLabels: [...document.querySelectorAll("span")].filter((s) => s.textContent === "새 답변" || s.textContent === "새 답글").map((s) => s.textContent),
  live: document.querySelector("[aria-live=polite]")?.textContent,
  scrollY: Math.round(scrollY),
  // 사용자가 보고 있던 카드(화면 안에 들어온 첫 카드)의 화면상 위치. 위쪽에 내용이 늘어도 이 값이 같으면 화면이 밀리지 않은 것
  anchorTop: (() => {
    const id = window.__anchorId ?? (window.__anchorId = [...document.querySelectorAll("article[aria-labelledby]")]
      .find((el) => el.getBoundingClientRect().top >= 0)?.getAttribute("aria-labelledby"));
    const el = id && document.querySelector('[aria-labelledby="' + id + '"]');
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  })(),
  error: document.querySelector("[role=status]")?.textContent ?? null,
})`;
async function waitUntil(predicate, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await browser.evaluate(state);
    if (predicate(s)) return { s, ms: Date.now() - start };
    await sleep(500);
  }
  return { s: await browser.evaluate(state), ms: null };
}

try {
  // 1. 모바일에서 스크롤한 채로 새 답변과 새 답글 받기
  await browser.viewport(375);
  await browser.open(`${BASE}/q/201`);
  await browser.evaluate("scrollTo(0, 900), true");
  await sleep(200);
  const before = await browser.evaluate(state);
  check("초기 답변 수(마감 댓글 제외)", before.title === "답변 5", before.title);

  addAnswers((data) => {
    data[0].answers.push(answer("N1", 201, "폴링으로 들어온 새 답변", "2026-10-22T01:00:00Z"));
    data[0].answers.push(answer("N2", 201, "첫 답변에 달린 새 답글", "2026-10-22T01:05:00Z", "E1"));
  });
  check("웹훅 200", (await webhook(201)) === 200);
  const after = await waitUntil((s) => s.newLabels.length >= 2, 20_000);
  check("새로고침 없이 새 답변과 새 답글 표시", after.ms !== null, after.ms === null ? "20초 안에 안 나타남" : `${after.ms}ms`);
  check("답변 수 제목 갱신", after.s.title === "답변 6", after.s.title);
  check("표시 라벨", after.s.newLabels.sort().join(",") === "새 답글,새 답변", after.s.newLabels.join(","));
  check("스크린 리더 알림", after.s.live === "새 답변 1건, 새 답글 1건이 추가되었습니다.", after.s.live);
  check(
    "보던 내용이 밀리지 않음(보던 카드의 화면 위치 유지)",
    before.anchorTop !== null && Math.abs(after.s.anchorTop - before.anchorTop) <= 1,
    `카드 위치 ${before.anchorTop} → ${after.s.anchorTop}px, scrollY ${before.scrollY} → ${after.s.scrollY}`,
  );

  // 2. 넓은 화면에서 답변 1개 → 2개가 되면 2열
  await browser.viewport(1440);
  await browser.open(`${BASE}/q/202`);
  const single = await browser.evaluate(state);
  check("1440px 답변 1개는 1열", single.columns === "1", single.columns);
  addAnswers((data) => data[1].answers.push(answer("N3", 202, "두 번째 답변", "2026-10-22T02:00:00Z")));
  await webhook(202);
  const two = await waitUntil((s) => s.cards === 2, 20_000);
  check("1440px 답변 2개가 되면 2열", two.s.columns === "2", `${two.s.columns}, ${two.ms}ms`);

  // 3. 서버가 멈추면 3번 실패 후 안내
  server.kill();
  execFileSync("pkill", ["-f", `next start -p ${PORT}`]);
  const failed = await waitUntil((s) => s.error !== null, 60_000);
  check("연속 3회 실패 후 새로고침 안내", failed.ms !== null, failed.s.error ?? "안내 없음");
} finally {
  browser.close();
  server.kill();
  try { execFileSync("pkill", ["-f", `next start -p ${PORT}`]); } catch {}
}

console.table(results);
process.exit(results.every((r) => r.결과 === "통과") ? 0 : 1);
