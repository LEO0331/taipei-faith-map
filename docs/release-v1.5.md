# V1.5 delivery record — 2026-11-06

## Scope and architecture

Three stacked review branches preserve the existing map, calendar, routes and heritage experience:

| Phase | Branch | Delivered behavior |
| --- | --- | --- |
| A | `codex/faith-map-v1.5a-faith-moments` | Offline original SVG visitor, walk/sit/wave/observe, immediate cultural information and cancellable optional motion. |
| B | `codex/faith-map-v1.5b-quiet-presence` | Explicit neutral private garden, anonymous guest verification, bounded Presence/Broadcast and independent read-only health workflow. |
| C | `codex/faith-map-v1.5c-quiet-corner` | Independently gated approved-only board, pending submissions, reports, operator moderation and retention. |

No PR is merged automatically. GitHub Pages remains the frontend host. There is no game engine, chat, religion-specific room, visitor history or fabricated activity. The Supabase SDK loads in a separate optional chunk; ordinary exploration does not register a guest or connect Realtime.

A adds `src/features/faith-moments/`, Faith Space modal integration, flags, `.env.example` and its guide. B adds `src/features/quiet-presence/`, `src/services/supabaseClient.ts`, `GuestChallenge`, public-environment validation, the first SQL migration and health workflow/helper; it updates App, build/deploy configuration and package lock. C adds `src/features/quiet-corner/`, the second migration, Edge Functions/configuration, SQL/Edge tests and moderation guide. Each phase updates README and the service-worker version.

## Motion and shared-service behavior

The stored motion preference contains only on/off. OS reduced-motion takes precedence. Walk is 600ms, wave 500ms, sit 350ms and observation 500ms; the visitor rests afterward. Animations can be skipped or disabled, with no startup tutorial or cultural reading delay. The garden reuses this preference and has finite optional gestures. Closing restores the invoking exploration control; the map and filters stay mounted.

Presence uses exactly private `quiet-garden:v1`. Auth uses a verified anonymous user with authenticated role and `is_anonymous`, memory-only session, no automatic refresh and no URL session detection. Anonymous Auth still creates a server-side identity requiring operator retention planning. Public payloads contain only a temporary random guest key, allowed visual/pose fields and bounded gestures. Broadcast greetings are unattributed; they do not authenticate another visitor's identity. Leaving, closing and backgrounding release the channel and stop retries. Background return requires explicit entry.

Corner reads at most 15 approved, unexpired notes through a display-only RPC. Raw notes, reports, rate counters and settings are private under RLS/grants. Only privileged backend/operator RPCs mutate them. Edge Functions verify the real Auth user, anonymous claim, exact origin, action-specific CAPTCHA, schema, 80 graphemes and 1024 UTF-8 bytes. Atomic per-actor rate windows and duplicate controls apply; all submissions start pending. The browser preserves drafts when anonymous Auth consumes the first challenge and requests a fresh token for the Edge action.

Operator approval/hiding/deletion, emergency posting pause and daily retention maintenance are documented in [quiet-corner-moderation.md](quiet-corner-moderation.md). Notes lose public eligibility by 30 days; pending/hidden retention is 7 days, reports 30 days and idle rate counters 24 hours. The maintenance RPC requires an authorized schedule before posting is enabled; it is not silently attached to the health check.

## Configuration and operational gates

Both shared frontend flags remain false, including the deployment workflow, and database posting starts false. No project credentials were available and no remote Supabase configuration, migration, function or moderation schedule was deployed.

- Public build: feature flags, project HTTPS URL, `sb_publishable_…` key and Turnstile site key in `.env.example`. Build validation rejects privileged `VITE_` values.
- Supabase: anonymous sign-in and Auth CAPTCHA; private Realtime with public access disabled; reviewed migrations and authorization tests. The managed Realtime table must not be altered merely to enable RLS.
- Edge server: injected URL and publishable/secret key dictionaries; custom `QUIET_ALLOWED_ORIGINS`, `QUIET_IDENTITY_HASH_SECRET`, `QUIET_TURNSTILE_SECRET` and `QUIET_TURNSTILE_HOSTNAMES`. CAPTCHA remains required and hosted local-test mode stays off.
- GitHub health workflow: separate `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` repository secrets. Cron `17 2,10,18 * * *` UTC and manual dispatch perform one real read-only REST SELECT of the static health row, with bounded retry, timeout and fixed redacted errors. No privileged key or deployment dependency.

See [Supabase integration](supabase-integration.md) and [health monitoring](supabase-health-check.md) for exact setup and official references. Health reads cannot guarantee a free project remains active; scheduler inactivity, provider limits and manual project resume remain operational concerns. Anonymous account creation and hostile custom clients also require provider limits, usage monitoring and a reviewed cleanup policy.

## Verification actually completed

| Check | Result |
| --- | --- |
| A exact-commit archive, clean `npm ci`, tests, build and content audit | 244 tests / 38 files passed; build and structural audit passed. |
| B exact-commit archive, clean `npm ci`, tests and build | 321 tests / 46 files passed; build passed. |
| Final A+B+C tests | 375 tests / 50 files passed, including 33 Edge and 32 health-helper mocked tests. |
| Final TypeScript and production build | Passed. Main bundle 548.41 kB / gzip 170.63 kB versus baseline 546.16 / 170.09. Optional SDK chunk 216.01 / 55.68. Existing main-chunk size advisory remains. |
| Edge shared-handler standalone TypeScript | Passed. Deno/real Edge gateway was unavailable. |
| Content audit | No structural errors; existing editorial/source advisories remain. No live factual/source-link verification claimed. |
| Actual isolated PostgreSQL 18 | Bootstrap, both migrations, phase-B authorization/health tests and phase-C RLS/publication/moderation/rate/dedup/retention assertions passed. Transactional fixtures rolled back. |
| Missing health configuration | Helper failed safely as intended; no configured remote query was attempted. |

The PostgreSQL fixture mocks Supabase Auth claims and the Realtime table; it does not verify JWT signatures, gateway behavior or actual sockets. Docker daemon was unavailable, so no full local Supabase stack ran. Mocked Edge tests are not deployment evidence.

Browser automation failed during initialization with `failed to write kernel assets` / missing path. Visual, genuine two-browser Presence, deployed Auth/CAPTCHA, live Edge submission/approval/reporting and configured scheduled health checks remain unverified. Keep B/C off until those checks are completed in an authorized controlled environment. No public notes, guest sessions, successful deployment or moderation actions are fabricated in this record.

## V1.6 baseline note

V1.5a–c were subsequently merged into `main` (V1.6 baseline `539e4d3`). The record above describes the original V1.5 handoff and its verification limits. Merged source is not evidence of remote Supabase activation; the V1.6 readiness work continues to keep shared features disabled pending controlled verification.
