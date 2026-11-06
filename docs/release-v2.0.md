# V2.0 — authorized Supabase operations evidence

This record covers the additional Supabase configuration/deployment workstream only. Other V2.0 features and public launch are not claimed. Historical V1.5/V1.6 evidence is unchanged. Repository baseline: merged main `9052d77`. Operations below were observed on 2026-11-06.

## Target and authorization

The owner authorized evaluating existing versus dedicated projects in the specified organization. Read-only table/migration/function inventory showed that both existing projects belong to other applications. Creating a dedicated project initially hit the two-active-free-project limit. The owner explicitly selected one existing project for pause; it was paused and its inactive state verified. No unrelated schema was changed, and the other project remained untouched.

A dedicated **Taipei Faith Map** backend was created in **Tokyo (`ap-northeast-1`)** at the provider's quoted **US$0/month** project cost. It uses the platform's main/production database branch but is held for controlled preparation, not public feature activation. Organization/project references, unrelated application names, private operational details and key values are omitted from this public record.

Initial inspection found no application tables, migration history, functions or Cron jobs. PostgreSQL 17.11, `postgres` operator role and managed Auth functions were verified. Initial advisors were empty. The API URL and enabled modern publishable key were obtained securely; public client configuration and protected operator inputs remain in ignored local files.

## Access and deployment actually completed

| Operation | Observed result |
| --- | --- |
| Dashboard automation | Failed before initialization: missing kernel-assets path. The authenticated browser page was not read. |
| Supabase integration | Connected successfully; actual organization/project inventory, pause/create, database queries, advisors and function deployment worked. |
| Official CLI | Temporary CLI 3.0.0 prepared without changing package dependencies. Initial account query failed without authentication; operator completed official login, then account/project access succeeded. |
| Target selection | CLI linked only to the verified dedicated project. The original local project identifier was not mistaken for a remote reference. |
| Migration preview/application | Real `db push --dry-run --skip-vault` showed the two original migrations; both applied successfully through CLI with unchanged version IDs. No seed, custom role file, Vault update, reset or migration-history repair. |
| Additional migration | `202611060001_enable_quiet_retention_cron.sql` was separately previewed/applied. It only enables supported `pg_cron`; scheduling is a separate deliberate operation. |
| History verification | Remote versions match `202611050001`, `202611050002` and `202611060001`. |
| Edge Functions | `submit-quiet-note` and `report-quiet-note` deployed from repository entrypoints/shared dependencies; active metadata confirms `verify_jwt=true`. No unrelated function was replaced. |
| Protected server settings | After explicit confirmation, five settings were written: generated HMAC secret, exact Pages origin/hostname, CAPTCHA required and local bypass false. No secret value was printed or committed. Turnstile secret remains absent. |
| Auth site URL | Reviewed CLI diff changed only the site URL to the Pages repository URL; a subsequent diff confirmed no declared drift. Undeclared settings were preserved. |
| Anonymous Auth / CAPTCHA | Operator elected to defer Turnstile. Anonymous sign-in remains false, with zero Auth users observed. No CAPTCHA bypass or positive guest-authentication result is claimed. |
| Realtime restriction | Operator disabled public access in Dashboard. Actual SDK probes rejected a public channel with `private-only`, and rejected a private join without a user JWT as `unauthorized`. No Presence tracking or message broadcast was sent. |

The managed `realtime.messages` relation initially did not exist. A controlled unauthenticated private-channel probe initialized the service; the managed table/topic helper appeared with RLS already enabled. No mock table or ownership-changing ALTER was used. Its only application policies are the exact neutral-topic anonymous-guest receive/send policies.

The official CLI configuration schema does **not** support `realtime.private_only`; an attempted declaration produced no remote change and was removed from the ignored preview file. Do not infer a private-only setting merely from a successful config push. The Dashboard change was verified through actual channel rejection instead.

## Hosted database and API verification

- The existing private readiness audit returned **8/8 true**: health row/RLS, raw-table RLS and denial, bounded public projection, privileged mutation restrictions, intended service-role permissions, posting off and the two Realtime policies.
- The actual public read-only readiness command passed health SELECT, approved-note projection and denial of reads from all four private tables. It used only the publishable key and created no guest.
- `supabase/tests/hosted_quiet_corner.sql` passed on the real hosted PostgreSQL database. It adapts the existing suite into **22 inline assertions**, plus an empty-controlled-target/posting-off guard, without installing a test helper. Tests cover approved-only/unexpired projection, display-only fields, pending/hidden privacy, public/guest write/moderation denial, pending queue, rate limits, duplicate handling, approval/hide/delete, reports and maintenance. All synthetic rows and the transaction-local posting change rolled back; nothing became public to other connections.
- Edge probes: invalid JWT returned **401** for both functions. A request without a user JWT returned **503 unavailable** while required CAPTCHA configuration was incomplete; it did not write anything. This is a fail-closed availability result, not proof of the configured positive Auth/CAPTCHA path or every handler rejection branch.
- Final application state: zero notes/reports/rate rows/Auth users and `posting_enabled=false`. The private table/RPC checks are actual hosted database checks, but simulated role claims do **not** verify hosted JWT signatures or replace real user authentication.

### Advisor interpretation

Post-deployment advisors report four informational default-deny RLS/no-policy findings and warnings for public/authenticated execution of the intentionally narrow approved-note `SECURITY DEFINER` RPC. These are reviewed design choices: raw grants remain revoked; the RPC has a fixed search path, approved/unexpired predicates, three display fields and a 15-row bound. Actual denial/projection tests passed. No permissive policy was added just to remove an advisory. See [RLS/no policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [public definer RPC](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [authenticated definer RPC](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

## Retention: configured and execution observed

The owner explicitly approved the named daily job and one controlled minute-schedule verification after automatic approval review required this specific consent. The existing guarded operator SQL created exactly one `taipei-faith-map-quiet-retention-v1` job, owned by `postgres`, invoking only `select public.maintain_quiet_corner();`.

The same job temporarily ran on a minute schedule. Cron history records **succeeded**, start **2026-11-06 01:20:00.078033 UTC**, end **01:20:00.081697 UTC**. It was then immediately restored, using the guarded existing script, to **`41 3 * * *` UTC / 11:41 Asia/Taipei daily**. Final inspection confirms one active daily job, no remaining minute schedule and one successful observed run. The first run at the final daily time has not yet been observed; the controlled run proves actual scheduler/function execution, not future reliability.

No application records existed to delete. The RPC remains non-executable by public/guest roles. Managed Cron job metadata has owner-based RLS; no public maintenance endpoint or privileged GitHub credential was introduced. Continue observing job history and the documented retention policy before opening posting.

## Health workflow and remaining operator work

The existing workflow remains unchanged: `17 2,10,18 * * *` UTC plus manual dispatch, URL/publishable key only. The direct hosted health read passed. The operator subsequently configured the repository inputs and supplied [run 42144704285](https://github.com/LEO0331/taipei-faith-map/actions/runs/42144704285). GitHub job metadata confirms `database-read` completed successfully, including **Verify read-only database health record**. Logs show checkout of `main` commit `9052d77432b3e223f43e40e74db4ced61d797276`, Node 22.23.4 and execution of `node scripts/checkSupabaseHealth.mjs`. At **2026-11-06 01:34:18.6637691 UTC / 09:34:18 Asia/Taipei**, the helper reported success. Both configured inputs were masked in the log; their values were not retrieved or published.

The workflow and helper at that tested commit match this workstream's versions. The helper only reports success after the real read-only `app_healthcheck` query returns its exact expected record; this is an observed Actions database check, not a mocked test or merely a configured schedule. It establishes that run's configured inputs/query worked at that time. No automatic scheduled firing or future availability guarantee is inferred. The runner emitted action-runtime deprecation warnings; they did not fail the health step.

The operator chose to leave Turnstile unset, so anonymous Auth remains off. Real guest signup/session expiry, valid-guest private Presence, two genuinely independent browsers, CAPTCHA enforcement with a valid session, Edge submission/reporting and the complete browser note lifecycle remain unverified. Hosted SQL role/moderation checks do not substitute for those flows. Browser automation remains unavailable; no screen-reader/real-device result is claimed.

Next steps: add real Turnstile values through protected interfaces; review/enable anonymous Auth together with CAPTCHA and rate limits; complete controlled hosted Auth/Presence/Edge/browser tests; observe subsequent automatic health/Cron runs and maintain operator coverage. Use [the launch checklist](public-launch-checklist.md) and [setup guide](supabase-integration.md).

## Local regression and activation boundary

**448 tests / 54 files**, TypeScript, `GITHUB_PAGES=true` production build, **16 modules / 96 scoped asset references**, and content structural audit passed. Main gzip remains **170.97 kB**; optional SDK remains separate at **55.68 kB**. The existing main-bundle size advisory remains. New scheduler SQL was actually applied to the hosted dedicated database; a full Docker Supabase stack was not run.

Both public shared frontend flags remain false, the verified remote posting switch is false, and no public deployment/activation approval has been obtained. Backend creation, partial hosted verification, operator launch approval and public release remain distinct. This is **not** a declaration of complete production readiness.

## Final production integration follow-up — 2026-11-06

This section supersedes the earlier checkpoint's deferred Turnstile/anonymous-Auth and unavailable-browser statements. It does not change what was observed at that earlier checkpoint. This follow-up starts from merged main `b5224e4`; no public activation or automatic merge was performed.

### Build integration

The existing Pages Build step now consumes the three public `vars.VITE_SUPABASE_URL`, `vars.VITE_SUPABASE_PUBLISHABLE_KEY` and `vars.VITE_SUPABASE_TURNSTILE_SITE_KEY` values. Both shared flags remain explicitly false. The build guard requires URL/key/widget settings when either shared flag is literally true, validates supplied public formats/origins and retains privileged-credential rejection with redacted errors. A disabled static build still needs no backend configuration. Workflow/guard regressions cover the handoff. Actual repository variable values cannot be independently listed by the available GitHub connector; owner-reported setup and correct workflow references are distinct from a verified future Actions build using those values. Local protected public inputs do match the dedicated target.

Playwright 1.65.0 is a pinned development-only dependency with a lockfile. `npm run test:browser` exercises the actual built app with a temporary loopback server. `test:browser:passive` is an explicit operator-only private-preview suite for a configured controlled build and real approved-note RPC. Neither suite registers guests, supplies CAPTCHA answers or enables posting. Artifacts are ignored; no credentials or project identifiers were added to source.

### Browser recovery and actual scope

The managed CUA runtime was reset and reinitialized through its supported API; it still failed before browser/page creation with missing kernel assets and Windows error 3 (path not found). Read-only diagnostics found no useful current runtime log or exact missing filename; available old logs did not establish an application fault. There was no evidence of an access-denied error. No packaged assets were copied, security setting changed or helper protocol reverse engineered.

The authorized fallback installed Chromium into an ignored workspace path and launched with its sandbox enabled. Smoke testing passed with Chromium **158.0.8127.18** and two isolated contexts. A normal installed Chrome **156.0.8078.80** channel was also used for the real verification attempt. Thus the managed runtime remains broken, but real browser testing is now available; repository changes were not used to disguise the managed failure.

Observed actual-browser results:

- **10 static journeys**: Chinese/English at 1280, 768, 390, 375 and 320 CSS pixels. Map → filtered Faith Space → real hotspot click → immediate text → avatar wave → animation off → Escape passed, retaining filters and invoking focus. Keyboard focus wrapping and measured critical 44px targets passed. At 375px the emulated reduced-motion preference suppressed animation before the explicit Off action. No Auth/CAPTCHA/optional SDK request occurred in these solo journeys.
- **8 rendered axe audits** across desktop/mobile Faith Space and garden/board states in both languages passed the selected WCAG A/AA rules, including real rendered contrast. This is scoped automated evidence, not screen-reader, physical-device or whole-site conformance proof. Actual browser zoom/text resizing was not performed.
- **PWA**: actual worker control, cached shell reload with network offline, same-origin scoped cached URLs, preservation of an unrelated test cache and online HTML freshness passed on the loopback Pages build. Eight public assets were cached in the observed shell case. Unvisited lazy features and external tiles remain unguaranteed offline; a complete real release-to-release worker lifecycle was not tested.
- **10 passive shared previews**: the same viewport/language matrix read the real approved-note RPC in the private build with zero Auth/CAPTCHA requests and no Presence join. Empty state, no horizontal dialog overflow and keyboard close/focus restoration passed. At 320px in both languages, explicit browser-network failure injection produced the neutral unavailable state and an easy return; this is failure injection, not an actual paused-project result.
- **Existing public site**: the actual Pages URL returned 200, manifest/start/scope/icons resolved within `/taipei-faith-map/`, Faith Space opened/closed, and the social entry was absent with zero Auth/CAPTCHA requests. This verifies the existing public static deployment, not deployment of this new integration branch or social activation.

Shared private previews intercepted **only local static build assets** at the configured frontend origin and blocked service workers to prevent an old public shell interfering. Supabase and Cloudflare requests remained real, unmodified network calls. These were controlled previews, not publicly published enabled features. No stealth flags, fake tokens, test sitekeys, mocked Auth/Realtime or TLS bypass were used.

### Current hosted security/configuration

Protected CLI inspection confirmed anonymous sign-in is now true, Auth CAPTCHA is enabled with Turnstile, and the intended Edge secret names are configured. The Edge Turnstile secret's metadata digest matches the locally protected input; no secret value was logged. Function metadata remains active with `verify_jwt=true`. Actual negative probes returned:

| Probe | Observed response |
| --- | --- |
| Auth signup without CAPTCHA | 400 `captcha_failed`; no user created |
| Auth signup with invalid CAPTCHA | 400 `captcha_failed`; no user created |
| Edge caller with no real user session (legacy public API JWT only) | 401 |
| Invalid Edge origin | 403 |
| 81-grapheme note input | 400 |
| Unsupported report reason | 400 |
| Unsupported HTTP method | 405 |
| Public Realtime channel | Rejected as `private-only` |
| Private channel without user JWT | Rejected as `unauthorized` |

These checks do not substitute for a valid guest JWT/CAPTCHA path. Earlier hosted SQL moderation/privacy/rate/retention assertions remain separately recorded; no real visitor submission, approval or report was performed in this follow-up.

### Critical blocker: real Turnstile did not complete

A real widget was loaded in isolated Chromium headless/headed and installed stable Chrome. The owner attempted the visible challenge; it ultimately displayed verification failure, and the frontend received no valid token. Provider callback diagnostics did not yield a reliable numeric error code. There were **zero Auth requests in the blocked browser join** and zero Auth users in the final backend check. Do not describe this as failed Realtime synchronization: the two authenticated peers were never reached.

Cloudflare documents that [automated browser suites can be detected as bots](https://developers.cloudflare.com/turnstile/troubleshooting/testing/). That is consistent with the observed rejection, but does not prove its exact cause; provider/network/widget configuration should still be reviewed. Official dummy-key recommendations were not used because this release requires genuine production verification. No challenge solver, token injection, security disablement or repeated registration workaround was used.

Valid/expired/reused real-token checks, independent successful guest sign-ins, two-way Presence/wave/sit/acknowledgement, live guest payload/cleanup/background/reconnect checks, and positive Edge note/report/browser moderation remain **Blocked**. The owner must obtain a valid real challenge in an authorized ordinary browser/test environment and review the provider diagnostics before those gates can be completed. No one needs to paste tokens or secrets into chat.

### Maintenance and launch decision

The existing daily job has now also genuinely succeeded at its final daily schedule: **2026-11-06 03:41:00.183132–03:41:00.237684 UTC / 11:41 Asia/Taipei**. It remains a single active `41 3 * * *` job for the intended maintenance RPC. The previously verified manual GitHub health run remains valid; querying scheduled workflow-run history returned no observed automatic run. No future reliability guarantee is implied.

Final database inspection still showed zero users, notes and reports, with posting false. Both public frontend flags remain false. Moderator coverage and explicit public-posting approval have not been established. Because real Turnstile/guest/two-browser gates did not pass, **no Quiet Garden/Corner activation PR is prepared and no public social deployment is claimed**. The integration/browser-verification PR is reviewable independently. See the dated status matrix in [the existing launch checklist](public-launch-checklist.md).

### Final local validation for the integration PR

The final clean `npm ci` completed, then **462 tests / 55 files**, TypeScript, content audit (no structural errors), `GITHUB_PAGES=true` production build and **16 modules / 96 scoped asset references** passed. Runtime output remains main **549.38 kB / gzip 170.97 kB**, optional SDK **216.01 / 55.68**; only development test tooling was added. The existing main-chunk advisory remains. No automatic browser/hosted tests were added to the Pages deployment workflow; real hosted checks are deliberate operator runs. All activation flags and the protected posting switch remain unchanged/off.

## Owner-authorized Garden-only human-validation pilot — 2026-11-06

After reviewing Cloudflare's likely-bot/invalid-token outcomes and confirming hostname/settings, the owner explicitly requested opening the Garden entry so ordinary-browser verification can happen after deployment. This is a new, limited authorization following the failed automated challenge; it does not retroactively pass the blocked tests or authorize notes/posting.

The Pages workflow now sets `VITE_QUIET_PRESENCE_ENABLED=true` and retains `VITE_QUIET_CORNER_ENABLED=false`. The default feature flags and `.env.example` stay off; the production workflow is the deliberate pilot configuration. Visitors must explicitly open/join and pass real CAPTCHA/anonymous Auth before a private Realtime connection is established. No CAPTCHA, JWT, RLS, topic restriction, payload validation or cleanup code is weakened. There is no new automatic connection or fake visitor. The remote posting switch was rechecked false and is not changed by this PR.

Before changing the flag, actual public assets produced by the merged variables workflow were fetched and privately compared to the expected dedicated-project URL, publishable key and real Site Key. All three matched; values and project references were not logged or committed. This verifies the emitted public configuration, without claiming direct access to repository Variable storage.

The prior intentionally invalid/missing CAPTCHA probes can contribute invalid-token events, so analytics counts alone do not establish a defect affecting ordinary visitors. The exact automated challenge failure remains unresolved. Human pilot results must be recorded separately; this is not a complete production-readiness declaration. Owner review/merge remains required. No public pilot deployment or successful guest/peer flow is claimed before it is observed.

After merge and a successful Pages deployment, use an ordinary browser at the existing Pages URL, open Quiet Garden, explicitly join and complete the real widget. Use a separate browser/profile for the second visitor, then check mutual peer counts, wave/sit/acknowledgement, leaving, background pause and return focus. If the widget fails before any Auth request, record its safe error code/time and Cloudflare outcome. If a green widget is followed by `captcha_failed`, inspect server verification/key pairing and token age/reuse. Never share tokens, credentials or raw HAR files. Corner/posting remain unavailable during this pilot.

Rollback is a reviewed rebuild with the Presence flag false; the static map remains independent. Posting remains false regardless of the frontend rollback. The pilot does not authorize automatic PR merge, secret rotation, provider security bypass or a broadened origin allowlist.

Pilot preparation validation: **462 tests / 55 files**, TypeScript/default production build, the actual Garden-only Pages build and its **16-module / 96-reference** asset check passed. A sandboxed 375px browser smoke of that exact pilot build found the Garden entry and explicit Join control, no Corner entry, no fabricated avatar and **zero automatic Auth requests, CAPTCHA requests or sockets** on opening; Escape restored the opener. No new positive challenge or live-peer success is claimed by this smoke. The ordinary production build remains backend-optional; actual public pilot deployment awaits owner merge.
