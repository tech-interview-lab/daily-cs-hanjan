import Link from "next/link";
import type { ReactNode } from "react";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../styles/global.css";
import type { ShellVM } from "../viewmodels";
import { CategoryNav } from "./CategoryNav";
import { MobileMenu } from "./MobileMenu";
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
              <CategoryNav items={vm.categories} headingId="menu-categories" />
            </MobileMenu>
            <Link href="/" className={styles.siteName}>CS한잔</Link>
            <span className={styles.spacer} />
            <ThemeToggle />
          </div>
        </header>
        <div className={styles.layout}>
          <aside className={styles.sidebar} aria-label="사이트 메뉴">
            <CategoryNav items={vm.categories} headingId="sidebar-categories" />
          </aside>
          <main id="main" className={styles.main} tabIndex={-1}>
            {children}
          </main>
        </div>
        <footer className={styles.footer}>
          <ul className={styles.footerLinks}>
            <li><a href={vm.discussionsUrl}>원본 Discussions</a></li>
            <li><a href={vm.repositoryUrl}>저장소</a></li>
          </ul>
        </footer>
      </body>
    </html>
  );
}
