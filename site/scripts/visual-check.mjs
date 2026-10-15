// 사용법: node scripts/visual-check.mjs <baseUrl> <outDir> <path...>  (VIEWPORT_ONLY=1이면 첫 화면만 캡처)
// 폭 4개 × 라이트/다크로 캡처하고 가로 넘침, 대비, 접근 가능한 이름, 키보드 동작을 측정한다.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launchChrome, sleep } from "./lib/cdp.mjs";

const [baseUrl, outDir, ...paths] = process.argv.slice(2);
if (!baseUrl || !outDir || paths.length === 0) {
  console.error("사용법: node scripts/visual-check.mjs <baseUrl> <outDir> <path...>");
  process.exit(2);
}

const WIDTHS = [375, 768, 1024, 1440];
const THEMES = ["light", "dark"];

mkdirSync(outDir, { recursive: true });
const { send, evaluate, key, open, viewport, close } = await launchChrome();

const PAGE_CHECKS = `(() => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const [r,g,b] = m.slice(0,3).map(v => { v/=255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; }); return 0.2126*r + 0.7152*g + 0.0722*b; };
  const alpha = (c) => { const m = c.match(/[\\d.]+/g); return m.length > 3 ? Number(m[3]) : 1; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const bg = getComputedStyle(e).backgroundColor; if (alpha(bg) > 0.5) return bg; } return getComputedStyle(document.body).backgroundColor; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !el.closest(".visually-hidden") && !el.closest("dialog:not([open])"); };
  const textEls = [...document.querySelectorAll("body *")].filter(el => visible(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  let worst = { ratio: 99 };
  for (const el of textEls) {
    const fg = getComputedStyle(el).color, bg = bgOf(el), r = ratio(fg, bg);
    if (r < worst.ratio) worst = { ratio: Math.round(r * 100) / 100, text: el.textContent.trim().slice(0, 30), fg, bg };
  }
  const vw = document.documentElement.clientWidth;
  const overflowing = [...document.querySelectorAll("body *")].filter(el => visible(el) && !el.closest("pre, table") && el.getBoundingClientRect().right > vw + 1).map(el => el.tagName.toLowerCase() + "." + el.className).slice(0, 5);
  const unnamedButtons = [...document.querySelectorAll("button, a")].filter(el => visible(el) && !(el.getAttribute("aria-label") || el.textContent.trim())).length;
  return {
    title: document.title,
    h1: document.querySelectorAll("h1").length,
    horizontalScroll: document.documentElement.scrollWidth > vw,
    overflowing,
    unnamedButtons,
    minContrast: worst,
    theme: getComputedStyle(document.documentElement).colorScheme,
  };
})()`;

const report = [];
for (const path of paths) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      await viewport(width, theme);
      await open(baseUrl + path);
      const checks = await evaluate(PAGE_CHECKS);
      const name = `${path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-")}-${theme}-${width}`;
      const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: process.env.VIEWPORT_ONLY !== "1" });
      writeFileSync(join(outDir, `${name}.png`), Buffer.from(shot.data, "base64"));
      report.push({ path, theme, width, ...checks });
    }
  }
}

// 키보드: 첫 Tab은 본문 바로가기, 모바일 메뉴는 열면 첫 링크로 포커스, Esc로 닫히면 메뉴 버튼으로 복귀
await viewport(375, "light");
await open(baseUrl + paths[0]);
await key("Tab", "Tab", 9);
const firstTab = await evaluate("document.activeElement.textContent.trim()");
await evaluate("document.querySelector('[aria-controls=site-menu]').click(), true");
await sleep(100);
const menu = await evaluate("({ open: document.getElementById('site-menu').open, focused: document.activeElement.textContent.trim().slice(0, 20), expanded: document.querySelector('[aria-controls=site-menu]').getAttribute('aria-expanded') })");
await key("Escape", "Escape", 27);
await sleep(100);
const afterClose = await evaluate("({ open: document.getElementById('site-menu').open, focusedLabel: document.activeElement.getAttribute('aria-label') })");

// 테마 전환: 시스템 → 라이트 → 다크 → 시스템, 새로고침 후 유지
const toggle = "document.querySelector('button[aria-label^=\"테마\"]')";
const themeSteps = [];
for (let i = 0; i < 3; i++) {
  await evaluate(`${toggle}.click(), true`);
  await sleep(50);
  themeSteps.push(await evaluate(`(document.documentElement.dataset.theme || "system") + " / " + ${toggle}.getAttribute("aria-label")`));
}
await evaluate(`${toggle}.click(), true`);
await open(baseUrl + paths[0]);
const persisted = await evaluate("document.documentElement.dataset.theme || 'system'");

const keyboard = { firstTab, menu, afterClose, themeSteps, persistedAfterReload: persisted };
writeFileSync(join(outDir, "report.json"), JSON.stringify({ report, keyboard }, null, 2));
console.log(JSON.stringify({ keyboard }, null, 2));
console.table(report.map(({ path, theme, width, h1, horizontalScroll, overflowing, unnamedButtons, minContrast }) => ({
  path, theme, width, h1, horizontalScroll, overflow: overflowing.length, unnamedButtons, minContrast: minContrast.ratio,
})));
close();
