# SEO / GEO / AEO Tasks — nomistudy.com → nomi.com

Source audit: `outputs/seo-audit-nomistudy-com-2026-06-20.pdf` (2026-06-20)
Scores: **SEO 6/10 · GEO 4/10 · AEO 6/10 (16/30)**

All tasks below are verified against the current `apps/web` codebase (not just the live-HTML
audit, which lagged the code in a few places). File paths are relative to `apps/web/`.

Legend: **E** = Easy (low effort) · **M** = Medium · **H** = Hard (high effort / ongoing).
Dimension tags: `SEO` · `GEO` · `AEO`.

---

## ✅ Already done in code (no task needed)

- Homepage **FAQPage schema** is implemented — `app/page.tsx:1751`.
- `app/robots.ts` is already permissive (`*` allows `/`, only disallows app/dashboard routes).
- `app/sitemap.ts` already hardcodes `SITE_URL = "https://nomi.com"` for every entry.
- Blog posts ship rich **BlogPosting** schema — `app/blog/[slug]/page.tsx:71`.
- Clean on-page SEO, OG/Twitter tags, server-rendered Next.js content — confirmed in code.

The two "critical" findings from the live audit are **infra/Cloudflare issues, not code** —
see E1 and E2.

---

# Easy (Low effort)

## E1 — Unblock AI crawlers (Cloudflare managed robots.txt)  `GEO` `critical`
**Problem:** The live `nomistudy.com/robots.txt` blocks `Google-Extended`, `GPTBot`, `CCBot`,
`other AI crawlers`, `Applebot-Extended`, `Bytespider`, `meta-externalagent` and sets
`Content-Signal: ai-train=no`. This makes the site invisible to AI search engines (Gemini AI
Overviews, ChatGPT Search, Perplexity) for grounding/synthesis. The block is **Cloudflare
Managed Content** — `app/robots.ts` is already permissive, so there is **no code to change**.
**Action:**
- [x] Cloudflare dashboard → Security → Bots / AI Audit: disable the "block AI crawlers" rule
      (or add allow exceptions for `Google-Extended`, `GPTBot`, `CCBot`, `other AI crawlers`,
      `PerplexityBot`, `Applebot-Extended`).
- [x] Set `Content-Signal: ai-input=yes` (keep `ai-train` per your preference).
- [x] Verify: `curl https://nomi.com/robots.txt` no longer lists those `Disallow: /` blocks.
**Impact:** High — single biggest GEO win, reversible in minutes.

## E2 — Canonicalize nomistudy.com → nomi.com for every path  `SEO` `critical`
**Problem:** `nomistudy.com/sitemap.xml` is served with `nomi.com` URLs inside (host mismatch).
`app/sitemap.ts` is correct; the issue is the old domain still serving content instead of
redirecting cleanly.
**Action:**
- [x] _Resolved differently:_ the codebase was hardcoding `SITE_URL = "https://nomi.com"` even
      though we don't own `nomi.com` — the real domain is `nomistudy.com`. Fixed at the source by
      changing `SITE_URL` to `https://www.nomistudy.com` in `app/layout.tsx`, `app/sitemap.ts`,
      `app/robots.ts`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `app/contact/page.tsx`,
      `app/(app)/affiliate/page.tsx`, and `app/opengraph-image.tsx`. The original "redirect to
      nomi.com" action is moot — no redirect needed once the sitemap emits the correct host.
- [x] _N/A_ (apex already 307→www on `nomistudy.com`; no second domain to retire).
- [x] Verify: sitemap now emits `https://www.nomistudy.com/*` URLs (host mismatch resolved).
- [ ] Ensure `nomistudy.com` is the only domain in Google Search Console; request indexing.
**Impact:** High — resolves the sitemap host mismatch and consolidates ranking signals.

## E3 — Add `sameAs` social profiles to Organization schema  `GEO`
**Problem:** `app/layout.tsx:130` `Organization` has no `sameAs`, even though the footer links
to 4 social profiles. This weakens the brand entity graph AI engines use.
**Action:**
- [x] In `app/layout.tsx`, add to the `Organization` object:
      ```ts
      sameAs: [
        "https://www.instagram.com/nomi.study/",
        "https://www.threads.com/@nomi.study",
        "https://www.youtube.com/channel/UC8IQDvAivAUdle1m1qH9Rzg",
        "https://discord.gg/3ShYE6v2md",
      ],
      ```
**Impact:** Medium — strengthens entity recognition for GEO.

## E4 — Fix blog index metadata (title, H1, og:image)  `SEO`
**Problem:** `app/blog/page.tsx` — `title: "Blog"` renders as the keyword-free "Blog · nomi";
H1 is the generic "Blogs" (line 60); `openGraph` has no `images` (lines 19-24).
**Action:**
- [x] Replace `title: "Blog"` with a keyword-rich title, e.g.
      `title: "AI study tips & spaced repetition field notes"` (template appends `· nomi`), or
      use `title: { absolute: "nomi blog — AI study tips, flashcards & spaced repetition" }`.
- [x] Change the H1 at line 60 from `Blogs` to something descriptive, e.g.
      `The nomi blog — learning, faster`.
- [x] Add `images: [{ url: "${SITE_URL}/opengraph-image", width: 1200, height: 630, alt: "nomi blog" }]`
      to both `openGraph` and `twitter`.
**Impact:** Medium — blog index currently wastes its two highest-signal SEO fields.

## E5 — Fix dual H1 on "Best AI Study Tools 2026" post  `SEO`
**Problem:** `app/blog/[slug]/page.tsx:121` renders the post title as an H1, and the post body
MDX contains a **second** `<h1>Best AI Study Tools for Students</h1>`. Two H1s on one page.
**Action:**
- [x] Edit the post content (CMS/DB via `lib/blog`) to demote that second heading to `<h2>`.
- [x] Sanity-check the other post for the same issue.
**Impact:** Medium — clean heading hierarchy is a core on-page signal.

## E6 — Fix testimonial heading markup on homepage  `SEO`
**Problem:** `app/page.tsx:1687` — the `Testimonials` section wraps each testimonial quote in
`<h3>`, so 7 testimonial quotes are parsed as headings, polluting the heading outline.
**Action:**
- [x] Change the `<h3>` at line 1687 to a non-heading element (`<blockquote>`, `<figure>`, or
      `<p>`) and keep the visual styling via className.
**Impact:** Low-Medium — cleaner heading structure and richer semantic markup.

## E7 — Add BreadcrumbList schema to blog posts  `SEO` `AEO`
**Problem:** `app/blog/[slug]/page.tsx:98` renders a breadcrumb nav but emits no
`BreadcrumbList` JSON-LD for it.
**Action:**
- [x] In `app/blog/[slug]/page.tsx`, add a second JSON-LD object:
      ```ts
      { "@context":"https://schema.org","@type":"BreadcrumbList",
        itemListElement:[
          { "@type":"ListItem", position:1, name:"Blog", item:`${SITE_URL}/blog` },
          { "@type":"ListItem", position:2, name:post.title, item:url },
        ] }
      ```
- [x] Render it alongside the existing BlogPosting `<script>`.
**Impact:** Medium — breadcrumb rich results and clearer site structure for answer engines.

## E8 — Add a Contact page with real NAP + visible email  `GEO`
**Problem:** No `/contact` route exists (not in `app/`, not in `sitemap.ts`); the only contact
signal is a Cloudflare-obfuscated email in the footer. No phone/address/NAP.
**Action:**
- [x] Create `app/contact/page.tsx` with a real support email (or a simple form) and any
      business NAP data.
- [x] Add the route to `app/sitemap.ts` static entries (priority 0.5).
- [x] Replace the obfuscated footer email with a normal `mailto:` link to the new page.
**Impact:** Medium — direct E-E-A-T / trust signal for GEO.

---

# Medium

## M1 — Add FAQPage + HowTo schema to blog posts  `AEO` `high impact`
**Problem:** Posts contain FAQ sections and the flashcards guide is a 5-step HowTo, but
`app/blog/[slug]/page.tsx:71` only emits `BlogPosting`. None of that content is marked up for
answer engines. (Homepage FAQPage already exists — `app/page.tsx:1751` — so this is posts-only.)
**Action:**
- [x] Extend the post model in `lib/blog` with optional structured fields, e.g.
      `faq?: { q: string; a: string }[]` and `howTo?: { name: string; steps: string[] }`.
- [x] In `app/blog/[slug]/page.tsx`, emit a `FAQPage` JSON-LD when `post.faq` is present and a
      `HowTo` JSON-LD (with `HowToStep` entries) when `post.howTo` is present.
- [x] Populate `faq` for both existing posts and `howTo` for the flashcards guide from their
      existing body content.
**Impact:** High — biggest AEO win; content already exists, only the markup is missing.

## M2 — Add SoftwareApplication + AggregateRating schema  `SEO` `GEO`
**Problem:** Homepage has 7 testimonials (`t.testimonials`) and pricing (`PricingPanel`) but no
`SoftwareApplication`/`Product` or `Review`/`AggregateRating` schema.
**Action:**
- [x] In `app/page.tsx`, add a `SoftwareApplication` JSON-LD:
      `applicationCategory: "EducationApplication"`, `operatingSystem: "Web"`, `offers` from the
      pricing tier, and `aggregateRating` derived from testimonials (ratingValue + reviewCount).
- [x] Optionally map each testimonial to a `Review` object with `author` + `reviewRating`.
**Impact:** Medium-High — product rich results + stronger entity for AI synthesis.

## M3 — Add an About / Team page  `GEO` `high impact`
**Problem:** No `/about` or `/team` route exists; the site never explains who builds nomi, their
background, or credentials. This is the largest E-E-A-T gap.
**Action:**
- [ ] Create `app/about/page.tsx` with the team, roles, credentials/photos, and the nomi story.
- [ ] Add to the header nav and to `app/sitemap.ts` (priority 0.6).
- [ ] Add an `AboutPage`/`WebPage` JSON-LD and link it from the `Organization` schema in
      `app/layout.tsx` (add `about: "${SITE_URL}/about"`).
**Impact:** High — foundational trust signal for both GEO and AI Overviews.

---

# Hard

## H1 — Real author model: Person authors, Author schema, author pages  `GEO`
**Problem:** All posts are authored by `"Nomi Team"` / `"Nomi team"` as an `Organization`
(`app/blog/[slug]/page.tsx:80`, `app/blog/page.tsx:47`). No named humans, no bios, no
credentials, no author pages — a major E-E-A-T deficiency.
**Action:**
- [ ] Introduce an Author data model in `lib/blog` (slug, name, title, bio, credentials,
      avatar, social links).
- [ ] Switch blog post `author` from `Organization` to `Person` with `@type: "Person"`,
      `name`, `jobTitle`, `url` (author page), `sameAs` (social).
- [ ] Create `app/blog/author/[slug]/page.tsx` listing that author's posts, with `Person` /
      `ProfilePage` JSON-LD.
- [ ] Add author pages to `app/sitemap.ts`.
- [ ] Migrate existing posts to real human authors (start with whoever actually wrote them).
**Impact:** High — the single most important GEO/E-E-A-T build-out; depends on M3.

## H2 — Increase blog cadence + topical depth  `SEO` `GEO` `ongoing`
**Problem:** Only 2 posts are published. The corpus AI engines can synthesize and cite is thin,
and priority keywords are unclaimed.
**Action:**
- [ ] Build a content calendar around priority study keywords: "AI flashcards", "PDF to notes",
      "Quizlet alternative", "lecture transcription", "spaced repetition", "exam prep",
      "AI tutor", "research paper summarizer".
- [ ] Target 2-4 pillar posts/month, each 1500+ words, with: cited external research, a
      comparison/feature table, an FAQ section, and (where relevant) a numbered how-to.
- [ ] Wire each new post to M1 (FAQ/HowTo schema) and H1 (real author) as it ships.
**Impact:** High (long-term) — the highest-leverage sustained SEO+GEO play; content is the
moat against larger competitors.

---

# Google Search Console — Coverage report (2026-06-20)

Source: `nomistudy.com-Coverage-2026-06-20/`. Snapshot: **3 indexed / 5 not indexed**,
impressions 0–5/day (very low). Property sitemap = "All known pages".

| Reason | Source | Validation | Pages |
|---|---|---|---|
| Page with redirect | Website | Not Started | 3 |
| Alternate page with proper canonical tag | Website | Not Started | 2 |
| Indexed, though blocked by robots.txt | Website | Not Started | 1 |

## E9 — Fix robots.txt × noindex conflict ("Indexed, though blocked by robots.txt", 1 page)  `SEO`
**Problem:** `app/robots.ts:11` disallows `/home`, `/library`, `/archive`, `/chat`, `/chats`,
`/notebook`, `/shelf`, `/admin`, `/affiliate`, `/free-credits`. But `app/(app)/layout.tsx:18`
already sets `robots: { index: false, follow: false }` (noindex meta) on **all** of those routes.
When robots.txt blocks crawling, Google **cannot read the noindex meta**, so the page stays
indexed on old signals — exactly the GSC "Indexed, though blocked by robots.txt" state.
Compounding it: `app/page.tsx:1739` links the homepage pricing CTA to `href="/home"`, leaking
link equity from the strongest page to a noindexed, robots-blocked URL.
**Action:**
- [x] In `app/robots.ts`, remove the `(app)` page routes from the `disallow` list
      (`/home`, `/library`, `/archive`, `/chat`, `/chats`, `/notebook`, `/shelf`, `/admin`,
      `/affiliate`, `/free-credits`). Keep only `/api` (and `/billing`, `/design` if you want
      defense-in-depth — both already noindex via their own layouts). Let the noindex meta in
      `app/(app)/layout.tsx` handle deindexing — Google will crawl, read noindex, and drop them.
- [x] In `app/page.tsx:1739`, change the pricing CTA `href="/home"` → `href="/signup"` so the
      primary conversion CTA points at an indexable entry, not a noindexed dashboard.
- [ ] Re-validate the 1 flagged URL in GSC → "Indexed, though blocked by robots.txt" should
      clear to "Excluded by 'noindex' tag" then drop from the index within weeks.
**Why:** robots.txt controls *crawling*, the noindex meta controls *indexing*. For pages you
want out of the index, the noindex meta is authoritative — but only if Google can crawl to
read it. Don't layer robots.txt `Disallow` on top of `noindex`.
**Impact:** Medium-High — clears a critical-state coverage flag and stops link-equity leakage.

## E10 — Resolve "Page with redirect" (3 pages)  `SEO`
**Problem:** 3 URLs are flagged "Page with redirect" — almost certainly `nomistudy.com` URLs
301-redirecting to `nomi.com` (the dual-domain situation from E2). Google counts redirecting
URLs as "not indexed" because the destination is what gets indexed.
**Action:**
- [x] Complete E2 first (root cause fixed — `SITE_URL` now points at the real domain,
      `nomistudy.com`, so the sitemap no longer emits `nomi.com` URLs).
- [ ] In GSC, submit and request indexing for the `nomistudy.com` destination URLs (homepage,
      `/blog`, both posts).
- [ ] Confirm the `nomistudy.com` property's sitemap is submitted
      (`nomistudy.com/sitemap.xml`).
- [ ] Re-check after 2–4 weeks: the 3 "Page with redirect" entries should consolidate out as
      Google attributes them to the `nomistudy.com` canonical.
**Impact:** Medium — resolves a critical coverage flag; dependent on E2.

## E11 — Verify "Alternate page with proper canonical tag" (2 pages)  `SEO`
**Problem:** 2 URLs have a canonical pointing elsewhere and Google is honoring it (status:
"proper canonical tag"). This is usually benign/correct, but worth confirming it's intentional
and not an accidental canonical collision (e.g. `/` vs `/home`, or trailing-slash variants).
**Action:**
- [x] In GSC, inspect the 2 flagged URLs and note them. Most likely they were `nomistudy.com`
      URLs whose `<link rel=canonical>` pointed to `nomi.com` — the root cause (wrong `SITE_URL`)
      is now fixed; canonicals are self-referencing on `nomistudy.com`.
- [ ] If any are internal duplicates (e.g. `/?something` vs `/`), ensure the canonical in
      `app/layout.tsx:54` (`alternates: { canonical: "/" }`) and per-page canonicals are
      self-referencing and consistent.
**Impact:** Low — informational; likely auto-resolves with E2. No code change expected.

## M4 — Grow indexed coverage from 3 → all indexable pages  `SEO` `GEO`
**Problem:** Only 3 of the 8 sitemap URLs are indexed; impressions are 0–5/day. The site has
very thin indexable surface area (homepage + 2 posts + blog index + privacy/terms). Low
indexed coverage caps all SEO/GEO upside.
**Action:**
- [ ] Request indexing in GSC for the un-indexed but indexable URLs: `/blog` (the index — fix
      E4 first so it's worth indexing), `/blog/best-ai-study-tools-2026`,
      `/blog/how-to-make-flashcards-from-a-pdf-with-ai`, homepage.
- [ ] Ship the new indexable pages from M3 (`/about`) and H1 (author pages) and submit them.
- [ ] Drive the content engine in H2 — every new pillar post is a new indexable URL and a new
      impression/click opportunity.
- [ ] Monitor weekly in GSC: indexed count should climb from 3 → 8 → 15+ as pages ship.
**Impact:** High (long-term) — indexed coverage is the ceiling on all search traffic.

---

## Bonus / optional

- **SpeakableSpecification schema** on homepage FAQ + post answers for voice search (`AEO`).
  Fold into M1 once FAQPage schema is on posts.
- **Hreflang** only if non-English locales actually ship (the UI language dropdown implies
  ambition but only `en` exists today) — `SEO`.
- **Page-speed / Core Web Vitals** audit at pagespeed.web.dev — cannot be assessed from HTML
  fetch; run it separately and act on LCP/CLS/INP findings (`SEO`).

---

## Suggested order

1. **E1 + E2 + E9** (critical infra/code fixes — unblock AI crawlers, fix domain redirect,
   fix robots×noindex conflict; ~1 hour) → 2. **E3–E8 + E10 + E11** (quick wins + GSC
   redirect/canonical follow-ups) → 3. **M1 + M4** (highest-impact AEO + grow indexed
   coverage) → 4. **M2 + M3** (entity/trust) → 5. **H1** (authors) → 6. **H2** (sustained
   content).
