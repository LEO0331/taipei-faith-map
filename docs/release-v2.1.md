# V2.1 release evidence

The 2026-11-09 baseline is main commit `ccf7cf1`, which contains the merged V2.0 garden feedback. A clean install, 478 tests and the Pages build passed before V2.1 edits. The three review branches are ordered A → B → C.

| Phase | Changes and files | Verification |
| --- | --- | --- |
| A | Both existing walking narratives revised. Two new routes connect Ciyou and Fude in Songshan and the Grand Mosque and Grace Baptist Church in Daan. Route cards preview themes and stops. Next/Previous focus the stop and overview return focuses its card. Changes are under `src/features/cultural-routes/`, related-content and audit test fixtures, and `docs/cultural-content.md`. | Isolated install, 481 tests, Pages build, 91 asset references. Main gzip 170.95 kB versus 170.94 kB at baseline. |
| B | Adds three-chapter stories for Dadaocheng and Songshan, eight milestones and four exact current-place matches. Route links use a validated shared place. Timeline detours preserve the chapter, and the return to the route preserves the stop and focus. Changes are under `src/features/heritage/`, App navigation and tests, and `docs/historical-content.md`. | 482 tests and zero structural audit errors. Intermediate Pages main gzip 171.45 kB. |
| C | Adds the bilingual welcome phrase, softer story ending, stronger citation contrast and small-screen text wrapping. Adds monthly monitoring scripts, a tracked baseline, a dedicated workflow and offline fixtures. The demo suite, READMEs and maintenance documentation reflect the current experience. | 505 tests across 59 files, including 23 monitoring tests. Pages build, 97 asset references, 23 browser cases and the structural audit passed. The monitoring workflow awaits its first GitHub run after merge. |

## Cultural evidence and review

The route additions use exact organization IDs, district and address matches, and valid registration coordinates. The old-Xikou route draws on the tourism authority and the Fude Temple place record. The Xinsheng South Road route uses the city pictorial, official mosque guide and Grace Baptist Church’s history and address. The history additions use the Songshan district gazetteer, Ministry of the Interior, Presbyterian Church and Bureau of Cultural Heritage records. Six new milestones retain year precision and two retain source-supported exact dates. See the claim and identity notes in [cultural content](cultural-content.md) and [historical content](historical-content.md).

All additions carry internal editorial review dated 2026-11-09. The browser journey uses those published records. Current registered coordinates mark current places. The source audit checked 29 URLs. Two requests returned HTTP 403, including the Taipei Pictorial PDF and the Tenrikyo institutional introduction. Their automated reachability is inconclusive. The route also cites independently reachable institutional pages.

## Attention-respecting experience

The welcome presents **慢慢探索，重新感受。** and **Explore slowly. Notice deeply.** above the existing entry actions. The visual hierarchy keeps the primary place action legible while routes and stories remain available in the existing navigation. Route observations point to details visitors can look for at the site. A chapter or stop can stand on its own, and the story conclusion offers a place to pause. The optional Reflection Timer remains available. See the [three design principles](design-philosophy.md).

Real Chromium uncovered a replaced route history button after a map detour, low contrast in route citations and mobile overflow when root text was enlarged. The return locates the replacement by route ID. Citation text uses a darker green, and the mobile header title and language controls fit at enlarged root text.

## Full-project demo check

| Area | Evidence |
| --- | --- |
| Map, search and filters | Real Chromium welcome and map journeys in both languages. The search term survives route, history and calendar navigation. |
| Nearby | Two real-browser UI checks with simulated coordinates and loopback geolocation permission. |
| Faith Spaces and Faith Moments | Real hotspot selection, optional motion, emulated reduced motion, Escape and restored focus. The Bangka journey also opens the actual selected stop’s Faith Space. |
| Routes, heritage and related content | Route → selected stop → Faith Space → story → milestone → current registered map location → history → original stop. Browser tests verify the return control. Unit tests cover language change and return from a place profile. |
| Calendar | Browser entry and return to the same search. Existing offline tests cover agenda, dated entries and reference distinctions. |
| Optional sharing | The current public Garden entry opened and closed with focus restoration and zero Auth or CAPTCHA requests. Corner was absent. Blocking the Garden's lazy asset in an isolated browser showed the fallback, restored focus and left Faith Space available. Positive guest and two-person interaction were outside this browser check. |
| Deployment and PWA | The existing public site served its Pages subpath, manifest and icons. The review build passed the scoped asset check. Local Chromium exercised cached-shell reload, scoped cache entries and refreshed HTML. |

The [demo guide](demo-guide.md) includes the one-minute and five-minute walkthroughs and a portfolio overview. The timing is a presentation target. The solo journey uses the static dataset and curated sources. Network access remains relevant for external tiles and linked publications.

## Browser and performance evidence

Sandboxed Chromium 158.0.8127.18 passed 23 recorded cases. These include ten bilingual solo journeys, ten cross-feature journeys at 1280/768/390/375/320 CSS pixels, two simulated nearby checks and one PWA case. Scoped rendered axe checks covered Faith Spaces, routes and stories at desktop and 320px, including contrast. The 320px test doubled root text size. Device reduced motion was emulated at 375px. Physical mobile devices, assistive technology and full browser zoom remain manual checks.

The final Pages build emitted a 171.46 kB gzip main bundle, versus 170.94 kB at baseline. The route and heritage panel bundles were 3.72 kB and 5.34 kB gzip in that build. The optional Supabase SDK remains lazy, as confirmed by zero optional network activity during the solo journeys. Runtime dependencies are identical to the baseline.

## Monthly monitoring evidence

The reviewed government baseline is the canonical JSON from merged main. Curated inventory provenance is the V2.1b commit. Baseline digests detect changes to the inputs and require a reviewed baseline update. The official landing page supplied the current ODS resource. The normalized comparison found 551 records on each side, with zero additions, removals, modifications or ambiguous matches.

The local combined report checked 29 links and classified two HTTP 403 results as inconclusive. It reported **Monitoring incomplete**, zero structural findings, 352 baseline-known advisories and one approaching-event review for the announced Qingshan procession. Only sanitized reports are uploaded. Deterministic IDs and one tracker preserve unresolved observations across runs. The notification job has the issue permission and updates the tracker for new evidence. See [monthly maintenance](monthly-content-maintenance.md).

## Maintenance priorities

| Priority | Work |
| --- | --- |
| P1 | Recheck the public build after owner merge. Exercise the demonstration return flow and resolve any accessibility or cultural accuracy blockers. |
| P2 | Review the first monthly report, reopen the two inconclusive URLs in a normal browser and check the organizer’s upcoming procession notice. Approve any content or baseline changes in a separate PR. |
| P3 | Perform physical-device and screen-reader checks, then use observed issues to prioritize any additional UI polish. |

The owner can manually dispatch the workflow once it is present on the default branch. Scheduled runs can be delayed or dropped. [GitHub workflow triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)

## Production Garden hotfix — 2026-11-09

A read-only Realtime log query found three `ClientPresenceRateLimitReached` events from 11:12 to 11:15 Asia/Taipei. The previous two-second action interval could schedule 15 changed seats plus the initial registration in 30 seconds with prompt acknowledgments. Supabase documents a default of five `track()` or `untrack()` operations per connection in 30 seconds. The production configuration export did not expose a per-client override. [Supabase Presence limit](https://supabase.com/kb/troubleshooting/realtime-client-presence-rate-limit-reached)

The client uses a 31-second monotonic rolling budget shared by visits and reconnects that reuse its SDK instance. Four slots cover track attempts, including registration and reconnect, and the fifth is reserved for departure. If no departure slot is available, the socket closes and its Presence is removed by disconnect. Acknowledged identical poses require no send. A single latest pose waits for capacity, while waves have a separate pending slot and two-second send interval. An unsuccessful acknowledgement leaves the pose unconfirmed. Queued work is cancelled on disconnect or leave.

In the deterministic eight-seat test, 15 choices spaced two seconds apart generated four track attempts in the first 30 seconds, including the initial registration. The fifth attempt sent the final seat when capacity returned at 31 seconds. The previous count of 16 is calculated from the old pacing under the same prompt-ACK scenario. Local actions remain immediate while the newest pose awaits acknowledgment.

Validation used locked dependencies, offline transport and accessibility tests, the structural content audit, the Pages build and asset checker, 23 Chromium demo cases, and local Garden rendering checks at 1280, 375 and 320 pixels with simulated transport. The main bundle is 171.46 kB gzip and the Garden lazy module is 16.51 kB gzip in the Pages build. Hosted two-browser synchronization remains to be checked.

After deployment, use two separate ordinary browser profiles and complete the real guest verification in each. With both present, switch among all eight seats in the first profile for more than 30 seconds, repeat one seat, then wave and rest. Check that the first character responds immediately and the other profile eventually sees the final pose. Test backgrounding, leave and re-entry. Inspect Realtime logs for the test time and record any rate-limit errors. Roll back by reverting this hotfix through the usual Pages review and deploy path.
