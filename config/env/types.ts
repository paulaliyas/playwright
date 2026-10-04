export type EnvName = 'dev' | 'sit' | 'uat' | 'e2e';
export type BrowserName = 'chromium' | 'firefox' | 'webkit';

export interface DomainEnvConfig {
  baseURL: string;
}

export interface EnvFile {
  domains: Record<string, DomainEnvConfig>;
  locale?: string;
  ignoreHTTPSErrors?: boolean;
  timeouts?: Partial<Timeouts>;
}

export interface Timeouts {
  test: number;
  expect: number;
  action: number;
  navigation: number;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface DbConfig {
  user: string;
  password: string;
  connectString: string;
}

export interface EnvConfig {
  name: EnvName;
  browser: BrowserName;
  headless: boolean;
  workers: number;
  locale: string;
  ignoreHTTPSErrors: boolean;
  timeouts: Timeouts;
  domains: Record<string, DomainEnvConfig>;
  credentials: (domain: string) => Credentials;
  db: () => DbConfig;
}
