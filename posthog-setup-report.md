<wizard-report>
# PostHog post-wizard report

The wizard added a PostHog product-analytics + error-tracking integration to the Arkive Turborepo. Client-side analytics live in `apps/web` (Next.js 16 App Router); server-side analytics live in `apps/backend` (Bun + Hono). Both surfaces share the same project token (`NEXT_PUBLIC_POSTHOG_KEY`) so events from the browser and the Hono backend land in the same PostHog project and are correlated by the canonical Better Auth `user.id`.

What changed:

- **Dependencies.** Added `posthog-js` to `apps/web` and `posthog-node` to `apps/backend`.
- **Client init.** New `apps/web/instrumentation-client.ts` initializes PostHog with the Next.js 15.3+ pattern (no `PostHogProvider`). `capture_exceptions: true` is on, so unhandled browser errors flow into PostHog Error Tracking automatically.
- **Reverse proxy.** `apps/web/next.config.mjs` now rewrites `/ingest/*`, `/ingest/static/*`, and `/ingest/array/*` to PostHog. The client sends events to a same-origin path, which sidesteps tracking blockers and keeps the project token out of CDN logs.
- **Server client.** New `apps/backend/src/lib/posthog.ts` exposes a lazy `capture()` / `captureException()` / `shutdown()` API around `posthog-node` with `flushAt: 1, flushInterval: 0` — appropriate for short-lived Hono handlers. If `NEXT_PUBLIC_POSTHOG_KEY` is unset the client no-ops with a single warning, so local dev without a token doesn't break the backend.
- **Identity.** `posthog.identify(userId, …)` runs on the login form, signup form, and `RequireAuth` (so identity is rehydrated on every authed page load, not just at login). `posthog.reset()` runs on logout. Server-side captures use the same Better Auth `user.id` as `distinctId`, so server and client events join naturally on `distinct_id`.
- **`.env.example`.** Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `apps/backend/.env.example`. The same two `NEXT_PUBLIC_*` vars should be added to `apps/web/.env.local` (intentionally not committed).

Events instrumented:

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User completed email signup (or initiated Google signup). Top of funnel. | `apps/web/app/signup/signup-form.tsx` |
| `user_logged_in` | User completed email login (or initiated Google login). Triggers `posthog.identify`. | `apps/web/app/login/login-form.tsx` |
| `user_logged_out` | Sign-out clicked in settings. Followed by `posthog.reset()`. | `apps/web/components/settings/settings-modal.tsx` |
| `quick_action_used` | User picked an Upload/Link/Paste/Record/Ask card on the home hero. Top-of-funnel engagement. | `apps/web/components/home/home-hero.tsx` |
| `notebook_created` | Notebook created — covers both the home quick actions and the full create-notebook dialog. Properties capture source type, file size / content length, and AI generation options. Core activation event. | `apps/web/components/home/home-hero.tsx`, `apps/web/components/notebook/create-notebook-dialog.tsx` |
| `chat_message_sent` | User submitted a chat message (notebook chat or standalone). Primary engagement event. | `apps/web/components/ai-panel/ai-panel.tsx` |
| `upgrade_modal_shown` | Upgrade modal opened, with `reason` (notebook_limit / quota_exceeded / manual). Top of paywall funnel. | `apps/web/components/upgrade/upgrade-modal.tsx` |
| `checkout_started` | User clicked a tier card and we asked Dodo for a checkout session. Mid-funnel. | `apps/web/components/upgrade/upgrade-modal.tsx` |
| `billing_success_viewed` | User landed on `/billing/success` after Dodo redirect. Client mark of completed payment. | `apps/web/app/billing/success/page.tsx` |
| `subscription_activated` | Server-side: Dodo webhook moved the user to `plan=pro`. Authoritative conversion event. | `apps/backend/src/routes/billing.ts` |
| `subscription_ended` | Server-side: subscription expired / cancelled-and-period-passed / dunning failure / refund. Authoritative churn event. | `apps/backend/src/routes/billing.ts` |
| `ai_generation_completed` | Server-side: a summary / flashcards / quizzes / mindmap generation finished. One event with a `kind` property keeps the schema tidy. | `apps/backend/src/routes/notebooks.ts` |
| `course_generated` | Server-side: structured course (chapters) generated from a source. Captures whether the mock fallback was used (when `OPENAI_API_KEY` is unset). | `apps/backend/src/routes/generate-course.ts` |
| `chat_message_streamed` | Server-side: chat stream finished. Paired with `chat_message_sent` so we can spot client→server drop-off. | `apps/backend/src/routes/notebooks.ts` |

Error tracking: client unhandled exceptions are captured automatically (`capture_exceptions: true`). Explicit `posthog.captureException()` is wired into the failure paths of login, signup, the home quick actions, the create-notebook dialog, and the checkout button. Server-side `captureException()` runs on webhook signature verification failures, AI generation failures, and chat-stream `onFinish` persistence errors.

## Next steps

1. **Provision the PostHog project.** Set `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (e.g. `https://us.i.posthog.com`) in `apps/web/.env.local` and `apps/backend/.env`. The same `NEXT_PUBLIC_*` names are used on both sides so a single PostHog project token covers everything.
2. **Dashboard.** This environment doesn't have the PostHog MCP attached, so I couldn't programmatically create the "Analytics basics" dashboard. Build it manually in PostHog with these five insights — every event name below matches the code 1:1:
   - **Activation funnel:** `user_signed_up` → `notebook_created` → `chat_message_sent` (within 7d)
   - **Paywall conversion funnel:** `upgrade_modal_shown` → `checkout_started` → `subscription_activated`
   - **Churn signal:** trend of `subscription_ended` broken down by `reason`
   - **Engagement:** weekly trend of `chat_message_sent` and `ai_generation_completed` (broken down by `kind`)
   - **Quick action retention:** retention chart with `quick_action_used` as the cohort and `notebook_created` as the return event
3. **Verify identity merging.** After deploy, sign up a fresh user and confirm that the anonymous `quick_action_used` events captured before login get merged into the identified user once `posthog.identify(user.id)` runs from `RequireAuth`.
4. **Pre-existing tooling fixes (unrelated to PostHog).** `bun run lint` and `prettier-plugin-tailwindcss` both fail in this environment — `eslint-plugin-turbo` needs a `ReadableStream` polyfill and `prettier-plugin-tailwindcss` needs Node ≥17 (for `structuredClone`). Worth fixing separately; my edits typecheck clean (`bun run typecheck` passes in both `apps/web` and `apps/backend`).

### Agent skill

We've left an agent skill folder in your project at `.posthog/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using the agent workflow. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
