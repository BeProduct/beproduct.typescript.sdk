import { describe, it, expect } from "vitest";
import { subsetMatch } from "../integration/subset.js";

describe("subsetMatch", () => {
  it("matches when actual is an exact equal", () => {
    expect(subsetMatch({ a: 1 }, { a: 1 }).ok).toBe(true);
  });

  it("matches when actual is a superset object", () => {
    expect(subsetMatch({ a: 1 }, { a: 1, b: 2 }).ok).toBe(true);
  });

  it("fails when an expected key is missing", () => {
    const r = subsetMatch({ a: 1, b: 2 }, { a: 1 });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("missing expected key");
  });

  it("fails on scalar mismatch with a helpful path", () => {
    const r = subsetMatch({ a: { b: 1 } }, { a: { b: 2 } });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("$.a.b");
  });

  it("fails on type mismatch", () => {
    const r = subsetMatch({ a: 1 }, { a: "1" });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("type mismatch");
  });

  it("matches array items order-independently", () => {
    const expected = [{ id: "b" }, { id: "a" }];
    const actual = [{ id: "a", extra: 1 }, { id: "b" }, { id: "c" }];
    expect(subsetMatch(expected, actual).ok).toBe(true);
  });

  it("fails when an expected array item is absent", () => {
    const r = subsetMatch([{ id: "z" }], [{ id: "a" }, { id: "b" }]);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("no item in actual array matches");
  });

  it("treats https:// expected strings as prefix matches", () => {
    const expected = "https://cdn.example.com/storage/abc/1kb.jpg";
    const actual = "https://cdn.example.com/storage/abc/1kb.jpg?width=1000&sig=xyz";
    expect(subsetMatch(expected, actual).ok).toBe(true);
  });

  it("requires non-url strings to be exactly equal", () => {
    expect(subsetMatch("hello", "hello world").ok).toBe(false);
    expect(subsetMatch("hello", "hello").ok).toBe(true);
  });

  it("compares numbers regardless of int/float representation", () => {
    expect(subsetMatch(321, 321).ok).toBe(true);
    expect(subsetMatch(0.123, 0.123).ok).toBe(true);
  });

  it("matches null to null", () => {
    expect(subsetMatch({ a: null }, { a: null }).ok).toBe(true);
    expect(subsetMatch({ a: null }, { a: 1 }).ok).toBe(false);
  });

  it("recurses through nested structures (real fixture shape)", () => {
    const expected = {
      id: "text",
      value: "automation_test",
      type: "Text",
    };
    const actual = {
      id: "text",
      name: "Text",
      value: "automation_test",
      type: "Text",
      required: true,
    };
    expect(subsetMatch(expected, actual).ok).toBe(true);
  });
});
