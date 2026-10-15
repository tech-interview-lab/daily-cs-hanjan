import Link from "next/link";
import type { QuestionDetailVM } from "../viewmodels";
import { AnswerThreads } from "./AnswerThreads";
import styles from "./detail.module.css";
import question from "./question.module.css";

export function QuestionDetailView({ vm }: { readonly vm: QuestionDetailVM }) {
  return (
    <div data-wide="">
      <header className={styles.header}>
        <div className={styles.meta}>
          <Link href={vm.categoryHref} className={question.badge}>{vm.categoryLabel}</Link>
          <time dateTime={vm.dateTime}>{vm.dateText}</time>
          <span className={question.status} data-open={vm.statusLabel === "진행 중" ? "" : undefined}>{vm.statusLabel}</span>
        </div>
        <h1 className={styles.title}>{vm.text}</h1>
        {vm.note && (
          <p className={styles.note}>
            <span className={styles.noteLabel}>출제 의도</span>
            {vm.note}
          </p>
        )}
        <p className={styles.source}>
          <a href={vm.discussionUrl}>Discussions에서 보기</a>
        </p>
      </header>
      <AnswerThreads initialThreads={vm.threads} pollUrl={vm.pollUrl} discussionUrl={vm.discussionUrl} />
    </div>
  );
}
