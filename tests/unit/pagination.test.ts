import { describe, it, expect } from "vitest";
import { paginate, collectAll } from "../../src/pagination.js";

describe("paginate", () => {
  it("iterates single page", async () => {
    const items = await collectAll(
      paginate(10, async () => ({ result: [1, 2, 3], total: 3 })),
    );
    expect(items).toEqual([1, 2, 3]);
  });

  it("iterates multiple pages (0-based page numbers)", async () => {
    const pages: number[] = [];
    const items = await collectAll(
      paginate(2, async (_ps, pn) => {
        pages.push(pn);
        if (pn === 0) return { result: ["a", "b"], total: 5 };
        if (pn === 1) return { result: ["c", "d"], total: 5 };
        return { result: ["e"], total: 5 };
      }),
    );
    expect(items).toEqual(["a", "b", "c", "d", "e"]);
    expect(pages).toEqual([0, 1, 2]); // 0-based, matching Python SDK
  });

  it("handles empty results", async () => {
    const items = await collectAll(
      paginate(10, async () => ({ result: [], total: 0 })),
    );
    expect(items).toEqual([]);
  });

  it("stops when processed >= total even if page has fewer items", async () => {
    const items = await collectAll(
      paginate(10, async (_ps, pn) => {
        if (pn === 0) return { result: [1, 2], total: 2 };
        throw new Error("should not fetch page 1");
      }),
    );
    expect(items).toEqual([1, 2]);
  });
});
