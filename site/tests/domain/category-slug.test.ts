import { describe, expect, it } from "vitest";
import { findCategoryBySlug, toCategorySlug } from "@/domain/policies/category-slug";

describe("category slug", () => {
  it("알려진 카테고리는 영문 고정 slug를 쓴다", () => {
    expect(["CS", "네트워크", "데이터베이스", "시스템설계", "AI", "협업"].map(toCategorySlug)).toEqual([
      "cs", "network", "database", "system-design", "ai", "collaboration",
    ]);
  });

  it("모르는 카테고리는 이름을 그대로 slug로 쓴다", () => {
    expect(toCategorySlug("보안")).toBe("보안");
  });

  it("slug로 카테고리를 찾는다", () => {
    expect(findCategoryBySlug("network", ["CS", "네트워크"])).toBe("네트워크");
    expect(findCategoryBySlug("보안", ["보안"])).toBe("보안");
    expect(findCategoryBySlug("nope", ["CS"])).toBeNull();
  });
});
