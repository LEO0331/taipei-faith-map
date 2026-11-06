# V1.6 release record — 2026-11-06

## Baseline and delivery boundaries

Started from latest merged `main`, `539e4d3`, containing V1.5a–c. A clean `npm ci`, all 375 tests across 50 files, TypeScript/production build and content audit passed before editing. Main bundle: 548.41 kB / gzip 170.63 kB; optional Supabase SDK: 216.01 / 55.68. The existing >500 kB main-chunk advisory remains; content auditing reports no blocking structural errors and retains its editorial advisories.

V1.6 is delivered as production readiness (A) followed by focused visitor UX (B). Neither PR is merged automatically. No backend provider or major feature is added. The public Pages workflow still builds both shared flags as false; the initial database posting switch remains false.

## Production readiness changes

- GitHub Pages manifest/icon links use the Vite base; manifest identity, start URL, scope and icons resolve relative to the repository subpath. Service-worker registration specifies the same scope and bypasses the HTTP cache for update checks.
- The worker handles only an explicit same-origin, in-scope public-static allowlist. API/Auth, third-party tiles, arbitrary paths, authorization/range requests and unexpected query parameters bypass it. Only successful, non-redirected public responses are saved. Cleanup targets this application's scoped namespace and known legacy cache names.
- HTML, manifest and known JSON use network-first with a four-second response/body deadline and cached fallback. Hashed static assets use cache-first. Shell installation fetches current HTML entry assets. A new worker waits for old clients to close, preserving active drafts rather than forcing reload. Online navigation checks current HTML; offline coverage remains limited to available cached assets. Unvisited lazy features and external tiles are not guaranteed offline.
- `scripts/checkPagesBuild.mjs` validates the actual built HTML, manifest, module references and public assets against `/taipei-faith-map/`; the existing Pages workflow runs it after building.
- Optional client requests now bound complete response bodies to eight seconds and 128 KiB. A rejected/expired existing session fails safely without a replacement-registration loop. A typed missing-verification result lets the subsequent UX distinguish required CAPTCHA from unavailable service.
- `scripts/validateQuietReadiness.mjs` reuses the existing read-only health helper and checks the public note projection and denial of raw-table reads. It prints only fixed probe names and pass/fail results. It never creates a guest, mutates data or proves whole-system readiness.
- `supabase/operations/` adds a read-only privilege/policy audit and deliberate operator-only schedule/inspect/unschedule scripts. Database-local Supabase Cron runs only `maintain_quiet_corner()` daily, with no API secret. Setup guards ownership, timezone, permissions and name conflicts; it is not an automatically applied migration or a configured remote job.

Existing migrations, RLS, Edge verification, approved-only publication, pending confidentiality and moderation rules are preserved. No security constraint is relaxed to simplify the UI. Architecture/data flow are in [architecture.md](architecture.md), and staged deployment/rollback gates in [public-launch-checklist.md](public-launch-checklist.md).

## Operational verification and remaining actions

The existing phase-B and phase-C SQL suites ran successfully against actual isolated PostgreSQL 18. The new readiness audit returned **8/8 true**, including raw-table denial, privileged-RPC restrictions, posting off and exact-topic policy existence. The fixture supplies test Auth claims and a Realtime table: it does not verify JWT signatures, actual Auth or Realtime connections. No production data was used. Cron is not installed in this fixture, so no scheduled execution is claimed.

The current workspace has no `.env`/`.env.local`, Supabase URL/key, server-secret configuration or authenticated Supabase CLI. The existing health workflow remains separate and unchanged: cron `17 2,10,18 * * *` UTC plus manual dispatch, public publishable key only. Missing-configuration readiness checks fail closed. Repository health secrets, a successful manual live run, hosted API probes and actual usage were not verified.

The operator must select an authorized controlled project, apply reviewed migrations without resetting an existing database, configure anonymous Auth/CAPTCHA and private Realtime, deploy user-JWT Edge Functions and server secrets, test real allow/deny identities, run two independent browsers, complete note submission→private approval→public read→report/hide/expiry, assign moderation coverage, configure/observe successful daily retention and run the health workflow before staged activation. Posting can be stopped immediately at the database without a frontend rebuild. Policy changes alone may not immediately eject an already authorized Realtime connection; follow the documented incident procedure.

Free-tier pausing, quota pressure, anonymous Auth row growth and scheduler delays remain operational risks. Health queries do not guarantee uptime; a paused project can require manual resumption. No remote settings, deployment, public activation, Cron schedule, fabricated visitor or public note is claimed.

A new browser inspection attempt through the installed computer-use runtime failed before initialization with `failed to write kernel assets` / missing path. Real browser mobile widths (320/375/390/768/desktop), offline installation/update behavior, text zoom, contrast, device reduced motion and two-session companionship remain unverified. NVDA, VoiceOver and TalkBack were not used. DOM/VM tests are scoped evidence, not a claim that these manual checks passed.

## Phase-A validation record

The isolated Git snapshot passed clean `npm ci`, **437 tests / 53 files**, TypeScript, the Pages production build and actual built-output checking (**16 modules / 96 scoped references**, including lazy stylesheets). The content structural audit passed; the only change after the full suite's prior content check was the build checker and its missing-lazy-CSS regression. Phase-A main bundle: **548.52 kB / gzip 170.66 kB**; optional SDK unchanged. Both actual missing-configuration CLI invocations exited **1** safely, and the shared Edge handler/validation passed a standalone TypeScript check.

The SQL assertions and readiness audit above were repeated on the isolated PostgreSQL fixture. Docker was rechecked and its Linux-engine named pipe was absent, so no full local Supabase stack ran. These local checks do not establish a deployed or scheduled service.
