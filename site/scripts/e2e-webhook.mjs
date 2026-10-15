// 웹훅 → 질문 단위 재검증을 로컬에서 끝까지 확인한다. GitHub 대신 fixture 파일을 데이터로 쓴다.
// 사용법: node scripts/e2e-webhook.mjs   (끝나면 .next에 fixture 빌드가 남으므로 실제 데이터로 다시 빌드할 것)
import { execFileSync, spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 3124;
const BASE = `http://localhost:${PORT}`;
const SECRET = "e2e-secret";
const fixture = join(mkdtempSync(join(tmpdir(), "hanjan-e2e-")), "discussions.json");
const env = { ...process.env, HANJAN_FIXTURE_FILE: fixture, GITHUB_WEBHOOK_SECRET: SECRET, GITHUB_TOKEN: "" };

const answer = (id, questionNumber, text, createdAt) => ({
  id, questionNumber, author: "tester", body: text, bodyHtml: `<p>${text}</p>`, bodyText: text, createdAt, parentId: null,
});
const question = (number, category, text) => ({
  number, title: `[${category}] 2026-10-0${number - 100} 오늘의 질문`, text, note: null, category,
  createdAt: `2026-10-0${number - 100}T00:05:00Z`, closed: false, url: `https://github.com/o/r/discussions/${number}`, bodyHtml: "",
});
const data = [
  { question: question(101, "네트워크", "E2E 질문 하나"), answers: [answer("A1", 101, "첫 답변", "2026-10-01T01:00:00Z")] },
  { question: question(102, "CS", "E2E 질문 둘"), answers: [answer("B1", 102, "둘의 첫 답변", "2026-10-02T01:00:00Z")] },
];
const save = () => writeFileSync(fixture, JSON.stringify(data));
save();

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ 확인: name, 결과: ok ? "통과" : "실패", 상세: detail });
};
const page = async (path) => {
  const res = await fetch(BASE + path, { cache: "no-store" });
  return { status: res.status, text: await res.text() };
};
const webhook = async (event, payload, secret = SECRET) => {
  const body = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const res = await fetch(`${BASE}/api/webhooks/github`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-github-event": event, "x-hub-signature-256": signature },
    body,
  });
  return res.status;
};

console.log("fixture로 빌드 중...");
execFileSync("npx", ["next", "build"], { env, stdio: "ignore" });
const server = spawn("npx", ["next", "start", "-p", String(PORT)], { env, stdio: "ignore" });

try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }

  let q101 = await page("/q/101");
  check("처음: 질문 101에 첫 답변 표시", q101.status === 200 && q101.text.includes("첫 답변"));

  data[0].answers.push(answer("A2", 101, "웹훅으로 들어온 답변", "2026-10-01T02:00:00Z"));
  save();

  q101 = await page("/q/101");
  check("데이터만 바뀌고 웹훅 전: 캐시된 옛 내용 유지", !q101.text.includes("웹훅으로 들어온 답변"));

  check("서명이 틀린 웹훅은 401", (await webhook("discussion_comment", { discussion: { number: 101 } }, "wrong")) === 401);
  check("서명이 틀린 웹훅 후에도 갱신 안 됨", !(await page("/q/101")).text.includes("웹훅으로 들어온 답변"));

  const sentAt = Date.now();
  check("올바른 웹훅은 200", (await webhook("discussion_comment", { action: "created", discussion: { number: 101 } })) === 200);
  q101 = await page("/q/101");
  check("웹훅 직후 첫 요청에서 새 답변 표시", q101.text.includes("웹훅으로 들어온 답변"), `${Date.now() - sentAt}ms`);

  const polled = await (await fetch(`${BASE}/api/questions/101/answers`, { cache: "no-store" })).json();
  check("폴링 API에도 새 답변 포함", polled.some((t) => t.answer.id === "A2"), `${polled.length}건`);

  // 배포 직후 각 페이지는 처음 다시 그려질 때 한 번 새로 조회한다(빌드 때 캐시는 실행 중 메모리 캐시에 없음).
  // 그 뒤로는 질문 단위로만 갱신되는지 확인한다.
  await page("/q/102");
  data[1].answers.push(answer("B2", 102, "둘에 몰래 추가된 답변", "2026-10-02T02:00:00Z"));
  save();
  await webhook("discussion_comment", { action: "created", discussion: { number: 101 } });
  check("부분 갱신: 101 웹훅으로는 102의 새 데이터를 가져오지 않음", !(await page("/q/102")).text.includes("둘에 몰래 추가된 답변"));
  await webhook("discussion_comment", { action: "created", discussion: { number: 102 } });
  check("102 웹훅을 받으면 102가 갱신됨", (await page("/q/102")).text.includes("둘에 몰래 추가된 답변"));

  data.push({ question: question(103, "AI", "E2E 새로 올라온 질문"), answers: [] });
  save();
  check("새 질문 웹훅(discussion created)은 200", (await webhook("discussion", { action: "created", discussion: { number: 103 } })) === 200);
  const q103 = await page("/q/103");
  check("빌드 때 없던 새 질문 페이지가 열림", q103.status === 200 && q103.text.includes("E2E 새로 올라온 질문"));
  check("홈 목록에 새 질문이 나타남", (await page("/")).text.includes('href="/q/103"'));

  data.splice(1, 1);
  save();
  check("삭제 웹훅은 200", (await webhook("discussion", { action: "deleted", discussion: { number: 102 } })) === 200);
  check("삭제된 질문은 404", (await page("/q/102")).status === 404);
} finally {
  server.kill();
}

console.table(results);
process.exit(results.every((r) => r.결과 === "통과") ? 0 : 1);
