import { BeProduct, type BeProductConfig } from "../../src/index.js";

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

export const testConfig: BeProductConfig = {
  clientId: requireEnv("BEPRODUCT_CLIENT_ID"),
  clientSecret: requireEnv("BEPRODUCT_CLIENT_SECRET"),
  companyDomain: process.env.BEPRODUCT_COMPANY_DOMAIN ?? "ltd3",
  refreshToken: requireEnv("BEPRODUCT_REFRESH_TOKEN"),
};

let _client: BeProduct | null = null;

export function getClient(): BeProduct {
  if (!_client) {
    _client = new BeProduct(testConfig);
  }
  return _client;
}

export const SKIP = !process.env.BEPRODUCT_INTEGRATION;
