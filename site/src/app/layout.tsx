import type { Metadata } from "next";
import type { ReactNode } from "react";
import { renderRootLayout, SITE_NAME } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: "CS 면접 스터디 CS한잔의 질문과 답변 모음",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return renderRootLayout(getContainer(), children);
}
