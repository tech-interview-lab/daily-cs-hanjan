import { describe, expect, it } from "vitest";
import { extractCategory } from "@/domain/policies/category-extractor";

describe("extractCategory", () => {
  it("제목의 [카테고리] 접두어를 추출한다", () => {
    expect(extractCategory("[네트워크] 2026-10-12 오늘의 질문")).toBe("네트워크");
    expect(extractCategory("[AI] 2026-09-26 오늘의 질문")).toBe("AI");
  });

  it("접두어가 없으면 null이다 (공지 등 질문이 아닌 글)", () => {
    expect(extractCategory("📌 CS한잔 스터디 그라운드룰")).toBeNull();
  });

  it("제목 중간의 대괄호는 카테고리가 아니다", () => {
    expect(extractCategory("오늘의 [질문]")).toBeNull();
  });

  it("빈 대괄호는 null이다", () => {
    expect(extractCategory("[ ] 제목")).toBeNull();
    expect(extractCategory("[] 제목")).toBeNull();
  });
});
