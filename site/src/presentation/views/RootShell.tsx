import Link from "next/link";
import type { ReactNode } from "react";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../styles/global.css";
import type { ShellVM } from "../viewmodels";
import { SiteNav } from "./CategoryNav";
import { MobileMenu } from "./MobileMenu";
import controls from "./controls.module.css";
import { SearchIcon } from "./icons";
import search from "./search.module.css";
import styles from "./shell.module.css";
import { THEME_INIT_SCRIPT, ThemeToggle } from "./ThemeToggle";

export function RootShell({ vm, children }: { readonly vm: ShellVM; readonly children: ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className={styles.skipLink}>본문 바로가기</a>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <MobileMenu>
              <SiteNav categories={vm.categories} authors={vm.authors} idPrefix="menu" />
            </MobileMenu>
            <Link href="/" className={styles.siteName}>CS한잔</Link>
            <span className={styles.spacer} />
            <form action="/search" method="get" role="search" className={search.headerSearch}>
              <label htmlFor="header-search-input" className="visually-hidden">질문과 답변 검색</label>
              <input id="header-search-input" className={search.input} type="search" name="q" placeholder="검색" maxLength={100} autoComplete="off" />
              <button type="submit" className={controls.iconButton} aria-label="검색"><SearchIcon /></button>
            </form>
            <Link href="/search" className={`${controls.iconButton} ${search.headerSearchLink}`} aria-label="검색">
              <SearchIcon />
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <SiteNav categories={vm.categories} authors={vm.authors} idPrefix="sidebar" />
          </aside>
          <main id="main" className={styles.main} tabIndex={-1}>
            {children}
          </main>
        </div>
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <ul className={styles.footerLinks}>
              <li><a href={vm.discussionsUrl}>원본 Discussions</a></li>
              <li><a href={vm.repositoryUrl}>저장소</a></li>
            </ul>
          </div>
        </footer>
      </body>
    </html>
  );
}
