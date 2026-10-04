# Playwright UI Automation

End-to-end UI test suite built on [Playwright](https://playwright.dev) + TypeScript.

- **Multi-domain** — each application area (establishment, individual, public, …) has its own pages, specs, login and URL.
- **Multi-environment** — the same tests run against `dev`, `sit`, `uat` or `e2e` by changing one variable.
- **Dockerised & air-gap ready** — browsers are baked into the image, so it runs on Linux servers with no internet.
- **Oracle test data** — tests can pick real data from the DB instead of hard-coding IDs.
- **Offline demo** — a local demo page (`demo-site/`) lets you verify the setup anywhere with zero configuration.

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Quick start (5 minutes)](#2-quick-start-5-minutes)
3. [Project structure](#3-project-structure)
4. [Configuration](#4-configuration)
5. [Running tests](#5-running-tests)
6. [Creating tests](#6-creating-tests)
7. [Adding a domain or environment](#7-adding-a-domain-or-environment)
8. [Docker](#8-docker)
9. [Running on an offline (air-gapped) Linux server](#9-running-on-an-offline-air-gapped-linux-server)
10. [Jenkins CI](#10-jenkins-ci)
11. [Maintenance](#11-maintenance)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| Node.js | 18+ (20 or 22 recommended) | running locally |
| npm | comes with Node | installing dependencies |
| Docker | 20+ with Compose v2 | running in a container / building the server image |
| VPN / network access | — | reaching the real dev/sit/uat/e2e sites (not needed for the demo) |

---

## 2. Quick start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Download the browser that matches the installed Playwright version
npx playwright install chromium

# 3. Run the offline demo tests — no URLs or passwords needed
npm run test:demo

# 4. Open the HTML report
npm run report
```

If step 3 shows `3 passed`, your setup works. Next, configure the real environments ([section 4](#4-configuration)).

---

## 3. Project structure

```
playwright-ui-automation/
├── config/
│   ├── domains.ts                 Domain registry, DOMAIN filter, saved-login paths
│   └── env/
│       ├── environments/          One JSON per environment (URLs, timeouts) — committed
│       │   ├── dev.json
│       │   ├── sit.json
│       │   ├── uat.json
│       │   └── e2e.json
│       ├── index.ts               Loads ENV → JSON + .env files + real env vars
│       └── types.ts
├── src/
│   ├── core/                      Shared by every domain
│   │   ├── base.page.ts           BasePage: goto(), waitForReady(), switchLanguage()
│   │   ├── auth.ts                Generic login → saves session (storageState)
│   │   └── db/oracle.ts           Oracle helper: query(), queryOne(), closeDb()
│   └── domains/
│       ├── establishment/         Requires login
│       │   ├── auth.setup.ts      Logs in once before the specs run
│       │   ├── fixtures.ts        Registers page objects for specs
│       │   ├── pages/             Page objects (locators + actions)
│       │   ├── specs/             ← TEST FILES GO HERE (*.spec.ts)
│       │   └── data/queries.ts    Read-only SQL for test data
│       ├── individual/            Same shape as establishment
│       ├── public/                No login → no auth.setup.ts
│       └── demo/                  Tests the local demo page — runs offline
├── demo-site/index.html           Dummy todo app used by the demo domain
├── scripts/serve-demo.js          Tiny static server for demo-site/ (port 4173)
├── certs/                         Optional corporate root CA for Docker builds
├── reports/                       Generated: html/, junit/, test-results/ (git-ignored)
├── .auth/                         Generated: saved login sessions (git-ignored)
├── playwright.config.ts           One Playwright "project" per domain (+ <domain>-setup)
├── Dockerfile · docker-compose.yml · Jenkinsfile
├── .env.example                   Template for secrets
└── package.json                   npm scripts
```

**How a run works**

1. `config/env/index.ts` reads `ENV` (default `dev`) and loads that environment's URLs + secrets.
2. `playwright.config.ts` creates one Playwright project per selected domain.
3. Domains with `requiresAuth: true` first run `<domain>-setup` (`auth.setup.ts`), which logs in and saves the session to `.auth/<env>/<domain>.json`.
4. The specs in `src/domains/<domain>/specs/` then run already logged in.
5. If the `demo` domain is selected, Playwright starts `scripts/serve-demo.js` automatically.

---

## 4. Configuration

### 4.1 URLs and timeouts — `config/env/environments/<env>.json`

Non-secret settings, committed to git. **Replace the placeholder `*.example.gosi.ins` URLs with the real ones.**

```json
{
  "domains": {
    "establishment": { "baseURL": "https://establishment-dev.example.gosi.ins" },
    "individual":    { "baseURL": "https://individual-dev.example.gosi.ins" },
    "public":        { "baseURL": "https://public-dev.example.gosi.ins" },
    "demo":          { "baseURL": "http://localhost:4173" }
  },
  "locale": "en-US",
  "ignoreHTTPSErrors": true,
  "timeouts": { "test": 60000, "navigation": 45000 }
}
```

Timeouts not listed fall back to defaults: `test 60s`, `expect 10s`, `action 15s`, `navigation 30s`.

### 4.2 Secrets — `.env.<env>` files

Credentials and DB settings. **Never commit these** (they are git-ignored and excluded from the Docker image).

```bash
cp .env.example .env.dev      # one file per environment: .env.dev, .env.sit, .env.uat, .env.e2e
```

| Variable | Example | Purpose |
|---|---|---|
| `ENV` | `dev` | Environment: `dev` \| `sit` \| `uat` \| `e2e` (default `dev`) |
| `DOMAIN` | `establishment,public` | Domains to run; blank = all |
| `BROWSER` | `chromium` | `chromium` \| `firefox` \| `webkit` |
| `HEADLESS` | `true` | `false` shows the browser window |
| `WORKERS` | `4` | Parallel workers (used when `CI=true`) |
| `LOCALE` | `en-US` | Overrides the JSON locale |
| `ESTABLISHMENT_USERNAME` / `_PASSWORD` | | Login for the establishment domain |
| `INDIVIDUAL_USERNAME` / `_PASSWORD` | | Login for the individual domain |
| `<DOMAIN>_BASE_URL` | `PUBLIC_BASE_URL=https://…` | Overrides that domain's URL from the JSON |
| `DB_USER` / `DB_PASSWORD` | | Oracle test-data user |
| `DB_CONNECT_STRING` | `dbhost:1521/SERVICE` | Oracle connection |

Secrets are only checked when a test actually needs them — e.g. the `public` and `demo` domains run fine without any `.env` file.

### 4.3 Precedence (last wins)

1. `config/env/environments/<ENV>.json`
2. `.env.<ENV>`, then `.env`
3. Real environment variables (shell, Docker `-e`, Jenkins credentials)

---

## 5. Running tests

### 5.1 npm scripts

| Command | What it does |
|---|---|
| `npm test` | All domains, `dev` environment |
| `npm run test:dev` / `test:sit` / `test:uat` / `test:e2e` | All domains against that environment |
| `npm run test:establishment` / `test:individual` / `test:public` | One domain |
| `npm run test:demo` | Offline demo tests (no config needed) |
| `npm run test:demo:headed` | Demo tests in a visible browser, one at a time |
| `npm run test:smoke` | Only tests tagged `@smoke` |
| `npm run test:headed` | All domains in a visible browser |
| `npm run report` | Open the last HTML report |
| `npm run codegen` | Record clicks into test code |
| `npm run typecheck` | TypeScript check without running tests |

### 5.2 Combining options

Environment variables and Playwright flags can be combined freely:

```bash
ENV=sit DOMAIN=establishment npx playwright test                     # one domain in SIT
ENV=uat npx playwright test --grep @smoke                            # smoke tests in UAT
DOMAIN=public npx playwright test dashboard                          # only files matching "dashboard"
DOMAIN=demo npx playwright test -g "adds todos"                      # one test by title
ENV=e2e DOMAIN=individual npx playwright test --grep @regression     # regression in E2E
BROWSER=firefox DOMAIN=demo npx playwright test                      # another browser*
```

\* Install it first: `npx playwright install firefox`.

### 5.3 Headed and debug mode

```bash
DOMAIN=demo HEADLESS=false npx playwright test --workers=1   # watch it run
DOMAIN=demo npx playwright test --debug                      # step through with the Inspector
DOMAIN=demo npx playwright test --ui                         # interactive UI mode (watch, re-run, time-travel)
```

### 5.4 Reports and artefacts

| Output | Location |
|---|---|
| HTML report | `reports/html/index.html` → `npm run report` |
| JUnit XML (for CI) | `reports/junit/results.xml` |
| Screenshots / videos of failures | `reports/test-results/<test>/` |
| Traces (on first retry in CI) | `reports/test-results/<test>/trace.zip` → `npx playwright show-trace <file>` |

---

## 6. Creating tests

### 6.1 Where test files go

```
src/domains/<domain>/specs/<feature>.spec.ts
```

The file **must** end in `.spec.ts` and live in a domain's `specs/` folder, otherwise Playwright will not find it.

### 6.2 Step by step (example: a "profile" page in the public domain)

**Step 1 — Page object** `src/domains/public/pages/profile.page.ts`

Page objects hold locators and actions for one screen, so specs stay short and locators live in one place.

```ts
import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@core/base.page';

export class ProfilePage extends BasePage {
  protected readonly path = '/profile';          // relative to the domain baseURL
  readonly name: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.name = page.getByLabel('Name');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async updateName(value: string): Promise<void> {
    await this.name.fill(value);
    await this.saveButton.click();
  }

  async expectSaved(): Promise<void> {
    await expect(this.page.getByText('Saved successfully')).toBeVisible();
  }
}
```

`BasePage` gives you for free:

- `goto(query?)` — navigates to `path` and waits for the page (and any `.loader` / `.spinner`) to finish
- `waitForReady()` — the same wait on its own, e.g. after a click that reloads data
- `switchLanguage('en' | 'ar')` — clicks `data-testid="language-toggle"` and checks `<html lang>`
- `byTestId(id)` — shortcut for `page.getByTestId(id)`

**Step 2 — Register it** in `src/domains/public/fixtures.ts`

```ts
import { ProfilePage } from './pages/profile.page';

type PublicFixtures = {
  dashboardPage: PublicDashboardPage;
  profilePage: ProfilePage;                                       // add
};

export const test = base.extend<PublicFixtures>({
  dashboardPage: async ({ page }, use) => { await use(new PublicDashboardPage(page)); },
  profilePage:   async ({ page }, use) => { await use(new ProfilePage(page)); },   // add
});
```

**Step 3 — Spec** `src/domains/public/specs/profile.spec.ts`

```ts
import { test, expect } from '../fixtures';      // ALWAYS import from ../fixtures

test.describe('Public — profile', () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.goto();
  });

  test('updates the name @smoke', async ({ profilePage }) => {
    await profilePage.updateName('Test User');
    await profilePage.expectSaved();
  });

  test('rejects an empty name @regression', async ({ profilePage, page }) => {
    await profilePage.updateName('');
    await expect(page.getByText('Name is required')).toBeVisible();
  });
});
```

**Step 4 — Run it**

```bash
DOMAIN=public npx playwright test profile
DOMAIN=public HEADLESS=false npx playwright test profile --workers=1   # watch it
```

A complete working example is the demo domain: `src/domains/demo/` (page → fixtures → spec).

### 6.3 Using DB test data

Put read-only SQL in `src/domains/<domain>/data/queries.ts`:

```ts
export const ESTABLISHMENT_QUERIES = {
  activeEstablishment: `
    SELECT registration_no AS "registrationNo", name_en AS "nameEn"
      FROM establishment
     WHERE status = 'ACTIVE'
     FETCH FIRST 1 ROWS ONLY`,
} as const;

export interface EstablishmentRow { registrationNo: string; nameEn: string; }
```

Use it in a spec:

```ts
import { queryOne } from '@core/db/oracle';
import { ESTABLISHMENT_QUERIES, type EstablishmentRow } from '../data/queries';

const est = await queryOne<EstablishmentRow>(ESTABLISHMENT_QUERIES.activeEstablishment);
await page.goto(`/establishment/${est.registrationNo}/profile`);
```

- `query<T>(sql, binds)` returns all rows; `queryOne<T>(sql, binds)` returns the first row or fails with a clear message.
- Use bind variables for parameters: `queryOne(sql, { status: 'ACTIVE' })` with `:status` in the SQL.
- Alias columns in double quotes (`AS "camelCase"`) so they match the TypeScript interface.
- Uses node-oracledb **thin mode** — no Oracle Instant Client needed.

### 6.4 Logged-in tests

For `establishment` and `individual`, `auth.setup.ts` logs in **once** per run and every spec reuses the session. You do not log in inside specs.

The login selectors live in `src/core/auth.ts`. **Adjust them once to match your real login/SSO page:**

```ts
await page.getByLabel(/username|user id/i).fill(username);
await page.getByLabel(/password/i).fill(password);
await page.getByRole('button', { name: /login|sign in/i }).click();
await expect(page.getByTestId('user-menu')).toBeVisible();   // something only visible when logged in
```

### 6.5 Recording a test with codegen

```bash
npx playwright codegen https://your-site-url      # or http://localhost:4173 for the demo
```

A browser opens and every click/type is written as code. Copy the locators into a page object, not straight into the spec.

### 6.6 Conventions

| Topic | Rule |
|---|---|
| File names | `kebab-case.spec.ts`, `kebab-case.page.ts` |
| Describe titles | `'<Domain> — <feature>'`, e.g. `'Establishment — profile'` |
| Tags | Put `@smoke` (fast, critical path) or `@regression` (full coverage) in the test title |
| Locators | Prefer `getByRole`, `getByLabel`, `getByTestId`. Avoid CSS/XPath tied to layout |
| Waiting | Never `page.waitForTimeout()`. Use `expect(...).toBeVisible()` etc. — they auto-wait |
| Independence | Each test sets up its own state; tests run in parallel and in any order |
| Test data | Never hard-code IDs that differ per environment — query them from the DB |
| Secrets | Only in `.env.*` / CI credentials, never in code or JSON |
| Imports | Specs import `test`/`expect` from `../fixtures`; shared code via `@core/…`, `@config/…` |

---

## 7. Adding a domain or environment

### New domain (e.g. `employer`)

1. **Register** in `config/domains.ts`:
   ```ts
   export const DOMAINS = {
     ...
     employer: { requiresAuth: true },
   } as const;
   ```
2. **Add its URL** to every `config/env/environments/*.json`:
   ```json
   "employer": { "baseURL": "https://employer-dev.example.gosi.ins" }
   ```
3. **Create the folder** by copying an existing domain:
   ```
   src/domains/employer/
     auth.setup.ts      (only if requiresAuth: true — copy from establishment, change the name)
     fixtures.ts
     pages/
     specs/
     data/queries.ts    (optional)
   ```
4. **Credentials** (if login needed): add `EMPLOYER_USERNAME` / `EMPLOYER_PASSWORD` to `.env.*`, `.env.example`, and the Jenkins credentials + `docker run -e` list in the `Jenkinsfile`.
5. Optional: add `"test:employer": "cross-env DOMAIN=employer playwright test"` to `package.json`.

### New environment (e.g. `prod`)

1. Create `config/env/environments/prod.json` (copy `dev.json`, change URLs).
2. Add `'prod'` to `ENV_NAMES` in `config/env/index.ts` and to `EnvName` in `config/env/types.ts`.
3. Create `.env.prod` with credentials.
4. Optional: add a `test:prod` npm script and the choice to the `Jenkinsfile` parameters.

---

## 8. Docker

The image is based on `mcr.microsoft.com/playwright:v1.55.0-noble`, which already contains the browsers. Tests run headless as the non-root `pwuser`.

### Build and run with Compose (on a machine with internet)

```bash
docker compose build
DOMAIN=demo docker compose run --rm tests                   # offline demo
ENV=sit DOMAIN=establishment docker compose run --rm tests  # real tests
docker compose run --rm tests --grep @smoke                 # extra args go to "playwright test"
```

Compose automatically loads `.env` and `.env.<ENV>` into the container and mounts `./reports` so results come back to the host.

### Build and run with plain Docker

```bash
docker build -t playwright-ui-automation:latest .

docker run --rm --ipc=host --init \
  --env-file .env.dev -e ENV=dev -e DOMAIN=public \
  -v "$PWD/reports:/app/reports" \
  playwright-ui-automation:latest --grep @smoke
```

`--ipc=host` gives Chromium enough shared memory; `--init` cleans up browser processes.

### Corporate network options

| Need | How |
|---|---|
| Pull base image from internal registry | `--build-arg PW_IMAGE=nexus.gosi.ins:8443/playwright:v1.55.0-noble` |
| npm through Nexus | `--build-arg NPM_REGISTRY=https://nexus.gosi.ins/repository/npm-group/` |
| SSL inspection / custom root CA | Put the `.crt` in `certs/`, add `--build-arg EXTRA_CA_CERT=certs/<file>.crt` |

---

## 9. Running on an offline (air-gapped) Linux server

The server needs **only Docker** — no Node, no npm, no internet. You build the image on a machine with internet and copy it over as a file.

### 9.1 Build and export (on your machine)

Most servers are `amd64` (Intel/AMD). On an Apple Silicon Mac you **must** pass `--platform linux/amd64`:

```bash
mkdir -p dist
docker build --platform linux/amd64 -t playwright-ui-automation:1.0.0 .
docker save playwright-ui-automation:1.0.0 | gzip > dist/playwright-ui-automation-1.0.0-amd64.tar.gz
shasum -a 256 dist/playwright-ui-automation-1.0.0-amd64.tar.gz     # note the checksum
```

Check the server's architecture with `uname -m` (`x86_64` = amd64, `aarch64` = arm64).

### 9.2 Copy, load and run (on the server)

```bash
# verify the copy
sha256sum playwright-ui-automation-1.0.0-amd64.tar.gz

# load into Docker
docker load < playwright-ui-automation-1.0.0-amd64.tar.gz

# 1) smoke-check the container with the offline demo (starts its own local page)
mkdir -p reports
docker run --rm --ipc=host --init -e DOMAIN=demo \
  -v "$PWD/reports:/app/reports" playwright-ui-automation:1.0.0

# 2) run the real tests against internal sites
docker run --rm --ipc=host --init \
  --env-file .env.sit -e ENV=sit \
  -v "$PWD/reports:/app/reports" \
  playwright-ui-automation:1.0.0 --grep @smoke
```

- Tests are **headless** automatically inside the container.
- Keep `.env.<env>` on the server (it is never inside the image).
- The server must be able to reach the internal application URLs. Override any URL at run time with `-e ESTABLISHMENT_BASE_URL=https://…`.
- If `reports/` is not writable by the container user, add `--user "$(id -u):$(id -g)" -e HOME=/tmp`.

### 9.3 Releasing a new version

Every time tests change, rebuild with a new tag and ship the new file:

```bash
docker build --platform linux/amd64 -t playwright-ui-automation:1.0.1 .
docker save playwright-ui-automation:1.0.1 | gzip > dist/playwright-ui-automation-1.0.1-amd64.tar.gz
```

On the server, remove old versions to free space: `docker rmi playwright-ui-automation:1.0.0`.

---

## 10. Jenkins CI

The `Jenkinsfile` builds the image and runs it on an agent labelled `ameen-ui`.

**Parameters:** `ENV`, `DOMAIN` (blank = all), `GREP` (e.g. `@smoke`), `WORKERS`.

**Required Jenkins credentials** (per environment, e.g. `-dev`, `-sit`):

| Credential ID | Type | Maps to |
|---|---|---|
| `est-<env>` | Username/password | `ESTABLISHMENT_USERNAME` / `ESTABLISHMENT_PASSWORD` |
| `ind-<env>` | Username/password | `INDIVIDUAL_USERNAME` / `INDIVIDUAL_PASSWORD` |
| `oracle-<env>` | Username/password | `DB_USER` / `DB_PASSWORD` |
| `oracle-connect-<env>` | Secret text | `DB_CONNECT_STRING` |

After each run Jenkins publishes the JUnit results and archives `reports/**` (HTML report, screenshots, videos, traces). In CI, failed tests are retried twice and `test.only` is forbidden.

---

## 11. Maintenance

### 11.1 Upgrading Playwright

The npm package and the Docker base image **must be the same version**. Update all of these together:

| File | What to change |
|---|---|
| `package.json` | `"@playwright/test": "1.xx.0"` |
| `Dockerfile` | `ARG PW_IMAGE=mcr.microsoft.com/playwright:v1.xx.0-noble` |
| `docker-compose.yml` | default `PW_IMAGE` |
| `Jenkinsfile` | `PW_IMAGE` |

Then:

```bash
npm install
npx playwright install chromium     # download the matching local browser
npm run typecheck
npm run test:demo
docker compose build && DOMAIN=demo docker compose run --rm tests
```

Check the [Playwright release notes](https://playwright.dev/docs/release-notes) for breaking changes.

### 11.2 Routine tasks

| Task | How |
|---|---|
| Keep dependencies patched | `npm outdated`, `npm audit`. Avoid `npm audit fix --force` — it can jump major versions |
| UI changed and tests broke | Fix the locator in the **page object** — every spec using it is fixed at once |
| Login page changed | Update selectors in `src/core/auth.ts` |
| Stale/expired session | Delete `.auth/` — it is recreated on the next run |
| Flaky test | Run `npx playwright test <file> --repeat-each=10`; replace fixed waits with `expect` assertions; check the trace |
| Test data missing in an env | Adjust the SQL in `data/queries.ts`, not the spec |
| Temporarily disable a test | `test.skip('reason')` or `test.fixme(...)` — never delete silently |
| Clean generated files | `rm -rf reports .auth` |
| Check types before commit | `npm run typecheck` |

### 11.3 Before committing

- [ ] `npm run typecheck` passes
- [ ] New/changed tests pass locally at least twice in a row
- [ ] No `test.only`, no `waitForTimeout`, no hard-coded credentials
- [ ] Tests are tagged `@smoke` or `@regression`
- [ ] Locators live in page objects, not specs

---

## 12. Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `Executable doesn't exist at …/ms-playwright/chromium…` | Local browser doesn't match Playwright version | `npx playwright install chromium` |
| `Missing env var ESTABLISHMENT_USERNAME (ENV=dev)` | No credentials for that domain/env | Create `.env.dev` from `.env.example`, or run only `DOMAIN=public` / `DOMAIN=demo` |
| `net::ERR_NAME_NOT_RESOLVED at https://…example.gosi.ins` | Placeholder URL or no VPN | Put real URLs in `environments/<env>.json`, connect to VPN |
| `N did not run` after a `*-setup` failure | Specs depend on a successful login | Fix the setup (credentials / login selectors) first |
| `Unknown DOMAIN(s): x` | Typo in `DOMAIN` | Use a name from `config/domains.ts` |
| `Unknown ENV "x"` | Invalid `ENV` value | Use `dev`, `sit`, `uat` or `e2e` |
| `No test data returned for query` | SQL returned no rows in this env | Adjust the query or seed data |
| Demo: `Timed out waiting … from config.webServer` | Port 4173 busy | Free the port, or `DEMO_PORT=4174` and update the demo `baseURL` |
| Docker: `exec format error` on server | Image built for the wrong CPU | Rebuild with `--platform linux/amd64` (or `arm64` to match `uname -m`) |
| Docker: Chromium crashes / `Target closed` | Not enough shared memory | Run with `--ipc=host` (or `--shm-size=1g`) |
| Docker: `EACCES` writing `reports/` | Host folder permissions | `--user "$(id -u):$(id -g)" -e HOME=/tmp` or `chmod a+rwx reports` |
| Docker build: `SELF_SIGNED_CERT_IN_CHAIN` | Corporate SSL inspection | Add the root CA via `EXTRA_CA_CERT` ([section 8](#corporate-network-options)) |
