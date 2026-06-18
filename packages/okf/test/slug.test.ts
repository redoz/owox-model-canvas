import { describe, it, expect } from "vitest";
import { slugify, parseFrontmatter, renderFrontmatter } from "../src/slug";

describe("slugify", () => {
  it("kebab-cases titles", () => expect(slugify("Facebook Ads Insights")).toBe("facebook-ads-insights"));
  it("falls back when empty", () => expect(slugify("", "n1")).toBe("n1"));
});
describe("frontmatter", () => {
  it("round-trips scalars, lists and nested owox block", () => {
    const fm = { type: "OWOX Data Mart", title: "A", tags: ["owox", "sql"],
      owox: { key: "a", inputSource: "SQL", position: { x: 1, y: 2 } } };
    const text = renderFrontmatter(fm);
    expect(parseFrontmatter("---\n" + text + "\n---\nbody").data).toEqual(fm);
  });
});
