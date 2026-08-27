# Launch readiness checklist

## Have to verify — would block launch if broken

- [ ] `next build` runs clean.
- [ ] SEO routes actually serve in prod: `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/twitter-image`, `/manifest.webmanifest`.
- [ ] Stripe webhooks: signature verification, idempotency, retries.
- [ ] Cancel-at-period-end + refund flow (commit `3a9f2f8`) tested end-to-end on Stripe test keys.
- [ ] Auth: email verification works.
- [ ] Auth: password reset works.
- [ ] Auth: session expiry behaves correctly (idle + absolute).
- [ ] User-route scoping (commit `b2a54a6`) covers **every** authenticated endpoint, not just most. Spot-check at least 5 endpoints with another user's ID.
- [ ] Free-tier limits enforced **server-side**, not just UI gating. Try bypassing the UI and confirm the backend rejects.
- [ ] DB backups + point-in-time recovery configured on whatever Postgres host you're using.
- [ ] Transactional email working: signup verification, billing receipts, password reset.
- [ ] `getnomi@proton.me` is a real inbox someone reads.

## Nice to have — not blocking but high regret if missing

- [ ] Error monitoring in prod (Sentry / Axiom / Logtail). Flying blind is scary even in beta.
- [ ] Product analytics (PostHog / Plausible) so activation, retention, and conversion are measurable.
- [ ] Uptime monitoring (UptimeRobot is free).
- [ ] Cookie consent banner if you'll see EU traffic.
- [ ] India GST handling on Stripe invoices (since you're India-first).

## Already in good shape (from what I've seen)

- [x] Privacy + terms exist with real content.
- [x] Refund policy spelled out in terms.
- [x] SEO foundation landed (2026-05-08 batch, commits `b243fc3`..`f799b70`).
- [x] Per-user OpenAI rate limit (commit `7f9eeec`).
- [x] Domain pointed to nomistudy.com (after rename batch).

## Highest-leverage audits I haven't done yet

If you want me to dig deeper, the two with the worst silent-failure modes are:
1. Stripe webhook handler — wrong signature check or missing idempotency = lost money or duplicate charges that look like fraud.
2. Authorization scoping — one missed `where userId = $current_user` on a query = data leak between accounts.

Pick a target and I'll audit it.
