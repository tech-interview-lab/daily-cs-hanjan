// 웹훅 직후 첫 방문과 이후 방문의 응답 시간을 비교한다. 로컬에서 실제 GitHub 데이터로 쓴다.
// 사용법: GITHUB_TOKEN=... GITHUB_WEBHOOK_SECRET=s node scripts/measure-first-visit.mjs <baseUrl> <질문 번호> <기존 댓글 node_id> [횟수=3]
// 서버는 같은 GITHUB_WEBHOOK_SECRET으로 미리 띄워 둔다. 댓글 ID는 존재하는 댓글이어야 "comment-present" 확인을 통과한다.
import { createHmac } from "node:crypto";

const [base, number, commentId, roundsArg = "3"] = process.argv.slice(2);
const secret = process.env.GITHUB_WEBHOOK_SECRET;
if (!base || !number || !commentId || !secret) {
  console.error("사용법: GITHUB_WEBHOOK_SECRET=... node scripts/measure-first-visit.mjs <baseUrl> <번호> <댓글 node_id> [횟수]");
  process.exit(2);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const timed = async (path) => {
  const start = performance.now();
  const res = await fetch(base + path);
  await res.text();
  return { ms: Math.round(performance.now() - start), status: res.status };
};
const hook = async () => {
  const body = JSON.stringify({ action: "created", discussion: { number: Number(number) }, comment: { node_id: commentId, body: "x" } });
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return (await fetch(`${base}/api/webhooks/github`, {
    method: "POST", headers: { "x-github-event": "discussion_comment", "x-hub-signature-256": signature }, body,
  })).status;
};

const q = `/q/${number}`;
const rows = [];
for (let round = 1; round <= Number(roundsArg); round++) {
  await timed(q);
  const hookStatus = await hook();
  const waits = [];
  const afterWarm = [];
  // 웹훅 응답 직후부터 방문 시간을 잰다. 미리 채우기가 끝나기 전에 온 방문이 얼마나 느린지도 같이 본다
  for (const delay of [0, 1500, 4000, 8000]) {
    await sleep(delay === 0 ? 0 : delay - (waits.at(-1)?.at ?? 0));
    const r = await timed(q);
    waits.push({ at: delay, ...r });
  }
  const home = await timed("/");
  rows.push({ 라운드: round, 웹훅: hookStatus, "즉시": waits[0].ms, "1.5초 뒤": waits[1].ms, "4초 뒤": waits[2].ms, "8초 뒤": waits[3].ms, 홈: home.ms });
}
console.table(rows);
