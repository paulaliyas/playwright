import path from 'node:path';
import { env } from './env';
import type { DomainEnvConfig } from './env/types';

/**
 * Register every application/business domain here.
 * Each domain gets its own folder under src/domains/<name> and its own
 * baseURL per environment in config/env/environments/*.json.
 */
export const DOMAINS = {
  establishment: { requiresAuth: true },
  individual: { requiresAuth: true },
  public: { requiresAuth: false },
  demo: { requiresAuth: false },
} as const;

export type DomainName = keyof typeof DOMAINS;
export const DOMAIN_NAMES = Object.keys(DOMAINS) as DomainName[];

/** Domains to run, from DOMAIN=a,b (blank = all). */
export function selectedDomains(): DomainName[] {
  const filter = process.env.DOMAIN?.split(',').map((d) => d.trim()).filter(Boolean);
  if (!filter?.length) return DOMAIN_NAMES;

  const unknown = filter.filter((d) => !(d in DOMAINS));
  if (unknown.length) {
    throw new Error(`Unknown DOMAIN(s): ${unknown.join(', ')}. Available: ${DOMAIN_NAMES.join(', ')}`);
  }
  return filter as DomainName[];
}

export function domainConfig(domain: DomainName): DomainEnvConfig {
  const config = env.domains[domain];
  if (!config?.baseURL) {
    throw new Error(`No baseURL for domain "${domain}" in environment "${env.name}"`);
  }
  return config;
}

/** Saved login state, kept per environment so switching ENV never reuses stale sessions. */
export const authFile = (domain: DomainName): string =>
  path.resolve(__dirname, '..', '.auth', env.name, `${domain}.json`);
