# Optional Supabase integration / 選用 Supabase 整合

## Release state

V1.5b adds the optional Quiet Garden and a read-only database health check. V1.5c adds the separately gated Quiet Corner. The ordinary map and Faith Moments work without either service. **No hosted project is configured or verified by this guide. Keep both shared-feature flags false in the public build until a controlled deployment and the manual checks below succeed.** The three focused pull requests form a stack: review A, then B, then C; none is merged or deployed automatically.

The current workspace has no configured project URL, public key or server secrets. Local tests and any standalone PostgreSQL fixtures are not evidence of a deployed Supabase Auth/Realtime/Edge stack. Docker was unavailable in the implementation environment; genuine two-browser shared-presence verification remains an operator task unless separately recorded in release evidence.

## Public build configuration

Use the repository's credential-free `.env.example` as the configuration reference. Only these public values belong in the Vite build:

| Variable | Purpose |
| --- | --- |
| `VITE_FAITH_MOMENTS_ENABLED` | Solo animation layer; no backend dependency. |
| `VITE_QUIET_PRESENCE_ENABLED` | Quiet Garden opt-in controls; leave false until verified. |
| `VITE_QUIET_CORNER_ENABLED` | Separate note-board controls; leave false until moderation and backend checks succeed. |
| `VITE_SUPABASE_URL` | Hosted project's HTTPS origin. The client also permits an explicit localhost HTTP development endpoint. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public `sb_publishable_…` key, not a user identity or privileged credential. |
| `VITE_SUPABASE_TURNSTILE_SITE_KEY` | Public Turnstile site key matching the configured site and permitted hostname. |

The implementation accepts the current publishable-key format, not legacy JWT-shaped anon or service-role credentials. Never put a secret key, HMAC secret, CAPTCHA secret, database password or operator token in any `VITE_` value. Vite values are included in browser assets. Changing a build-time flag requires a new frontend build; it is not a remote emergency switch.

## Guest sessions and privacy

The optional SDK loads only when a visitor uses a shared feature. Garden entry or a note/report submission can request guest authentication; reading the approved-note RPC does not create an Auth user. There is no email, password or nickname form. Supabase anonymous sign-in still creates a server-side Auth identity using the `authenticated` database role with an `is_anonymous` claim. It is distinct from the public API key. See [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous).

`src/services/supabaseClient.ts` uses `persistSession: false`, `autoRefreshToken: false` and `detectSessionInUrl: false`. A valid verified guest session is reused in the current page. Tokens are not stored by this integration in local/session storage or cookies. Closing/reloading the page discards that in-memory session; a later explicit opt-in may create another Auth row. An existing session that fails user verification produces a shared-service fallback rather than silently registering again. [Supabase's `getUser` API](https://supabase.com/docs/reference/javascript/auth-getuser) verifies the user with the Auth service; the server independently verifies mutation callers too.

Leaving the Garden removes its live channel, but does not delete the provider's Auth row. Anonymous identities can remain in `auth.users` until an operator handles retention. Periodically evaluate row growth and abandoned accounts, inspect dependencies and active sessions, and agree on a reviewed cleanup policy before deleting identities. Do not copy a blanket age-based delete into an unattended job. The browser's memory-only behavior is not a database-retention policy. Supabase and the configured CAPTCHA provider process their own connection/authentication metadata; this application does not send religion, selected place, map location or reading history to them.

## Configure Quiet Presence in a controlled project

These are prepared operator steps, not actions already performed:

1. Create/select an authorized Supabase project and review current [production guidance](https://supabase.com/docs/guides/deployment/going-into-prod), usage and access settings. Keep the shared frontend switches false during setup. Use a controlled development/staging project before a public release.
2. Enable anonymous sign-in and configure Auth CAPTCHA protection with the chosen site's key/secret and allowed hostnames. The frontend requires a challenge token for a new guest; missing verification leaves the shared feature unavailable. Follow [Supabase's CAPTCHA configuration guide](https://supabase.com/docs/guides/auth/auth-captcha).
3. Review and apply the version-controlled migration `supabase/migrations/202611050001_quiet_presence_health.sql` to the intended project using an authorized operator/CLI workflow. It creates a single non-sensitive `app_healthcheck` row with read-only public access and the narrowly scoped Garden authorization policies. Review the migration list for the checked-out phase; do not reset an existing remote database to test a migration.
4. In Realtime Settings, disable **Allow public access** and use a private channel. The policies permit valid anonymous Auth guests only on `quiet-garden:v1`, with Presence/Broadcast extensions. They do not authorize religion-specific rooms or arbitrary topics.
5. Inspect the policy definitions and test both allowed and denied identities/topics. Do not add `ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY`: Supabase owns this table and already enables RLS. Its current authorization guidance permits managing policies without changing table ownership; see [Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization).
6. Configure only the public frontend origin/key and Turnstile site key in the controlled build. Enable Presence there, then complete the checks below before considering a public build. Configure health monitoring separately following [supabase-health-check.md](supabase-health-check.md); it never creates guest users or publishes notes.

## Presence contract and lifecycle

There is exactly one neutral channel, `quiet-garden:v1`, with `private: true`. The public visitor key is a new random temporary UUID, unrelated to the Auth user ID. Expected Presence fields are `guestKey`, one allowed `avatarVariant`, optional bounded `seatId` and `gesture` (`idle`, `wave` or `sit`). Discrete broadcasts contain the temporary key, an allowed gesture and a monotonic nonce. No names, Auth IDs, religion/organization IDs, geographic coordinates, selected places or reading history belong in the payload.

`presenceTypes.ts` rejects extra/malformed fields and oversized messages, bounds allowed values, strips SDK metadata from the public representation and deduplicates visitors. Received gestures must correspond to a reconciled peer and a newer nonce. The Garden never seeds example people: an empty connection state is an empty garden. These validators protect this client from untrusted peer payloads; topic RLS and provider controls remain necessary for authorization and abuse handling.

The application transmits occasional joins, poses and gestures rather than movement coordinates. Its client throttle and SDK message setting reduce accidental repeated actions; they are not a promise to stop a malicious custom client. Review platform rate controls and resource usage before enabling the service publicly. There is no conventional chat, message history, follower system or realtime database table for visitor movement.

Joining is explicit and bounded. Leaving, unmounting or backgrounding untracks Presence, releases the channel/listeners, stops this visit's reconnect attempts and clears gesture timers. Returning from a hidden tab requires explicit entry again. Temporary disconnects clear stale peers and use a bounded recovery interval; failures show the bilingual shared-service fallback without blocking solo exploration. Auto-refresh is stopped during teardown; the current page can reuse a still-valid guest session for a later explicit request.

## Required integration checks before public enablement

- In two genuinely separate browser sessions, opt in independently and confirm that only live peers appear. A single mocked client does not prove shared presence.
- Before opt-in, inspect network activity and confirm that no guest registration or Realtime channel starts. Test missing configuration, failed Auth/CAPTCHA, paused/unavailable project and offline browser.
- Test the intended anonymous guest on the exact private topic; verify rejection for an unauthenticated client, a non-anonymous Auth user and another topic. Confirm the deployed policy behavior rather than relying only on SQL text tests.
- Inspect actual Presence/Broadcast payloads for the neutral schema; ensure Auth IDs, selected religions/places and location/history are absent. Check malformed data, duplicate synchronization, nonce replays and rapid gestures.
- Leave, close the panel, change context and background the tab; confirm peers disappear, the channel and reconnect attempts stop, and the original map/reading context remains available. Repeat with reduced motion and keyboard-only input.
- Monitor current provider usage and denial/error rates under controlled load. Record actual outcomes and keep the public flag false if any safeguard is unverified.

## Disable, rollback and availability

Disable Presence by rebuilding with `VITE_QUIET_PRESENCE_ENABLED=false`; disable Corner independently if needed. A visitor can always leave immediately, and service failures must leave the map and solo controls functional. Reverting a frontend release does not automatically reverse database migrations. Stop new activity, review any retained data and policy changes, and use a reviewed forward migration or restoration procedure rather than blindly dropping shared objects.

Scheduled health reads are separate from website deployment. They may help detect availability and produce harmless database activity, but cannot guarantee that a Free project will remain active. Scheduling and provider policies can change, and paused projects may require an authorized operator to resume them manually. Consult the current production guidance and [health-check guide](supabase-health-check.md); do not promise fixed future quotas or permanent availability.

## 繁體中文

V1.5b的靜心庭院及V1.5c的留言角落各自受旗標控制。此文件沒有代表已設定或驗證遠端專案；公開版本的共享旗標維持 `false`，待受控環境與人工整合檢查完成後才考慮啟用。一般地圖與單人信仰片刻不依賴 Supabase。三個階段以堆疊PR分開審查，不自動合併或部署。Docker不可用，單獨PostgreSQL測試也不能代替完整Supabase與兩瀏覽器驗證。

公開建置只放 `VITE_` 公開設定：三個功能旗標、專案URL、`sb_publishable_…`金鑰及Turnstile網站金鑰。秘密金鑰、資料庫密碼、HMAC與CAPTCHA秘密皆不可進入前端。公開金鑰不是訪客身分；匿名登入仍在Supabase建立有 `authenticated` 角色及 `is_anonymous` 宣告的內部Auth身分。

SDK僅在使用共享功能時載入。庭院進入或留言／檢舉送出才可取得匿名訪客，讀取已核准留言不建立Auth使用者。前端使用不持久化、不背景自動更新的記憶體工作階段，當頁可重用經核實且有效的身分；重整後新的明確選用可能建立另一筆Auth紀錄。驗證失敗顯示共享備援，不靜默重複註冊。離開庭院不會刪除Auth資料；應評估使用量、依賴與活動狀態後，制定有審查的清理方式，不直接排程大量依年齡刪除。記憶體工作階段不等於後端保存期限。

設定時先在獲授權的受控專案啟用匿名登入與Auth CAPTCHA，再審閱套用 `202611050001_quiet_presence_health.sql`。Realtime停用公開存取，只授權匿名Auth訪客使用單一私有 `quiet-garden:v1`。`realtime.messages`由Supabase管理且已啟用RLS，不加會因所有權失敗的ALTER指令；只管理所需政策。上方官方文件連結說明目前要求。

共享資料僅有隨機暫時訪客鍵、允許的外觀、座位與中性動作，沒有Auth ID、教別、場所、座標或閱讀紀錄。一次性動作帶nonce；接收端拒絕額外欄位、過大資料與無效重播，並整理真實連線訪客。不造假訪客。客戶端節流不能當成阻止惡意自訂客戶端的保證，公開啟用前仍須檢查平台授權、流量與資源控制。

進入需明確操作；離開、卸載與分頁進入背景會清理Presence、訂閱、重連及動作計時。回到前景須自行再次進入。斷線採有界恢復，失敗不阻斷原探索。正式啟用前，應用兩個真正獨立的瀏覽器驗證互相可見、未選用前無Auth／Realtime請求、未授權身分與其他topic被拒、實際payload無敏感探索資訊、離開清理、無障礙及原脈絡還原。沒完成驗證就保留公開旗標關閉。

停用可個別重建為Presence或Corner旗標 `false`；資料庫回復另須審閱，不因前端退版就盲目刪表。健康檢查獨立於部署，不會建立訪客或留言，也不能保證免費專案永不暫停；排程、方案與恢復政策會變動，暫停時由授權操作人員手動處理。操作細節見健康檢查指南。

## Local verification record (2026-11-06)

An isolated PostgreSQL 18 instance ran `supabase/tests/bootstrap.sql`, the phase-B migration and `supabase/tests/phase_B.sql` with `ON_ERROR_STOP`. Assertions covered the real database's read-only health grant and anonymous/private-topic policies. The bootstrap supplies test Auth claims and a test Realtime table; it does not verify JWT signatures or establish an actual Supabase Realtime connection. Never run that bootstrap against a hosted project.

The optional frontend and transport have mocked lifecycle, validation, CAPTCHA and failure tests. The production bundle loads the SDK in a separate chunk. No remote project, Auth CAPTCHA configuration, GitHub health secrets or genuine two-browser session was available for verification. Both shared deployment flags remain false.

Turnstile loads only inside an explicitly opened optional feature. Use an authorized site key for the deployed hostname, enable the matching Auth CAPTCHA provider, and verify its real behavior before enabling Presence. Browser verification failures leave exploration available.
