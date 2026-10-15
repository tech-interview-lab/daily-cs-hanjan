"use client";

import { useRef, useState, type ReactNode } from "react";
import styles from "./controls.module.css";
import { CloseIcon, MenuIcon } from "./icons";

export function MobileMenu({ children }: { readonly children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.menuButton} js-only`}
        aria-label="사이트 메뉴 열기"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => {
          dialogRef.current?.showModal();
          setOpen(true);
          dialogRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
        }}
      >
        <MenuIcon />
      </button>
      <dialog
        ref={dialogRef}
        id="site-menu"
        aria-labelledby="site-menu-title"
        className={styles.dialog}
        onClose={() => {
          setOpen(false);
          buttonRef.current?.focus();
        }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target === dialogRef.current || target.closest("a")) close();
        }}
      >
        <div className={styles.dialogHeader}>
          <h2 id="site-menu-title" className={styles.dialogTitle}>메뉴</h2>
          <button type="button" className={styles.iconButton} aria-label="메뉴 닫기" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
