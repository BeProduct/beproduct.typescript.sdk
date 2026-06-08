import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Golden fixtures keyed by camelCase filename (e.g. `gridAppRowInsert`). */
export type Fixtures = Record<string, any>;

export function fixturesDir(domain: string): string {
  return join(__dirname, "fixtures", domain);
}

/** True when a golden-fixtures directory exists for the given domain. */
export function hasFixtures(domain: string): boolean {
  const dir = fixturesDir(domain);
  return existsSync(dir) && readdirSync(dir).some((f) => f.endsWith(".json"));
}

function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Load every `fixtures/<domain>/*.json` file into a single object, keyed by the
 * camelCased filename. Mirrors the Python suite's `set_conf` directory loader
 * (which uppercases the filename); we use camelCase to read idiomatically in TS.
 *
 *   grid_app_row_insert.json → fixtures.gridAppRowInsert
 *   style.json               → fixtures.style
 */
export function loadFixtures(domain: string): Fixtures {
  const dir = fixturesDir(domain);
  if (!existsSync(dir)) {
    throw new Error(
      `No golden fixtures for domain "${domain}" at ${dir}. ` +
        `Integration parity suites require a matching fixtures directory.`,
    );
  }
  const out: Fixtures = {};
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const key = toCamelCase(file.replace(/\.json$/, ""));
    out[key] = JSON.parse(readFileSync(join(dir, file), "utf8"));
  }
  return out;
}
