import Link from "next/link";
import type { QuestionItemVM } from "../viewmodels";
import styles from "./question.module.css";

export function QuestionList({ items }: { readonly items: readonly QuestionItemVM[] }) {
  if (items.length === 0) return <p className={styles.empty}>아직 질문이 없습니다.</p>;
  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.number} className={styles.item}>
          <div className={styles.meta}>
            <a href={item.categoryHref} className={styles.badge}>{item.categoryLabel}</a>
            <time dateTime={item.dateTime}>{item.dateText}</time>
            <span className={styles.status} data-open={item.statusLabel === "진행 중" ? "" : undefined}>{item.statusLabel}</span>
          </div>
          <h3 className={styles.title}>
            <Link href={item.href}>{item.text}</Link>
          </h3>
          <p className={styles.answers}>{item.answerCountText}</p>
        </li>
      ))}
    </ol>
  );
}
