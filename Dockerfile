# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Browsers are BAKED INTO the base image, so nothing is downloaded from
# cdn.playwright.dev at build or run time (works on air-gapped agents).
#
# The base tag MUST match @playwright/test in package.json.
# Behind a registry mirror, override:
#   --build-arg PW_IMAGE=nexus.gosi.ins:8443/playwright:v1.55.0-noble
# ---------------------------------------------------------------------------
ARG PW_IMAGE=mcr.microsoft.com/playwright:v1.55.0-noble
FROM ${PW_IMAGE}

# Optional corporate npm proxy (e.g. Nexus) and CA bundle for SSL inspection
ARG NPM_REGISTRY=
ARG EXTRA_CA_CERT=certs/.keep

ENV CI=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/extra.crt \
    TZ=Asia/Riyadh

WORKDIR /app

COPY ${EXTRA_CA_CERT} /usr/local/share/ca-certificates/extra.crt
RUN [ -s /usr/local/share/ca-certificates/extra.crt ] && update-ca-certificates || true

COPY package.json package-lock.json* ./
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi \
 && (npm ci --no-audit --no-fund || npm install --no-audit --no-fund)

COPY . .

# Run as the non-root user shipped in the Playwright image
RUN mkdir -p .auth reports && chown -R pwuser:pwuser /app && chmod -R a+rwX .auth reports
USER pwuser

ENTRYPOINT ["npx", "playwright", "test"]
