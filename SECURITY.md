# Security policy

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue. Use GitHub's private vulnerability reporting feature for this repository and include:

- the affected route, component, or dependency;
- reproduction steps or a minimal proof of concept;
- the expected and observed impact; and
- any suggested mitigation.

Do not access, modify, or retain data belonging to other users while testing. Reports will be acknowledged and triaged as quickly as practical.

## Supported versions

Only the latest revision of the default branch is supported with security fixes.

## Maintainer checklist

- Keep credentials out of commits and rotate any credential suspected of exposure.
- Run `bun audit`, `bun run typecheck`, and `bun run build` before releases.
- Enable GitHub secret scanning, push protection, Dependabot alerts, and private vulnerability reporting.
- Review authentication, authorization, upload, webhook, and URL-ingestion changes as security-sensitive.
