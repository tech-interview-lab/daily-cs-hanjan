import type { Metadata } from "next";
import { categoryStaticParams, categoryTitle, renderCategory } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return categoryStaticParams(getContainer());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await categoryTitle(getContainer(), (await params).slug) };
}

export default async function CategoryPage({ params }: Props) {
  return renderCategory(getContainer(), (await params).slug);
}
