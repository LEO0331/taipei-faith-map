# Quiet Corner operations / 留言角落操作

## Publication gate

Quiet Corner is the optional V1.5c board belonging to the one neutral Quiet Garden. It has no religion/place-specific boards, authors, profiles, replies or chat. Visitors may read a small approved selection without submitting anything. New notes always begin **pending** and appear publicly only after an operator approves them.

**Public posting is not enabled or deployed by this guide.** `VITE_QUIET_CORNER_ENABLED` stays false in the public build, and the database starts with `quiet_corner_settings.posting_enabled=false`. Keep those defaults until Auth, CAPTCHA, function authorization, moderation coverage, retention maintenance and controlled role/integration tests are verified. No production request, moderation action or two-session result is implied by local code, mocked tests or standalone PostgreSQL fixtures.

Configure the shared client and anonymous Auth first using [supabase-integration.md](supabase-integration.md). Corner and Presence have independent flags: one must not need an active Presence subscription to read or submit a note. Opening the board performs a bounded approved-note read; it does not create a guest user. Submission/reporting explicitly uses a verified anonymous guest session.

## Database and read contract

Review `supabase/migrations/202611050002_quiet_corner.sql` before applying it to an authorized controlled project. It defines:

| Object | Role |
| --- | --- |
| `quiet_notes` | Plain text, moderation status, creation/review/expiry timestamps and a private HMAC author key. |
| `quiet_note_reports` | Bounded reason codes and private reporter keys; note deletion cascades to its reports. |
| `quiet_rate_limits` | Private per-actor/action rate-control windows. |
| `quiet_corner_settings` | Singleton emergency posting switch, initially false. |
| `get_approved_quiet_notes(p_limit)` | Public read-only RPC; returns at most 15 unexpired approved notes as `id`, `content`, `expires_at` only. |

RLS is enabled and public/anonymous-Auth roles have no raw-table read or mutation access. Even an author cannot read a pending raw row. The display RPC is an intentionally narrow `SECURITY DEFINER` function: it uses qualified table names, a controlled search path, a fixed response shape, approved/unexpired predicates and a bounded limit. Verify its actual role behavior after deployment. Do not replace it with an unrestricted owner-executed view or return raw table rows. Client filtering is additional defense, not the confidentiality boundary.

All queue/report/moderation/maintenance mutation RPCs are privileged. Neither a public API key nor an anonymous guest JWT may call them directly. `queue_quiet_note` creates `pending` rows only; the caller cannot supply a status. `report_quiet_note` accepts reports only for approved, unexpired notes and deduplicates an actor's report for the same note. Reporting does not automatically approve or hide content.

## Edge Functions and configuration

`submit-quiet-note` and `report-quiet-note` retain `verify_jwt=true` in `supabase/config.toml`. Their shared handler also verifies the bearer token against `/auth/v1/user`, checks `is_anonymous=true`, validates the schema and only then calls the privileged RPC. A decoded client token or `getSession()` result alone is not accepted as server verification. See [Supabase's current Edge Function authentication guidance](https://supabase.com/docs/guides/functions/auth).

Current hosted Edge Functions inject `SUPABASE_URL` and the JSON dictionaries `SUPABASE_PUBLISHABLE_KEYS` and `SUPABASE_SECRET_KEYS`; this handler uses their `default` entries. Do not try to create custom secrets using the reserved `SUPABASE_` prefix. The privileged entry is an `sb_secret_…` server key and must never enter a Vite build. This runtime naming differs from the singular GitHub health-check secret. See [Supabase Edge Function environment variables](https://supabase.com/docs/guides/functions/secrets).

Configure these custom server-only values through the Dashboard or an authorized CLI using an ignored private env file:

| Variable | Required behavior |
| --- | --- |
| `QUIET_IDENTITY_HASH_SECRET` | At least 32 characters of securely generated secret material for HMAC-SHA256 actor keys. |
| `QUIET_ALLOWED_ORIGINS` | Comma-separated exact frontend origins, without paths or `*`. For GitHub Pages, use the origin rather than the repository subpath. |
| `QUIET_TURNSTILE_SECRET` | Secret matching the configured public Turnstile site key. |
| `QUIET_TURNSTILE_HOSTNAMES` | Comma-separated exact allowed result hostnames, without scheme/path. |
| `QUIET_CAPTCHA_REQUIRED` | Defaults to required. A value of false only permits bypass in explicit local development, never a hosted project. |
| `QUIET_LOCAL_TEST_MODE` | Internal local-stack fixture support only; never enable it in the public deployment. |

Hosted configuration fails closed when required verification material is missing. Local functions may use the explicitly allowed loopback endpoint, or internal `kong` only with local test mode; these are not hosted CAPTCHA exceptions. Keep local secrets out of Git. Local Edge secrets and the frontend env file are separate runtimes; see the official environment guide before assuming a root env file reaches a function.

After reviewing the migrations, secrets and intended project, the operator can deploy the two functions with the CLI:

```text
supabase functions deploy submit-quiet-note
supabase functions deploy report-quiet-note
```

These are setup instructions, not completed deployment evidence. Do not add `--no-verify-jwt` to fix an authentication failure. Recheck the project's current user-JWT and signing-key configuration instead.

## Input and abuse controls

The submission schema is `{ content, captchaToken? }`. Reporting uses `{ noteId, reason, captchaToken? }`, with `reason` limited to `unsafe`, `personal-data`, `spam` or `other`. Unknown fields are rejected. The handler requires JSON, bounds the complete request to 4096 bytes, and applies request/body/service deadlines.

Server-side text is NFC-normalized, trimmed and limited to **80 Unicode grapheme clusters** and **1024 UTF-8 bytes**. The database adds a 1024-code-point/1024-byte defensive bound; it does not substitute for Edge grapheme validation. Hidden control characters, markup delimiters and link-shaped prefixes are rejected. The frontend renders escaped text without Markdown, HTML, uploads, mentions or clickable URLs. Validation is not content approval: every valid note still waits for human moderation.

The database serializes rate-control updates per actor/action. Current application limits are at most five submissions per hour with a two-minute gap and ten reports per hour with a fifteen-second gap. Identical normalized content by the same private actor is deduplicated while retained. These are this application's controls, not Supabase plan quotas. Anonymous Auth alone does not stop an attacker from obtaining fresh identities; configure Auth bot controls, CAPTCHA, platform monitoring and a responsive operator before public enablement.

Auth CAPTCHA and function CAPTCHA are separate checks. A token consumed during first guest creation cannot be reused for submission. The UI must request a fresh challenge before the Edge call; existing valid page sessions can proceed directly to the operation's challenge. Turnstile results must report success, an allowed hostname and action `quiet-note` or `quiet-report` as appropriate. Never reuse a note token for a report or accept a client-provided success flag. The provider's setup is described in [Supabase CAPTCHA protection](https://supabase.com/docs/guides/auth/auth-captcha).

The server stores only an HMAC of the internal Auth ID for dedupe/rate/reporting, not that raw ID in note tables. That value remains private metadata, not a public anonymous profile. Do not expose it in RPC output or logs. Secret rotation changes actor correlation and must be reviewed alongside retained counters/notes; it is not a routine frontend action.

## Private operator workflow

Use the Supabase Dashboard SQL editor as an authorized operator, or an equivalent protected administrative connection. There is no public moderation website. These examples are prepared commands; replace the UUID placeholder only after reviewing the intended row. Do not paste private rows or operator credentials into public issues.

Review a bounded pending queue:

```sql
select id, content, created_at, expires_at
from public.quiet_notes
where status = 'pending' and expires_at > now()
order by created_at
limit 50;
```

Read the actual text before approval. Reject personal information, threats, harassment, spam, coercive or discriminatory content, and requests that turn the board into private counselling or a chat channel. Treat religious expression respectfully and use the board's short, neutral scope consistently. Keyword filtering is not the moderator.

Approve, hide or delete a reviewed note using one explicit action:

```sql
select public.moderate_quiet_note('NOTE_UUID'::uuid, 'approve');
select public.moderate_quiet_note('NOTE_UUID'::uuid, 'hide');
select public.moderate_quiet_note('NOTE_UUID'::uuid, 'delete');
```

These are alternatives, not a batch to run together. Approval cannot revive an expired note. Hiding removes it from the public RPC immediately; deletion removes it and cascades its reports. Record operational decisions privately and avoid creating an indefinite duplicate archive of note content.

Review reports without unnecessary actor metadata:

```sql
select r.id, r.note_id, r.reason, r.created_at, n.content, n.status
from public.quiet_note_reports r
join public.quiet_notes n on n.id = r.note_id
where r.reviewed_at is null
order by r.created_at
limit 50;
```

After a decision, mark the reviewed report explicitly:

```sql
update public.quiet_note_reports
set reviewed_at = now()
where id = 'REPORT_UUID'::uuid;
```

### Emergency disable and deliberate enablement

Stop new submissions immediately:

```sql
update public.quiet_corner_settings
set posting_enabled = false
where id = 1;
```

This does not retract already approved content. Hide/delete affected notes separately. A frontend build with `VITE_QUIET_CORNER_ENABLED=false` removes the optional board controls while leaving the core app usable; that build-time change is independent of the immediate database switch.

Only after the readiness checks and moderation/maintenance ownership are verified may an operator deliberately set `posting_enabled=true` for the reviewed project. This repository change does not perform that action. Leave it false when no moderator is available or any server safeguard is unverified.

## Retention and maintenance

| Data | Current policy |
| --- | --- |
| Approved/public notes | Expire no later than 30 days after creation, not 30 days after approval. |
| Pending notes | Delete after seven days if not handled, or earlier expiry. |
| Hidden notes | Delete seven days after review, or earlier expiry. |
| Reports | Delete after 30 days, or earlier when the referenced note is deleted. |
| Rate counters | Delete after 24 hours without an attempt. |
| Supabase Auth identities | Separate provider records; no automatic deletion is implemented here. |

Public RPC visibility ends at `expires_at` even if physical maintenance has not yet run. Configure and verify a privileged daily maintenance procedure before enabling posting, using the existing function:

```sql
select public.maintain_quiet_corner();
```

The function deletes expired/aged rows according to the table above. It does not schedule itself and does not delete Auth users. An operator may schedule it through an authorized Supabase maintenance facility and must monitor that execution. The GitHub database health check is **read-only** and must never be repurposed to run cleanup, migrations or moderation. Without configured maintenance, expired rows can remain privately stored beyond their visibility window, so public posting must remain disabled until the retention procedure is operational.

## Required role and integration checks

- Test raw-table and privileged-RPC denial as both a public-key/unauthenticated caller and an anonymous Auth guest. Verify approved-only RPC output, expiry, the 15-note cap and absence of author/report/rate metadata.
- Test missing/invalid user JWTs, permanent non-anonymous accounts, unknown fields, non-JSON/oversized bodies, byte/grapheme boundaries, markup/link input, wrong origin and service timeouts.
- Test missing, failed, consumed, wrong-host and wrong-action CAPTCHA tokens. With hosted configuration, missing verification must fail closed; local bypass is not a production proof.
- Test rapid/concurrent submissions, duplicate notes, repeated reports, approval/hiding/deletion, posting disabled and the maintenance function. Confirm a submitted note is not displayed until approved.
- In a controlled browser environment, read without authentication, submit with a genuine guest and fresh challenge, approve privately, verify only the display fields, report, hide and confirm disappearance. Recheck keyboard focus, plain-text rendering, closing during requests and return to exploration.

Record which checks actually completed. Docker was unavailable during implementation; standalone PostgreSQL role fixtures and mocked Edge tests do not verify the real hosted Auth gateway, Realtime authorization or two-session behavior. Keep the public flag and posting switch off until those operational checks are recorded.

## 繁體中文

留言角落是V1.5c的選用中性留言板，屬於單一庭院，不設教別／場所分板、作者檔案、回覆或聊天室。可先閱讀最多15筆已核准且未到期的留言，不必投稿。所有新留言一律待審，經操作人員核准後才公開。此文件未部署或啟用公開投稿；前端Corner旗標與資料庫 `posting_enabled` 預設皆關閉。

原始留言、檢舉、節流及設定表啟用RLS，不供公開或匿名Auth訪客讀寫，作者也不能讀取待審原始列。唯一公開讀取RPC只回傳 `id`、`content`、`expires_at`，固定限制已核准、未到期與最多15筆。提交、檢舉、審核、維護RPC僅供有權限的後端／操作人員，前端不能指定核准狀態。

兩個Edge Function保留 `verify_jwt=true`，並另外向Auth `/auth/v1/user`核實匿名身分。平台注入 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEYS`及 `SUPABASE_SECRET_KEYS` JSON字典，程式使用default項目；不要建立保留前綴的自訂SUPABASE秘密。私密設定為 `QUIET_IDENTITY_HASH_SECRET`、精確Origin清單、Turnstile秘密與精確hostname清單；正式環境缺少CAPTCHA設定即拒絕操作。本機明確測試模式不是正式旁路。上方官方文件連結說明環境及驗證要求。

伺服器驗證JSON結構、完整請求4096 bytes、NFC與去空白後最多80個Unicode grapheme／1024 UTF-8 bytes；資料庫另設1024 code point／1024 bytes防線。隱藏控制字元、標記界符及網址形前綴會被拒，前端只顯示跳脫純文字，不渲染HTML、Markdown或可點網址。驗證不等於審核。資料庫目前限制每小時最多5次提交且相隔2分鐘、10次檢舉且相隔15秒，並控制同一私密actor的重複內容；匿名身分本身不能阻擋重新註冊攻擊，仍須CAPTCHA、平台控制與人工監看。

首次建立訪客所耗用的Auth CAPTCHA不能再用於提交，UI需取得新的操作驗證；已存在當頁有效身分可直接進入該次操作的challenge。伺服器核對成功、允許hostname及 `quiet-note`／`quiet-report` action，不相信客戶端的成功宣告。資料表只留Auth ID的私密HMAC以節流／去重，不回傳公開；Auth身分本身仍屬另行管理的提供者紀錄。

操作人員使用受保護Dashboard或SQL連線檢視待審、執行 `moderate_quiet_note` 的approve／hide／delete，並處理檢舉與記錄決定。上方SQL為準備好的人工指令，並非已執行動作；三種審核動作是擇一，不能整批照貼。核准不能復活過期留言。緊急停寫立即將 `posting_enabled=false`；既有已核准留言須另外隱藏／刪除，前端旗標停用則需重新建置。

留言最遲於建立30日後失去公開資格；待審7日未處理、隱藏後7日、檢舉30日與節流最後使用24小時依維護程序刪除，留言刪除亦連帶刪除檢舉。`maintain_quiet_corner()`只提供清理邏輯，不自行排程、不刪Auth使用者。啟用投稿前須設定並驗證有權限的每日維護，否則到期列雖不再公開，仍可能在私下留存。健康檢查僅唯讀，不得拿來做清理、審核或遷移。

公開啟用前應實測未登入與匿名訪客的權限拒絕、公開RPC範圍、JWT／CAPTCHA／Origin／大小驗證、併發節流、去重、審核、檢舉、停寫與到期清理，再於受控瀏覽器完成真實投稿與私人核准／隱藏流程。Docker不可用時的獨立PostgreSQL及mock Edge測試，不能宣稱已驗證完整Supabase、遠端部署或兩個共享工作階段。未完成就維持公開旗標與投稿設定關閉。
