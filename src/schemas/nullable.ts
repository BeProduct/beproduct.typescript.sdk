import { z } from "zod";

/** Cast a zod internal node ($ZodType in v4) back to the public ZodTypeAny. */
const asAny = (s: unknown): z.ZodTypeAny => s as z.ZodTypeAny;

/**
 * Recursively rewrite a Zod schema so that every field (at every depth) also
 * accepts `null`. The BeProduct API frequently returns `null` for values the
 * happy-path schema declares as present; treating `null` as valid everywhere
 * keeps response parsing robust instead of throwing on each such field.
 *
 * This only ever *loosens* a schema (adds `null` as an accepted value and lets
 * objects carry unknown keys), so a payload that parsed before still parses.
 */
export function deepNullable(schema: z.ZodTypeAny): z.ZodTypeAny {
  // Unwrap wrappers, recurse into the inner type, then re-apply the wrapper.
  if (schema instanceof z.ZodOptional) {
    return deepNullable(asAny(schema.unwrap())).optional();
  }
  if (schema instanceof z.ZodNullable) {
    return deepNullable(asAny(schema.unwrap()));
  }
  if (schema instanceof z.ZodDefault) {
    return deepNullable(asAny(schema.removeDefault())).nullable();
  }

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, unknown>;
    const next: Record<string, z.ZodTypeAny> = {};
    for (const key of Object.keys(shape)) next[key] = deepNullable(asAny(shape[key]));
    // passthrough so unexpected extra keys never fail parsing
    return z.object(next).passthrough().nullable();
  }

  if (schema instanceof z.ZodArray) {
    return z.array(deepNullable(asAny(schema.element))).nullable();
  }

  if (schema instanceof z.ZodUnion) {
    const opts = (schema.options as unknown[]).map((o) => deepNullable(asAny(o)));
    return z.union(opts as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]).nullable();
  }

  // Leaf (string/number/boolean/record/unknown/…) — just allow null.
  return schema.nullable();
}
