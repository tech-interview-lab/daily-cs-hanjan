import Link from "next/link";
import type { AuthorPageVM } from "../viewmodels";
import { Avatar } from "./Avatar";
import styles from "./author.module.css";
import prose from "./prose.module.css";
import question from "./question.module.css";

export function AuthorView({ vm }: { readonly vm: AuthorPageVM }) {
  return (
    <>
      <header className={styles.header}>
        <Avatar src={vm.avatarUrl} name={vm.login} large />
        <div>
          <h1 className={styles.login}>{vm.login}</h1>
          <p className={styles.meta}>
            {vm.countText} · <a href={vm.profileUrl}>GitHub 프로필</a>
          </p>
        </div>
      </header>
      <section aria-labelledby="author-answers-title">
        <h2 id="author-answers-title" className="visually-hidden">답변 목록</h2>
        <ol className={styles.list}>
          {vm.answers.map((answer) => (
            <li key={answer.id} className={styles.item}>
              <article aria-labelledby={`author-answer-${answer.id}`}>
                <div className={question.meta}>
                  <Link href={answer.categoryHref} className={question.badge}>{answer.categoryLabel}</Link>
                  <time dateTime={answer.dateTime}>{answer.dateText}</time>
                </div>
                <h3 id={`author-answer-${answer.id}`} className={question.title}>
                  <Link href={answer.questionHref}>{answer.questionText}</Link>
                </h3>
                {answer.bodyHtml && (
                  <div className={`${prose.prose} ${styles.body}`} dangerouslySetInnerHTML={{ __html: answer.bodyHtml }} />
                )}
              </article>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
