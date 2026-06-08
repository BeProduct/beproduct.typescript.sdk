import { describe, it, expect } from "vitest";
import { z } from "zod";
import { deepNullable } from "../../src/schemas/nullable.js";

describe("deepNullable", () => {
  it("allows null on a top-level primitive field", () => {
    const s = deepNullable(z.object({ id: z.string() }));
    expect(s.parse({ id: null })).toEqual({ id: null });
    expect(s.parse({ id: "x" })).toEqual({ id: "x" });
  });

  it("allows null on nested object fields", () => {
    const s = deepNullable(z.object({ a: z.object({ b: z.string() }) }));
    expect(() => s.parse({ a: { b: null } })).not.toThrow();
    expect(() => s.parse({ a: null })).not.toThrow();
  });

  it("allows null on array items and their fields", () => {
    const s = deepNullable(z.object({ rows: z.array(z.object({ id: z.string() })) }));
    expect(() => s.parse({ rows: [{ id: null }] })).not.toThrow();
    expect(() => s.parse({ rows: null })).not.toThrow();
  });

  it("preserves passthrough (unknown keys never fail)", () => {
    const s = deepNullable(z.object({ id: z.string() }));
    const out = s.parse({ id: "x", extra: 123 }) as Record<string, unknown>;
    expect(out.extra).toBe(123);
  });

  it("keeps optional fields optional", () => {
    const s = deepNullable(z.object({ id: z.string(), name: z.string().optional() }));
    expect(() => s.parse({ id: "x" })).not.toThrow();
    expect(() => s.parse({ id: "x", name: null })).not.toThrow();
  });

  it("only loosens — still accepts originally-valid input", () => {
    const original = z.object({ id: z.string(), n: z.number(), tags: z.array(z.string()) });
    const loosened = deepNullable(original);
    const valid = { id: "a", n: 1, tags: ["x", "y"] };
    expect(loosened.parse(valid)).toEqual(valid);
  });
});
