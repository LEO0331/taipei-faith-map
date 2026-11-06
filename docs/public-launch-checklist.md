# Controlled public launch checklist

This is an operator runbook, not evidence that a remote service is configured. Start with both shared frontend flags and database posting disabled. Record the intended project, frontend build/commit, operator, date and actual result privately for each completed check. Never include credentials, private notes or Auth IDs in public issues.

## Stage 1 — Static and solo experience

- [ ] Build the intended commit with `GITHUB_PAGES=true` and both shared flags false; verify the deployed `/taipei-faith-map/` URL, manifest/icons, refresh and update behavior.
- [ ] Complete map → Faith Space → hotspot → motion off → close; confirm immediate text, retained filters/map context and restored keyboard focus.
- [ ] Check Chinese and English at desktop, 320, 375, 390 and 768px, text enlargement, keyboard navigation and device reduced-motion.
- [ ] Test service failure and offline fallback separately. Record which pages/assets had actually been visited/cached; do not advertise full offline maps.
- [ ] Confirm ordinary exploration starts no guest Auth, CAPTCHA or Realtime connection.

## Stage 2 — Quiet Presence in an authorized controlled project

Use [Supabase integration](supabase-integration.md). Apply reviewed additive migrations to the selected project; never reset an existing remote database for testing.

- [ ] Verify project URL and public publishable key; inspect built public assets for privileged credentials without printing secret values.
- [ ] Enable anonymous Auth and its CAPTCHA for the exact allowed frontend hostname; verify valid, expired, invalid and consumed-token behavior.
- [ ] Verify private Realtime settings, including public access disabled, and the exact `quiet-garden:v1` policies.
- [ ] Test denial for no Auth, invalid JWT, non-anonymous user, wrong topic and malformed/replayed gestures.
- [ ] Use two genuinely separate browser sessions. Both independently join; each sees the other's actual Presence. Exercise wave, acknowledgement, sit and idle without continuous position broadcasts.
- [ ] Inspect actual payloads: no Auth UID, religion/organization selection, geolocation or reading history.
- [ ] Test leave, close, background, reconnect and timeout. Confirm no duplicate/stale avatars, idle sockets or repeated registration loop, and unchanged solo context.
- [ ] Record actual provider errors/resource use and review anonymous Auth row growth and the cleanup policy.
- [ ] Only after these checks, prepare a reviewed build enabling Presence alone. Obtain the operator's activation authorization and record the deployed result.

## Stage 3 — Quiet Corner read access

Keep database posting off. Follow [moderation operations](quiet-corner-moderation.md).

- [ ] Verify the approved-only read RPC returns at most 15 unexpired notes and only ID/content/expiry fields.
- [ ] Test public denial of raw-table access and pending/hidden notes; anonymous visitors cannot approve or invoke privileged mutation RPCs.
- [ ] Read the board without guest registration, CAPTCHA, a Presence connection or automatic polling.
- [ ] Test an empty board, unavailable project, expiry, close/cancellation and focus restoration using actual behavior; do not seed fictitious public notes for a demonstration.
- [ ] Review and authorize a Corner-enabled build with posting still false. Verify the deployed read behavior before proceeding.

## Stage 4 — Posting, moderation and retention

- [ ] Configure server-only secrets and exact origin/hostname allowlists through the protected project interface. Keep secret/privileged keys out of `VITE_`, browser assets and logs.
- [ ] Deploy both Edge Functions with JWT verification retained. Test genuine anonymous Auth and fresh action-specific CAPTCHA against the actual gateway.
- [ ] In the controlled project, verify valid note → pending/private → operator review → approved/public → hidden/deleted/expired. Record cleanup of test content.
- [ ] Test invalid JWT/CAPTCHA/origin, 80-grapheme and byte limits, rate/concurrency/duplicate controls, report reasons and private operator handling.
- [ ] Assign moderation coverage, queue/report review frequency and an emergency contact. Demonstrate approve, hide, delete, report review, pause and resume with the authorized operator.
- [ ] Configure the reviewed privileged daily retention mechanism, inspect its job definition and successful run, test idempotence, inspect failures and confirm only intended data is removed. Merely preparing SQL does not schedule it.
- [ ] Confirm the immediate posting pause works without a frontend deployment. Preserve a private record of the pre-test posting state.
- [ ] Authorize posting only after every required safeguard has passed; explicitly change the database switch, then test one controlled submission and its pending confirmation.

## Independent health monitoring

The repository already has one health workflow; do not duplicate it. See [health monitoring](supabase-health-check.md).

- [ ] Set only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` repository secrets for the intended project.
- [ ] Verify the static health relation and its public read-only grant. No privileged key is needed.
- [ ] Dispatch the existing workflow manually; inspect its actual success/failure and safe logs. Record run URL/time.
- [ ] Confirm the three daily cron triggers remain enabled and independent of website deployment/retention. Monitor missed/delayed runs rather than treating a configured cron as execution evidence.

Scheduled reads may reduce inactivity risk but cannot guarantee that a Free project stays active. GitHub schedules can be delayed, skipped or disabled; a paused Supabase project may need manual resumption. Monitor current provider usage and limits without assuming fixed future quotas or costs.

## Emergency stop and rollback

1. Stop new notes immediately through `quiet_corner_settings.posting_enabled=false` using the protected operator procedure. This does not require a frontend rebuild.
2. Hide or delete the specific problematic approved content separately. Pausing posting does not retract existing public notes.
3. If access must be revoked, use the reviewed project authorization/settings procedure and verify denial. Do not weaken RLS to troubleshoot an outage.
4. Rebuild both shared frontend flags to false to remove the public social entry points. Preserve the static core and verify the deployed rollback.
5. Inspect/disable only this application's retention job if required, following the operator guide. The health workflow remains read-only.
6. Review retained data and migration history before database recovery. A frontend rollback does not undo schema changes; never perform an unreviewed remote reset or blanket deletion.

## Evidence and remaining work

Check boxes only after the associated action was actually performed. Local PostgreSQL role fixtures, mocked Edge/Auth tests and a merged PR do not prove hosted JWT verification, two-browser Presence, deployed moderation, retention scheduling or a live workflow run. Record mobile visual and assistive-technology tools by name; do not claim NVDA, VoiceOver or TalkBack testing unless used. The release record must distinguish implementation, local validation and live activation.

## V2.0 authorized remote workstream

The owner authorized actual backend setup. A dedicated Taipei Faith Map project was created after read-only inventory and an expressly approved quota-related project pause. Three version-matched migrations, both JWT-protected functions, approved server settings, hosted SQL/read-only checks and a genuinely executed/restored daily Cron job are recorded in [the current evidence](release-v2.0.md). Public joins and unauthenticated private joins were rejected in actual Realtime probes.

These partial hosted results do not check off the full activation stages above. Turnstile was deferred and anonymous sign-in stays off; positive guest Auth, two-browser Presence, valid-session Edge/browser flows, moderation coverage and explicit public launch approval remain required. The direct hosted health query and operator-supplied [GitHub Actions run 42144704285](https://github.com/LEO0331/taipei-faith-map/actions/runs/42144704285) passed. The latter's job/step status and successful database-helper log were verified on 2026-11-06 at 09:34 Asia/Taipei; subsequent automatic scheduled runs remain to be observed. Both public shared flags and the verified posting switch remain false. Historical V1.5/V1.6 evidence is unchanged.

## V2.0 final verification status — 2026-11-06

The statuses below are scoped evidence for this follow-up. Earlier unchecked stage lists remain the operator runbook; a passing sub-check does not approve a whole stage. “Passed — live verified” can mean the explicitly named controlled real-browser/hosted environment, not an activated public feature.

| Check | Status | Evidence / boundary |
| --- | --- | --- |
| Existing public static site, manifest/icons/subpath and Faith Space | Passed — live verified | Actual Pages URL; social entry absent, no Auth/CAPTCHA. New branch not publicly deployed. |
| New workflow's public `vars.*` handoff and secret guard | Passed — offline only | Regression tests; both flags false. |
| Actual repository Variable values | Not performed | Available connector cannot independently list them; owner reports configured. Verify in the reviewed Actions build. |
| Both languages at desktop, 768/390/375/320px | Passed — live verified | 10 real Chromium controlled-build journeys; no horizontal overflow. |
| Hotspot immediate text, optional actions, motion off/reduced motion | Passed — live verified | Actual UI and OS-preference emulation; no animation-dependent information. |
| Keyboard wrap/Escape/focus/filter restoration and measured targets | Passed — live verified | Real keyboard/mouse, critical targets at least 44px. |
| Scoped rendered accessibility/contrast | Passed — live verified | Eight browser axe audits; not whole-site conformance. |
| Physical mobile, screen readers and actual browser zoom | Not performed | No NVDA/VoiceOver/TalkBack or real-device result. |
| PWA cached shell, fresh HTML and cache boundaries | Passed — live verified | Real local worker/offline reload; tiles/unvisited lazy features not guaranteed. Full deployment upgrade remains unperformed. |
| No automatic guest/CAPTCHA/SDK in solo exploration | Passed — live verified | Real browser network observation. |
| Passive board reading and empty state | Passed — live verified | 10 private-preview journeys using real approved-note RPC; no Auth/CAPTCHA/Presence. |
| Browser service-failure fallback | Passed — offline only | Explicit network failure injection at 320px in both languages. |
| Anonymous Auth / Turnstile / Edge configuration | Passed — live verified | Protected CLI/metadata inspection; enabled provider and matching Edge secret digest. No values published. |
| Missing/invalid Auth CAPTCHA and Edge negative paths | Passed — live verified | Actual 400/401/403/405 responses, zero users/notes created. |
| Real valid Turnstile challenge | Failed | Widget failed to return token after automated and owner manual attempts. |
| Expired/reused genuine CAPTCHA tokens | Blocked | No valid real token available; no fake success asserted. |
| Two independently authenticated browsers and live neutral actions | Blocked | Required challenge failed before guest creation/join. |
| Live peer payload/privacy, background/reconnect/replay/cleanup | Blocked | Mocked transport tests remain offline evidence; no actual peer stream reached. |
| Pending/hidden privacy and privileged moderation/rate/retention RPCs | Passed — live verified | Earlier hosted transaction-only SQL suite; no public fixture or live guest submission. |
| Full guest note → pending → approval → public → report/hide/delete | Blocked | Requires valid guest/CAPTCHA and a specifically controlled posting window. |
| Daily retention definition and real daily execution | Passed — live verified | One active intended job; final daily-time run succeeded 2026-11-06 11:41 Taipei. |
| Existing GitHub manual health run | Passed — live verified | Linked run 42144704285 and successful database-helper logs. |
| Automatic GitHub schedule execution | Not performed | No scheduled run observed in queried run history; schedule unchanged. |
| Moderator coverage and public-posting approval | Not performed | Must be explicitly assigned/approved by owner. |
| Current posting pause/public UI gates | Passed — live verified | Posting false; actual public social entry absent; source flags false. |
| Actual production rollback exercise | Not performed | Procedure prepared; no public social deployment was made/reverted. |
| Public activation and deployment of enabled features | Blocked | Real challenge/guest/two-browser criteria incomplete; no activation PR or automatic merge. |

Resolve Turnstile in an authorized ordinary browser and inspect provider analytics/allowed hostnames without changing production secrets in chat. Then re-run the blocked hosted paths with real independent sessions and explicit controlled test-content cleanup. Review/merge the configuration PR before any public enabled build; later posting still requires coverage and explicit owner approval.

## Owner-authorized Garden pilot exception — 2026-11-06

The owner has now expressly requested a Garden-only ordinary-browser pilot despite the outstanding automated positive-challenge/two-peer checks. This limited authorization supersedes the earlier blanket frontend hold **for Quiet Presence only**. The earlier matrix remains the historical test result; blocked paths are not relabelled passed.

- Prepared for owner review: workflow Presence true, Corner false; real CAPTCHA/JWT/private authorization and explicit opt-in unchanged.
- Verified before preparation: deployed public URL/publishable/Site Key match intended protected inputs; remote posting false, existing guest policies and maintenance job present.
- Pending: owner merge and successful Pages deployment, actual entry visibility, real challenge/anonymous join and two-profile peer checks.
- Still prohibited by this authorization: Corner/posting activation, security bypass, fake visitors or claiming full readiness. If the pilot fails, retain evidence and roll the Presence flag back through a reviewed build.

Operator test: normal Chrome/Edge profile A joins after real verification; independent profile B does the same; each sees one other visitor; wave/sit/acknowledgement, leave/background cleanup and close/focus return are observed. Record errors by stage without credentials or tokens. No scripted challenge solving is required or permitted.
