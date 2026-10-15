import Link from "next/link";
import styles from "./page.module.css";

export function NotFoundView() {
  return (
    <div className={styles.intro}>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p className={styles.lead}>주소가 바뀌었거나 없는 페이지입니다.</p>
      <p className={styles.lead}><Link href="/">홈으로 가기</Link></p>
    </div>
  );
}
