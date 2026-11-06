# Supabase database health check / 資料庫健康檢查

The optional shared features use Supabase; the existing map and solo Faith Moments do not depend on this check. The workflow observes a real, harmless PostgreSQL read through the Data API. It creates no guests, notes or fake visitor activity, never runs migrations, and never resumes a paused project.

## Operator setup

1. Apply the version-controlled presence/health migration to the intended Supabase project using the separate setup procedure. It creates `public.app_healthcheck` with the static record `{ "id": 1, "status": "ok" }`. RLS and grants allow the necessary read, with no public writes. The relation contains no visitor or religious information.
2. Add repository Actions secrets named `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Use the hosted project's HTTPS URL and its public `sb_publishable_...` key. Do not use a secret key, service-role token, database password or admin JWT. The key is sent only in the `apikey` header.
3. After this workflow reaches the repository's default branch, choose **Actions → Supabase Health Check → Run workflow**. Inspect the concise result. No successful production check is claimed until that configured run actually succeeds.
4. Enable the scheduled workflow only when the migration and secrets are ready. Missing configuration is a failed job, not a successful or silently skipped check. The workflow can be disabled through GitHub Actions while a project is intentionally unused; disabling it does not affect Pages deployment.

The schedule is `17 2,10,18 * * *`: **02:17, 10:17 and 18:17 UTC**, corresponding to **10:17, 18:17 and 02:17 the following day in Asia/Taipei**. It makes one logical check per run, with at most two read attempts for temporary failure. Authentication and unexpected-data failures are not retried. The independent job has a three-minute timeout, read-only repository permissions and a concurrency group; it installs no dependencies and does not rebuild or deploy the website.

## Read and failure behavior

`scripts/checkSupabaseHealth.mjs` sends a `GET` to `/rest/v1/app_healthcheck?select=id,status&id=eq.1&limit=1`. It requires HTTP 200 and exactly one record with only `id: 1` and `status: "ok"`. Response bodies are bounded to 1024 bytes and attempts to eight seconds by default. Redirects are rejected so credentials are not forwarded to another destination.

Only hosted `https://<project>.supabase.co` roots and publishable keys are accepted. The script uses no cookies or logged-in session. Logs contain fixed result text rather than configuration values, headers, response bodies or raw exceptions. Missing settings, denied reads, unexpected responses, timeouts and exhausted retries return a nonzero exit status. A failure cannot block or mutate the existing GitHub Pages deployment.

Run the same check locally after configuring the two environment variables privately:

```sh
node scripts/checkSupabaseHealth.mjs
```

Offline tests use injected responses and require no project or credentials:

```sh
npx vitest run scripts/checkSupabaseHealth.test.mjs
```

## Availability limits

Supabase's current checklist says Free projects may pause after low activity over a seven-day period, and paused projects can be restored through its Dashboard. Periodic real database reads may reduce inactivity risk; they do not guarantee availability or an exemption from platform policy. Restoration windows and policies can change, so consult the [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) before relying on an older operational note.

GitHub schedules are best effort: runs can be delayed or dropped, run only from the default branch, and public-repository schedules can be disabled after 60 days without repository activity. Review the current [GitHub schedule documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). There is no second monitoring service or automatic resume/replacement process.

Implementation and mocked workflow checks are local evidence only. No production database, real anonymous session, public note or hosted Actions success is implied by passing those tests.

## 繁體中文

此獨立工作流程透過 Supabase Data API，唯讀查詢 `public.app_healthcheck` 的一筆非敏感固定資料。地圖與單人互動不依賴它；它不建立訪客或留言、不執行遷移、不部署網站，也不自動恢復暫停的專案。

操作人員應先依設定指南套用 presence／health 遷移，確認固定紀錄為 `id=1`、`status='ok'`，且公開角色只能讀取。接著在 GitHub Actions repository secrets 設定 `SUPABASE_URL` 與 `SUPABASE_PUBLISHABLE_KEY`。只使用 HTTPS 專案根網址及 `sb_publishable_...` 公開金鑰，金鑰放在 `apikey` 標頭；不可改用 service-role、secret key、管理 JWT 或資料庫密碼。

工作流程合併到預設分支後，先從 Actions 手動執行一次，再視需要啟用排程。設定缺漏會明確失敗。排程為每日 UTC 02:17、10:17、18:17，臺北時間為 10:17、18:17 與隔日 02:17。每次最多兩次唯讀嘗試，單次預設八秒；整個工作最多三分鐘。驗證失敗或內容不符不會無限重試，記錄也不會印出金鑰、標頭、回應本文或原始例外。

有效結果必須是 HTTP 200，且 JSON 僅含一筆 `id:1`、`status:'ok'`；讀取上限 1024 bytes。HTTP 重新導向會被拒絕，避免將金鑰帶往其他目的地。測試只使用模擬回應，不需要真實專案；必須在設定完成後實際執行成功，才能聲稱正式健康檢查成功。

定期讀取可能降低 Free 專案因活動不足暫停的風險，但不是持續上線保證。Supabase 政策及恢復期限可能變動；GitHub 排程也可能延遲、略過，公開儲存庫長期無活動時還可能停用。請參考上方官方文件，必要時由操作人員在 Dashboard 手動恢復，或在 GitHub Actions 暫停這個工作流程；這些操作不影響 GitHub Pages 的既有部署。

## V1.6 verification handoff

V1.6 retains this single workflow and its existing schedule; no duplicate monitor or privileged cleanup step is added. Local tests exercise URL/key rejection, exact public `apikey` headers, read-only query/response shape, body-size/deadline bounds, bounded retries and redacted failures. They cannot determine whether repository secrets exist or whether a hosted project is reachable.

An authorized operator must privately confirm the two named repository secrets, inspect the deployed health relation/RLS and manually dispatch the workflow on the intended default branch. Record the run URL, timestamp, commit and actual outcome. Do not paste secret values or raw error bodies into public issues. If it fails, inspect Dashboard project state, relation/grants and key format privately; a paused project requires an authorized manual recovery, not repeated unbounded requests.

The broader `node scripts/validateQuietReadiness.mjs` command reuses the same real health helper, then performs bounded read-only Corner probes. It is an operator readiness aid, not a second schedule or successful real-service claim. Daily privileged retention belongs exclusively to the separate reviewed database Cron setup in [Quiet Corner operations](quiet-corner-moderation.md#v16-operator-checklist-and-daily-schedule).

尚未取得這次操作所需的遠端設定，因此不能確認 Actions secrets、手動執行成功或專案活動狀態。請由授權操作人員私人核對 secrets、遠端 health relation／RLS，手動執行現有工作流程並記錄真正的 run URL 與結果。V1.6 沒有新增重複排程，也沒有把清理權限加入這個唯讀健康檢查。

## V2.0 observed GitHub Actions result

The V1.6 handoff above remains historical. On 2026-11-06 the operator supplied [run 42144704285](https://github.com/LEO0331/taipei-faith-map/actions/runs/42144704285) after repository configuration. Job metadata confirms `database-read` and its read-only health step completed with `success`. Logs confirm `main` commit `9052d77432b3e223f43e40e74db4ced61d797276`, Node 22.23.4 and the actual helper command, with success at **01:34:18 UTC / 09:34:18 Asia/Taipei**. The URL/key inputs were masked; no secret values were retrieved. The helper/workflow at that commit match this workstream's versions.

This verifies a real Actions database health query with usable configured inputs, separately from offline tests and the earlier direct hosted query. Automatic cron firings, future availability and Auth/Realtime/Edge readiness are not established by this one success. The existing three-times-daily schedule is unchanged. See [V2.0 evidence](release-v2.0.md).

繁體中文：已讀取上述 run 的工作狀態與日誌，確認健康步驟在臺北時間 2026-11-06 09:34 成功；不是僅確認工作流程存在。此結果不代表之後每次自動排程、匿名登入、Realtime 或投稿均已驗證。
