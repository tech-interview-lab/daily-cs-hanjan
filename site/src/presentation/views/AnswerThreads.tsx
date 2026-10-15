"use client";

import { useEffect, useRef, useState } from "react";
import { mergeNewThreads } from "../presenters/merge-threads";
import type { AnswerVM, ThreadVM } from "../viewmodels";
import { Avatar } from "./Avatar";
import styles from "./detail.module.css";
import prose from "./prose.module.css";

const POLL_INTERVAL_MS = 15_000;

function AuthorName({ answer }: { readonly answer: AnswerVM }) {
  return answer.authorHref ? <a href={answer.authorHref}>{answer.authorLabel}</a> : answer.authorLabel;
}
const MAX_FAILURES = 3;

type Props = {
  readonly initialThreads: readonly ThreadVM[];
  readonly pollUrl: string;
  readonly discussionUrl: string;
};

export function AnswerThreads({ initialThreads, pollUrl, discussionUrl }: Props) {
  const [threads, setThreads] = useState<readonly ThreadVM[]>(initialThreads);
  const [failures, setFailures] = useState(0);
  const threadsRef = useRef(threads);
  threadsRef.current = threads;

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(pollUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        const latest = (await response.json()) as ThreadVM[];
        if (cancelled) return;
        const merged = mergeNewThreads(threadsRef.current, latest);
        if (merged.newAnswers || merged.newReplies || merged.edited || merged.removed) {
          setThreads(merged.threads);
        }
        setFailures(0);
      } catch {
        if (!cancelled) setFailures((count) => count + 1);
      }
    }

    const timer = setInterval(poll, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollUrl]);

  return (
    <section aria-labelledby="answers-title">
      <h2 id="answers-title" className={styles.answersTitle}>답변 {threads.length}</h2>
      {threads.length === 0 ? (
        <p className={styles.empty}>
          아직 답변이 없습니다. <a href={discussionUrl}>Discussions에서 첫 답변을 남겨 보세요</a>.
        </p>
      ) : (
        <ol className={styles.threads} data-columns={threads.length >= 2 ? 2 : 1}>
          {threads.map(({ answer, replies }) => (
            <li key={answer.id} className={styles.card}>
              <article aria-labelledby={`answer-${answer.id}`}>
                <div className={styles.cardHeader}>
                  <h3 id={`answer-${answer.id}`} className={styles.author} data-deleted={answer.authorDeleted ? "" : undefined}>
                    <Avatar src={answer.authorAvatarUrl} name={answer.authorDeleted ? null : answer.authorLabel} />
                    <AuthorName answer={answer} />
                  </h3>
                  <time className={styles.time} dateTime={answer.dateTime}>{answer.dateText}</time>
                  {answer.isNew && <span className={styles.newLabel}>새 답변</span>}
                  {answer.isEdited && <span className={styles.newLabel}>수정됨</span>}
                </div>
                {answer.bodyHtml && <div className={prose.prose} dangerouslySetInnerHTML={{ __html: answer.bodyHtml }} />}
                {replies.length > 0 && (
                  <section className={styles.replies} aria-label={`${answer.authorLabel}의 답변에 달린 답글`}>
                    <h4 className={styles.repliesTitle}>답글 {replies.length}</h4>
                    <ol className={styles.replyList}>
                      {replies.map((reply) => (
                        <li key={reply.id}>
                          <div className={styles.replyHeader}>
                            <span className={styles.replyAuthor} data-deleted={reply.authorDeleted ? "" : undefined}>
                              <Avatar src={reply.authorAvatarUrl} name={reply.authorDeleted ? null : reply.authorLabel} />
                              <AuthorName answer={reply} />
                            </span>
                            <time className={styles.time} dateTime={reply.dateTime}>{reply.dateText}</time>
                            {reply.isNew && <span className={styles.newLabel}>새 답글</span>}
                            {reply.isEdited && <span className={styles.newLabel}>수정됨</span>}
                          </div>
                          {reply.bodyHtml && <div className={prose.prose} dangerouslySetInnerHTML={{ __html: reply.bodyHtml }} />}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </article>
            </li>
          ))}
        </ol>
      )}
      {failures >= MAX_FAILURES && (
        <p className={styles.error} role="status">새 답변을 불러오지 못했습니다. 새로고침해 주세요.</p>
      )}
    </section>
  );
}
