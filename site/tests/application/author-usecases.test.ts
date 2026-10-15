import { describe, expect, it } from "vitest";
import { listAnswersByAuthor, listAuthors } from "@/application/usecases/list-authors";
import { listQuestionsByCategory } from "@/application/usecases/list-questions-by-category";
import { listCategories } from "@/application/usecases/list-categories";
import { createSampleSource } from "../support/sample-source";

describe("listAuthors", () => {
  it("작성자별 답변 수를 세고 많은 순으로 정렬한다", async () => {
    const authors = await listAuthors(await createSampleSource());
    expect(authors.map((a) => [a.login, a.answerCount])).toEqual([
      ["00kang", 1], ["lapera00", 1], ["rn1217", 1],
    ]);
  });

  it("마감 댓글(YunDaeHyeon), 답글(ssun4098), 탈퇴 계정은 세지 않는다", async () => {
    const logins = (await listAuthors(await createSampleSource())).map((a) => a.login);
    expect(logins).not.toContain("YunDaeHyeon");
    expect(logins).not.toContain("ssun4098");
  });

  it("작성자별 답변 수의 합 + 탈퇴 계정 답변 수 = 전체 답변 수 (FR-2)", async () => {
    const source = await createSampleSource();
    const authorSum = (await listAuthors(source)).reduce((sum, a) => sum + a.answerCount, 0);
    let total = 0;
    for (const category of await listCategories(source)) {
      for (const q of (await listQuestionsByCategory(source, category.slug))!.questions) total += q.answerCount;
    }
    const deleted = (await source.fetchAll()).flatMap((i) => i.answers).filter((a) => a.parentId === null && a.author === null).length;
    expect(authorSum + deleted).toBe(total);
    expect(deleted).toBe(1);
  });

  it("아바타 주소를 함께 담는다(없으면 null)", async () => {
    const authors = await listAuthors(await createSampleSource());
    expect(authors.find((a) => a.login === "lapera00")?.avatarUrl).toMatch(/^https:/);
    expect(authors.find((a) => a.login === "rn1217")?.avatarUrl).toBeNull();
  });
});

describe("listAnswersByAuthor", () => {
  it("작성자의 답변을 질문 정보와 함께 최신순으로 돌려준다", async () => {
    const result = await listAnswersByAuthor(await createSampleSource(), "lapera00");
    expect(result?.login).toBe("lapera00");
    expect(result?.answers.map((a) => [a.answer.id, a.question.number, a.question.categorySlug])).toEqual([["C_2_1", 2, "network"]]);
  });

  it("로그인 대소문자를 구분하지 않고 원래 표기를 돌려준다", async () => {
    expect((await listAnswersByAuthor(await createSampleSource(), "LAPERA00"))?.login).toBe("lapera00");
  });

  it("답변이 없는 사용자(답글만 단 사용자 포함)는 null이다", async () => {
    const source = await createSampleSource();
    expect(await listAnswersByAuthor(source, "nobody")).toBeNull();
    expect(await listAnswersByAuthor(source, "ssun4098")).toBeNull();
  });
});
