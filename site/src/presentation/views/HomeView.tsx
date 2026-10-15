import type { HomeVM } from "../viewmodels";
import { CategoryChips } from "./CategoryNav";
import styles from "./page.module.css";
import { QuestionList } from "./QuestionList";

export function HomeView({ vm }: { readonly vm: HomeVM }) {
  return (
    <>
      <div className={styles.intro}>
        <h1>CS한잔</h1>
        <p className={styles.lead}>매일 아침 올라오는 CS 면접 질문과 스터디원들의 답변을 모아 봅니다.</p>
      </div>
      <div className={styles.section}>
        <CategoryChips items={vm.categories} />
      </div>
      <section className={styles.section} aria-labelledby="recent-title">
        <h2 id="recent-title" className={styles.sectionTitle}>최근 질문</h2>
        <QuestionList items={vm.recentQuestions} />
      </section>
    </>
  );
}
