import type { Metadata } from "next";
import { renderSearch } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

export const metadata: Metadata = { title: "검색" };

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  return renderSearch(getContainer(), searchParams);
}
