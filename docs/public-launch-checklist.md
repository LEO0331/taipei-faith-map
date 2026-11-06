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
