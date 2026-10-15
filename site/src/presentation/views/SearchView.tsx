import Link from "next/link";
import type { SearchPageVM } from "../viewmodels";
import { CategoryChips } from "./CategoryNav";
import page from "./page.module.css";
import question from "./question.module.css";
import styles from "./search.module.css";

type Segments = readonly { readonly text: string; readonly match: boolean }[];

function Highlighted({ segments }: { readonly segments: Segments }) {
  return segments.map((segment, i) => (segment.match ? <mark key={i}>{segment.text}</mark> : <span key={i}>{segment.text}</span>));
}

export function SearchForm({ query }: { readonly query: string }) {
  return (
    <form action="/search" method="get" role="search" className={styles.form}>
      <label htmlFor="search-page-input" className="visually-hidden">질문과 답변 검색</label>
      <input id="search-page-input" className={styles.input} type="search" name="q" defaultValue={query}
        placeholder="예: 캐시, TCP, 정규화" maxLength={100} autoComplete="off" />
      <button type="submit" className={styles.button}>검색</button>
    </form>
  );
}

export function SearchView({ vm }: { readonly vm: SearchPageVM }) {
  return (
    <>
      <div className={page.intro}>
        <h1>검색</h1>
        <p className={page.lead}>질문 문장과 답변 본문에서 찾습니다.</p>
        <SearchForm query={vm.query} />
      </div>
      {vm.query === "" ? (
        vm.categories.length > 0 && <CategoryChips items={vm.categories} />
      ) : vm.results.length === 0 ? (
        <>
          <p className={styles.empty}>"{vm.query}"에 대한 결과가 없습니다. 다른 단어로 검색하거나 카테고리에서 찾아보세요.</p>
          {vm.categories.length > 0 && <CategoryChips items={vm.categories} />}
        </>
      ) : (
        <section aria-labelledby="search-results-title">
          <h2 id="search-results-title" className={styles.summary}>{vm.summary}</h2>
          <ol className={styles.results}>
            {vm.results.map((result) => (
              <li key={result.number} className={question.item}>
                <div className={question.meta}>
                  <Link href={result.categoryHref} className={question.badge}>{result.categoryLabel}</Link>
                  <time dateTime={result.dateTime}>{result.dateText}</time>
                </div>
                <h3 className={`${question.title} ${styles.excerptText}`}>
                  <Link href={result.href}><Highlighted segments={result.titleSegments} /></Link>
                </h3>
                {result.excerpts.length > 0 && <ul className={styles.excerpts}>
                  {result.excerpts.map((excerpt, i) => (
                    <li key={i}>
                      <span className={styles.excerptLabel}>{excerpt.label}</span>
                      <span className={styles.excerptText}><Highlighted segments={excerpt.segments} /></span>
                    </li>
                  ))}
                </ul>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
