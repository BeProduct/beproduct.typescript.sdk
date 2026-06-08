import { expect } from "vitest";

export interface SubsetResult {
  ok: boolean;
  message: string;
}

function kindOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v; // "object" | "string" | "number" | "boolean" | "undefined"
}

/**
 * Recursive subset matcher — faithful TS port of the Python suite's
 * `is_subset_or_equals` (BeProduct.package/tests/test_helpers.py).
 *
 * - Objects: every key in `expected` must exist in `actual`; recurse on each.
 * - Arrays: every `expected` item must be found (by subset) somewhere in
 *   `actual`; order-independent.
 * - Strings starting with `https://`: `actual` must *start with* `expected`
 *   (handles signed / transient CDN URLs whose query/suffix varies).
 * - Other scalars: strict equality.
 *
 * Numbers are compared loosely vs. Python (JS has a single `number` type), so
 * `321` matches whether the API returns it as int or float.
 */
export function subsetMatch(expected: unknown, actual: unknown, path = "$"): SubsetResult {
  const ek = kindOf(expected);
  const ak = kindOf(actual);

  if (ek !== ak) {
    return { ok: false, message: `${path}: type mismatch — expected ${ek}, got ${ak} (${JSON.stringify(actual)})` };
  }

  switch (ek) {
    case "object": {
      const e = expected as Record<string, unknown>;
      const a = actual as Record<string, unknown>;
      for (const key of Object.keys(e)) {
        if (!(key in a)) {
          return { ok: false, message: `${path}: missing expected key "${key}"` };
        }
        const res = subsetMatch(e[key], a[key], `${path}.${key}`);
        if (!res.ok) return res;
      }
      return { ok: true, message: "" };
    }

    case "array": {
      const e = expected as unknown[];
      const a = actual as unknown[];
      for (let i = 0; i < e.length; i++) {
        const expectedItem = e[i];
        const found = a.some((actualItem) => subsetMatch(expectedItem, actualItem).ok);
        if (!found) {
          return {
            ok: false,
            message: `${path}[${i}]: no item in actual array matches ${JSON.stringify(expectedItem)}`,
          };
        }
      }
      return { ok: true, message: "" };
    }

    case "string": {
      const e = expected as string;
      const a = actual as string;
      if (e.startsWith("https://")) {
        return a.startsWith(e)
          ? { ok: true, message: "" }
          : { ok: false, message: `${path}: "${a}" does not start with expected URL "${e}"` };
      }
      return e === a
        ? { ok: true, message: "" }
        : { ok: false, message: `${path}: expected "${e}", got "${a}"` };
    }

    default: {
      return expected === actual
        ? { ok: true, message: "" }
        : { ok: false, message: `${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}` };
    }
  }
}

// ── vitest custom matcher ──────────────────────────────────────────────
expect.extend({
  toContainSubset(received: unknown, expected: unknown) {
    const { ok, message } = subsetMatch(expected, received);
    return {
      pass: ok,
      message: () =>
        ok
          ? `expected value NOT to contain subset, but it did`
          : `expected value to contain subset:\n${message}`,
    };
  },
});

interface ToContainSubset<R = unknown> {
  /** Assert `received` contains every field/element of `expected` (subset match). */
  toContainSubset(expected: unknown): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends ToContainSubset<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends ToContainSubset {}
}
