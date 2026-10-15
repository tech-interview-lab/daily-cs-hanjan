import type { CategoryPageVM } from "../viewmodels";
import styles from "./page.module.css";
import { QuestionList } from "./QuestionList";

export function CategoryView({ vm }: { readonly vm: CategoryPageVM }) {
  return (
    <>
      <div className={styles.intro}>
        <h1>{vm.title}</h1>
        <p className={styles.lead}>{vm.countText}</p>
      </div>
      <section aria-labelledby="questions-title">
        <h2 id="questions-title" className="visually-hidden">질문 목록</h2>
        <QuestionList items={vm.questions} />
      </section>
    </>
  );
}
