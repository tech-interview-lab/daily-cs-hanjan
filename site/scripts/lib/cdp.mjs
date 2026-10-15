// Chrome DevTools 프로토콜 최소 클라이언트. 의존성 없이 Node 내장 WebSocket을 쓴다.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome(port = 9333) {
  const chrome = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "hanjan-chrome-"))}`, "about:blank",
  ], { stdio: "ignore" });

  let wsUrl;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      wsUrl = targets.find((t) => t.type === "page")?.webSocketDebuggerUrl;
    } catch {}
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error("Chrome에 연결하지 못했습니다.");

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0;
  const pending = new Map();
  const listeners = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) listeners.forEach((l) => l(msg));
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  const waitFor = (method) => new Promise((resolve) => {
    const l = (msg) => { if (msg.method === method) { listeners.splice(listeners.indexOf(l), 1); resolve(msg); } };
    listeners.push(l);
  });
  const evaluate = async (expression) =>
    (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;
  const key = async (k, code = k, keyCode = 0) => {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: keyCode });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: keyCode });
  };
  const open = async (url) => {
    const loaded = waitFor("Page.loadEventFired");
    await send("Page.navigate", { url });
    await loaded;
    await evaluate("document.fonts.ready.then(() => true)");
    // 스트리밍(Suspense)으로 늦게 온 내용은 숨겨진 상자에 있다가 교체된다. 교체가 끝날 때까지 기다린다(최대 3초)
    await evaluate(`new Promise((resolve) => {
      const start = Date.now();
      const tick = () => (!document.querySelector('div[hidden][id^="S:"]') || Date.now() - start > 3000) ? resolve(true) : setTimeout(tick, 50);
      tick();
    })`);
    await sleep(150);
  };
  const viewport = (width, theme = "light", height = 900) => Promise.all([
    send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 }),
    send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] }),
  ]);

  await send("Page.enable");
  await send("Runtime.enable");
  const close = () => { ws.close(); chrome.kill(); };
  return { send, evaluate, key, open, viewport, close };
}

export async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await sleep(500);
  }
  throw new Error(`서버가 응답하지 않습니다: ${url}`);
}
