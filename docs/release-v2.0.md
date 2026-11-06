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
