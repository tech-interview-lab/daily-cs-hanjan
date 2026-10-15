"use client";

import { useEffect, useState } from "react";
import styles from "./controls.module.css";
import { MoonIcon, SunIcon } from "./icons";

type Theme = "light" | "dark";

const STORAGE_KEY = "hanjan-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// 저장된 선택이 없으면 OS 설정을 따른다. 버튼을 누르면 그때부터 선택한 테마로 고정한다.
function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    const media = window.matchMedia(DARK_QUERY);
    const follow = () => setTheme(currentTheme());
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  const label = theme === null ? "테마 전환" : theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <button
      type="button"
      className={`${styles.iconButton} js-only`}
      data-theme-toggle=""
      aria-label={label}
      title={label}
      onClick={() => {
        const next: Theme = currentTheme() === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(STORAGE_KEY, next);
        } catch {
          // 저장소를 쓸 수 없으면 이번 방문에만 적용한다.
        }
        setTheme(next);
      }}
    >
      {/* 아이콘은 CSS가 현재 테마로 고른다. JS 실행 전 첫 화면에서도 맞는 아이콘이 보인다 */}
      <span className={styles.whenLight}><MoonIcon /></span>
      <span className={styles.whenDark}><SunIcon /></span>
    </button>
  );
}

export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;d.setAttribute("data-js","");try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}})();`;
