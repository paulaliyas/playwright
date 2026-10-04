import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import type { BrowserName, EnvConfig, EnvFile, EnvName, Timeouts } from './types';

/**
 * Resolution order (later wins):
 *   1. config/env/environments/<ENV>.json   → non-secret settings (URLs, timeouts), committed
 *   2. .env.<ENV>  then  .env               → secrets (credentials, DB), git-ignored
 *   3. process.env                          → CI / Docker overrides
 */
const ROOT = path.resolve(__dirname, '..', '..');
const ENV_NAMES: EnvName[] = ['dev', 'sit', 'uat', 'e2e'];

const name = (process.env.ENV ?? 'dev') as EnvName;
if (!ENV_NAMES.includes(name)) {
  throw new Error(`Unknown ENV "${name}". Use one of: ${ENV_NAMES.join(', ')}`);
}

// dotenv does not override already-set vars, so load the specific file first.
dotenv.config({ path: path.join(ROOT, `.env.${name}`), quiet: true } as dotenv.DotenvConfigOptions);
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true } as dotenv.DotenvConfigOptions);

const file: EnvFile = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'environments', `${name}.json`), 'utf-8'),
);

const DEFAULT_TIMEOUTS: Timeouts = { test: 60_000, expect: 10_000, action: 15_000, navigation: 30_000 };

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined ? fallback : ['1', 'true', 'yes'].includes(v.toLowerCase());

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var ${key} (ENV=${name}). Add it to .env.${name} or CI secrets.`);
  return value;
}

/** Per-domain URL override, e.g. ESTABLISHMENT_BASE_URL=https://... */
const domains = Object.fromEntries(
  Object.entries(file.domains).map(([domain, cfg]) => [
    domain,
    { ...cfg, baseURL: process.env[`${domain.toUpperCase()}_BASE_URL`] ?? cfg.baseURL },
  ]),
);

export const env: EnvConfig = {
  name,
  browser: (process.env.BROWSER ?? 'chromium') as BrowserName,
  headless: bool(process.env.HEADLESS, true),
  workers: Number(process.env.WORKERS ?? 4),
  locale: process.env.LOCALE ?? file.locale ?? 'en-US',
  ignoreHTTPSErrors: file.ignoreHTTPSErrors ?? true,
  timeouts: { ...DEFAULT_TIMEOUTS, ...file.timeouts },
  domains,
  // Lazy getters: only fail when a test actually needs the secret.
  credentials: (domain) => {
    const prefix = domain.toUpperCase();
    return { username: required(`${prefix}_USERNAME`), password: required(`${prefix}_PASSWORD`) };
  },
  db: () => ({
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    connectString: required('DB_CONNECT_STRING'),
  }),
};
