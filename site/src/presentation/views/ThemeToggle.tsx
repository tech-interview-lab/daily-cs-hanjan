"use client";

import { useEffect, useState } from "react";
import styles from "./controls.module.css";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "hanjan-theme";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Mode, string> = { system: "시스템", light: "라이트", dark: "다크" };
const TO: Record<Mode, string> = { system: "시스템으로", light: "라이트로", dark: "다크로" };

function readMode(): Mode {
  const value = document.documentElement.dataset.theme;
  return value === "light" || value === "dark" ? value : "system";
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  if (mode === "system") delete root.dataset.theme;
  else root.dataset.theme = mode;
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // 저장소를 쓸 수 없으면 이번 방문에만 적용한다.
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => setMode(readMode()), []);

  const label = `테마: ${LABEL[mode]}. 누르면 ${TO[NEXT[mode]]} 바뀝니다`;
  const Icon = mode === "light" ? SunIcon : mode === "dark" ? MoonIcon : MonitorIcon;

  return (
    <button
      type="button"
      className={`${styles.iconButton} js-only`}
      aria-label={label}
      title={label}
      onClick={() => {
        const next = NEXT[mode];
        applyMode(next);
        setMode(next);
      }}
    >
      <Icon />
    </button>
  );
}

export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})();`;
