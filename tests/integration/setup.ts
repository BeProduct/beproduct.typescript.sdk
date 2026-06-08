import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BeProduct, type BeProductConfig } from "../../src/index.js";
import { hasFixtures } from "./fixtures.js";
import "./subset.js"; // registers the `toContainSubset` matcher

const __dirname = dirname(fileURLToPath(import.meta.url));

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

export const DOMAIN = process.env.BEPRODUCT_COMPANY_DOMAIN ?? "ltd3";

export const testConfig: BeProductConfig = {
  clientId: requireEnv("BEPRODUCT_CLIENT_ID"),
  clientSecret: requireEnv("BEPRODUCT_CLIENT_SECRET"),
  companyDomain: DOMAIN,
  refreshToken: requireEnv("BEPRODUCT_REFRESH_TOKEN"),
};

let _client: BeProduct | null = null;

export function getClient(): BeProduct {
  if (!_client) {
    _client = new BeProduct(testConfig);
  }
  return _client;
}

/** Integration tests run only when explicitly enabled. */
export const SKIP = !process.env.BEPRODUCT_INTEGRATION;

/** Golden-comparison parity suites also require a fixtures dir for the active domain. */
export const SKIP_PARITY = SKIP || !hasFixtures(DOMAIN);

/** ltd3-only shape suite (hardcoded tenant ids) runs only against ltd3. */
export const SKIP_SHAPE = SKIP || DOMAIN !== "ltd3";

/** Absolute path to a test upload asset (1.5KB jpg). */
export const ASSET_1KB = join(__dirname, "assets", "1kb.jpg");
