# Demonstration guide / 展示指南

A short, self-paced walkthrough of supported functionality. The first 30–60 seconds are a design target, not a measured usability result. Check the actual build's flags and service status before presenting; merged code is not proof of live shared services.

## Solo walkthrough

1. Open the map and choose Chinese or English. Use the welcome's **Explore a Faith Space** action to open a visible result, or **Browse the map** to choose a place yourself. There is no compulsory tutorial, signup or location permission; nearby search is optional.
2. In **Cultural Scene**, select one numbered hotspot. Read the explanation immediately. Explain that the original illustration describes a cultural tradition, not a reconstruction of that selected building.
3. Try one short **Walk**, **Sit**, **Wave** or **Observe** action, then turn **Animation Off**. Device reduced-motion also applies. Reading never depends on completing movement. Close the scene and show that map/filter context remains.
4. For a safely matched place, open **About This Place**, read one source-backed fact and its citation/check date. If the place has no profile, use its available cultural scene or choose a matched place; do not describe missing content as verified.
5. Optionally open Calendar, Walking Routes or History & Stories. Distinguish festival reference text from dated events, route-stop order from a surveyed path, and historical dates from current registration locations. Sources and announcements may change.

This is a complete demonstration when shared services are unavailable. No Supabase setup, CAPTCHA or guest registration is needed for these steps. External map tiles and source pages still require their own network access; offline behavior must be described from the actual tested state.

## Shared garden — only when configured and verified

The optional Quiet Garden entry appears only under enabled shared-feature flags. If it is absent in the public build, explain that the release intentionally keeps shared services off until operational checks are complete. Do not change public flags for a demonstration shortcut.

1. Open **Quiet Garden** and read its short notice: one neutral space, no conversation required, selected religions/places are not shared, and anyone can leave.
2. Joining is a separate deliberate action. Complete a genuine verification challenge only if requested. Simply opening the dialog or reading the approved-note board should not create a guest or require CAPTCHA.
3. Use two independent, authorized test sessions to demonstrate actual Presence. If nobody else is connected, show the truthful empty state. Never add demo visitors or claim one session proves shared synchronization.
4. Wave or sit once. A greeting is neutral and unattributed, not a message from a verified public identity. Leave, close or background the dialog; verify cleanup and return to the previous exploration context.
5. If the service is unavailable, use **Return to exploration** and continue the solo walkthrough. Do not retry indefinitely or imply an uptime guarantee.

## Quiet Corner — read first, write optionally

Open **Quiet Corner** only when that feature is configured. Read the small approved-note selection without signing up, joining Presence or completing a submission challenge. An empty board is a valid demonstration; do not preapprove fictitious public notes.

Only demonstrate submission in an authorized controlled project with moderation, CAPTCHA, rate controls and retention verified. Write a short neutral thought without personal information. Anonymous Auth may consume a first challenge; the draft remains while a fresh action-specific challenge is requested. A successful submit displays **received for review**, not immediate publication. The authorized operator can then privately review one controlled test note, approve it, verify its display-only public response, and hide/delete it after the test. Keep test records private and record what actually happened.

If posting is paused or no authorized test backend exists, demonstrate reading/closing or return to the solo experience. Do not claim submission, approval, scheduled retention or reporting worked without observing it.

## 展示重點

先以單人探索完成簡短展示：選擇場所 → 文化示意熱點 → 一個可略過的角色動作 → 關閉動畫 → 查看有來源的場所介紹 → 返回地圖。30–60秒是設計目標，並非已量測成果。場景是文化示意，不是所選建築的實景重建。

共享服務未設定或旗標關閉時，直接展示地圖、信仰片刻、行事曆、路線與歷史即可。不要為展示開啟未驗證的公開服務。庭院需自行加入，閱讀已審核留言不應註冊訪客或要求驗證；如無其他人，呈現真實的空庭院／空留言板。投稿只在獲授權、具備審核與安全控制的測試環境進行，成功送出仍為待審，不能宣稱即時公開。

For operational prerequisites and evidence recording, use the [launch checklist](public-launch-checklist.md), [release record](release-v1.6.md) and [accessibility review](accessibility-review.md).

## Current V2.0 demonstration boundary

The actual public Pages site and the solo walkthrough have now been exercised in a real browser. Controlled builds passed the desktop/tablet/mobile bilingual journeys and passive hosted-note reading; details are in [V2.0 evidence](release-v2.0.md). The public shared entry remains disabled. Turnstile is configured, but real challenges failed in the tested automated Chromium/Chrome sessions, including owner manual attempts. Do not present a working live garden or successful submission from those results, add demo peers, or enable flags for a demonstration shortcut. Use the complete solo walkthrough while positive guest/two-browser tests and operator launch approval remain outstanding.

## Final integration recovery / 最終整合復測

The existing Playwright suite's current failures must be classified by layer: managed kernel initialization, actual browser availability, real challenge verification, Auth, Realtime and note publication. A successful static browser does not imply a valid CAPTCHA or authenticated peer. The final integration record contains the recovered browser versions, redacted results and blocked paths. To reproduce a blocked real challenge, use an authorized ordinary-browser controlled environment with the real widget; inspect Cloudflare analytics/allowed hostnames and record the provider's outcome without sharing tokens. Do not switch to dummy keys or enable the public flags to work around a provider rejection.

For the two-browser recheck, use independent sessions, complete each genuine challenge, join each explicitly, observe one actual peer in each, then wave/sit/acknowledge, leave, background and reconnect while inspecting neutral payload field names. Record observed results and cleanup privately. After that succeeds, arrange a specifically authorized controlled posting window and operator coverage for the pending→approve→read→report→hide/delete flow; restore the original posting state and remove only test content. Public activation remains a separate reviewed PR and owner decision.
