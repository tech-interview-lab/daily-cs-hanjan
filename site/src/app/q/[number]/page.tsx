import type { Metadata } from "next";
import { questionStaticParams, questionTitle, renderQuestion } from "@/presentation/controllers";
import { getContainer } from "@/main/container";

type Props = { params: Promise<{ number: string }> };

export function generateStaticParams() {
  return questionStaticParams(getContainer());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await questionTitle(getContainer(), (await params).number) };
}

export default async function QuestionPage({ params }: Props) {
  return renderQuestion(getContainer(), (await params).number);
}
