/**
 * Helper utilities mirroring the Python SDK's helpers/parsers.py module.
 * These flatten nested API responses into more ergonomic flat dictionaries.
 */

import type { FormItem } from "./schemas/common.js";

/**
 * Flattens a header API response into a flat dictionary.
 * Merges headerData.fields into { fieldId: value } pairs,
 * then merges non-field headerData props and top-level props.
 *
 * @example
 *   const style = await client.style.get(headerId);
 *   const flat = parseHeader(style);
 *   flat.header_number // "STYLE-001"
 *   flat.frontImage    // { preview: "...", origin: "..." }
 *   flat.id            // "uuid"
 */
export function parseHeader(headerData: Record<string, unknown>): Record<string, unknown> {
  if (!headerData) return {};

  const specialFields = new Set(["headerData", "colorways", "sizeRange", "sizeClasses", "id", "tags"]);

  const result: Record<string, unknown> = {
    id: headerData.id,
    colorways: {},
  };

  // Flatten fields array into { fieldId: value }
  const hd = headerData.headerData as Record<string, unknown> | undefined;
  if (hd) {
    const fields = hd.fields as FormItem[] | undefined;
    if (fields) {
      for (const f of fields) {
        result[f.id] = f.value;
      }
    }
    // Merge non-field headerData props (frontImage, sideImage, etc.)
    for (const [k, v] of Object.entries(hd)) {
      if (k !== "fields") result[k] = v;
    }
  }

  // Merge top-level props (createdBy, modifiedBy, folder, etc.)
  for (const [k, v] of Object.entries(headerData)) {
    if (!specialFields.has(k)) result[k] = v;
  }

  return result;
}

/**
 * Flattens a style API response. Indexes colorways by colorNumber,
 * sizeRange by name, sizeClasses by name (with nested size_range dict).
 *
 * @example
 *   const style = await client.style.get(headerId);
 *   const flat = parseStyle(style);
 *   flat.colorways["NAVY"]          // colorway object
 *   flat.default_size_range["M"]    // size object
 *   flat.size_classes["Missy"]      // { ...sizeClass, size_range: { "S": ..., "M": ... } }
 */
export function parseStyle(styleData: Record<string, unknown>): Record<string, unknown> {
  if (!styleData) return {};

  const specialFields = new Set(["headerData", "sizeRange", "colorways", "sizeClasses"]);

  const result: Record<string, unknown> = {
    id: styleData.id,
    colorways: {} as Record<string, unknown>,
    default_size_range: {} as Record<string, unknown>,
    size_classes: {} as Record<string, unknown>,
  };

  const hd = styleData.headerData as Record<string, unknown> | undefined;
  if (hd) {
    const fields = hd.fields as FormItem[] | undefined;
    if (fields) {
      for (const f of fields) result[f.id] = f.value;
    }
    for (const [k, v] of Object.entries(hd)) {
      if (k !== "fields") result[k] = v;
    }
  }

  for (const [k, v] of Object.entries(styleData)) {
    if (!specialFields.has(k)) result[k] = v;
  }

  const sizeRange = (styleData.sizeRange as unknown[] | null) ?? [];
  for (const size of sizeRange) {
    const s = size as Record<string, unknown>;
    (result.default_size_range as Record<string, unknown>)[s.name as string] = { ...s };
  }

  const colorways = (styleData.colorways as unknown[] | null) ?? [];
  for (const cw of colorways) {
    const c = cw as Record<string, unknown>;
    (result.colorways as Record<string, unknown>)[c.colorNumber as string] = { ...c };
  }

  const sizeClasses = (styleData.sizeClasses as unknown[] | null) ?? [];
  for (const sc of sizeClasses) {
    const s = sc as Record<string, unknown>;
    const sizeRangeArr = (s.sizeRange as unknown[] | null) ?? [];
    const sizeRangeDict: Record<string, unknown> = {};
    if (Array.isArray(sizeRangeArr)) {
      for (const sz of sizeRangeArr) {
        const szo = sz as Record<string, unknown>;
        if (szo.name) sizeRangeDict[szo.name as string] = { ...szo };
      }
    }
    (result.size_classes as Record<string, unknown>)[s.name as string] = {
      ...s,
      size_range: sizeRangeDict,
    };
  }

  return result;
}

/**
 * Flattens a material API response. Indexes colorways by colorNumber,
 * sizeRange by name, suppliers by id.
 */
export function parseMaterial(materialData: Record<string, unknown>): Record<string, unknown> {
  if (!materialData) return {};

  const specialFields = new Set(["headerData", "sizeRange", "colorways", "suppliers"]);

  const result: Record<string, unknown> = {
    id: materialData.id,
    colorways: {} as Record<string, unknown>,
    default_size_range: {} as Record<string, unknown>,
    suppliers: {} as Record<string, unknown>,
  };

  const hd = materialData.headerData as Record<string, unknown> | undefined;
  if (hd) {
    const fields = hd.fields as FormItem[] | undefined;
    if (fields) {
      for (const f of fields) result[f.id] = f.value;
    }
    for (const [k, v] of Object.entries(hd)) {
      if (k !== "fields") result[k] = v;
    }
  }

  for (const [k, v] of Object.entries(materialData)) {
    if (!specialFields.has(k)) result[k] = v;
  }

  for (const size of (materialData.sizeRange as unknown[] | null) ?? []) {
    const s = size as Record<string, unknown>;
    (result.default_size_range as Record<string, unknown>)[s.name as string] = { ...s };
  }

  for (const cw of (materialData.colorways as unknown[] | null) ?? []) {
    const c = cw as Record<string, unknown>;
    (result.colorways as Record<string, unknown>)[c.colorNumber as string] = { ...c };
  }

  for (const sup of (materialData.suppliers as unknown[] | null) ?? []) {
    const s = sup as Record<string, unknown>;
    (result.suppliers as Record<string, unknown>)[(s.Id ?? s.id) as string] = { ...s };
  }

  return result;
}

/**
 * Indexes an app list by title (lowercased).
 *
 * @example
 *   const apps = await client.style.appList(headerId);
 *   const indexed = parseAppList(apps);
 *   indexed["bill of material"] // { id: "...", title: "Bill of Material", type: "BOM" }
 */
export function parseAppList(appList: { title: string; [k: string]: unknown }[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const app of appList ?? []) {
    result[app.title.toLowerCase()] = app;
  }
  return result;
}

/**
 * Converts a simple { fieldId: value } filter dict into the API filter format.
 * Supports wildcards (*) for Contains operator, arrays for multi-value (joined with ■),
 * and nested { operator, value } objects.
 *
 * @example
 *   dictToFilters({ header_number: "STYLE-*", season: ["Fall", "Spring"] })
 *   // → [
 *   //   { field: "header_number", operator: "Contains", value: "STYLE-" },
 *   //   { field: "season", operator: "Eq", value: "Fall■Spring" }
 *   // ]
 */
export function dictToFilters(
  filters: Record<string, unknown>,
): { field: string; operator: string; value: unknown }[] {
  if (!filters) return [];

  return Object.entries(filters).map(([fieldId, fieldValue]) => {
    let operator = "Eq";
    let value = fieldValue;

    if (Array.isArray(value)) {
      if (value.some((v) => typeof v === "string" && v.includes("*"))) {
        operator = "Contains";
        value = value.map((v: string) => v.replace(/\*/g, ""));
      }
      value = (value as string[]).join("■");
    } else if (typeof value === "string" && value.includes("*")) {
      value = value.replace(/\*/g, "");
    } else if (typeof value === "object" && value !== null && "operator" in value) {
      const v = value as { operator: string; value: unknown };
      operator = v.operator;
      value = v.value;
    }

    return { field: fieldId, operator, value };
  });
}
