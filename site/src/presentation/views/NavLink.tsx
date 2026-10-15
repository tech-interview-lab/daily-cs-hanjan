"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, className, children }: { readonly href: string; readonly className?: string; readonly children: ReactNode }) {
  const current = usePathname() === href;
  return (
    <Link href={href} className={className} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
