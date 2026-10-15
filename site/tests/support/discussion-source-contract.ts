import { describe, expect, it } from "vitest";
import type { DiscussionSource } from "@/application/ports/discussion-source";

export function runDiscussionSourceContract(name: string, create: () => Promise<DiscussionSource> | DiscussionSource) {
  describe(`DiscussionSource 계약: ${name}`, () => {
    it("fetchAll은 질문을 번호가 중복 없이 반환하고 모든 질문에 카테고리가 있다", async () => {
      const items = await (await create()).fetchAll();
      const numbers = items.map((i) => i.question.number);
      expect(items.length).toBeGreaterThan(0);
      expect(new Set(numbers).size).toBe(numbers.length);
      for (const { question } of items) expect(question.category).not.toBe("");
    });

    it("모든 답변은 자기 질문 번호를 가지고 id가 중복되지 않는다", async () => {
      const items = await (await create()).fetchAll();
      for (const { question, answers } of items) {
        const ids = answers.map((a) => a.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const answer of answers) expect(answer.questionNumber).toBe(question.number);
      }
    });

    it("대댓글의 parentId는 같은 질문 안의 답변을 가리킨다", async () => {
      const items = await (await create()).fetchAll();
      for (const { answers } of items) {
        const ids = new Set(answers.map((a) => a.id));
        for (const answer of answers) if (answer.parentId) expect(ids.has(answer.parentId)).toBe(true);
      }
    });

    it("fetchOne은 fetchAll의 같은 질문과 내용이 같다", async () => {
      const source = await create();
      const all = await source.fetchAll();
      for (const item of all) expect(await source.fetchOne(item.question.number)).toEqual(item);
    });

    it("없는 번호는 fetchOne이 null이다", async () => {
      const source = await create();
      expect(await source.fetchOne(99999)).toBeNull();
    });
  });
}
