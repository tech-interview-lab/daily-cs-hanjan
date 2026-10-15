import type { Metadata } from "next";
import { authorStaticParams, authorTitle, renderAuthor } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

type Props = { params: Promise<{ login: string }> };

export function generateStaticParams() {
  return authorStaticParams(getContainer());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await authorTitle(getContainer(), decodeURIComponent((await params).login)) };
}

export default async function AuthorPage({ params }: Props) {
  return renderAuthor(getContainer(), decodeURIComponent((await params).login));
}
