# Content audit / 內容稽核

## Purpose and commands

The audit is a read-only, offline review of the generated government snapshot and the typed curated content. It reuses the validators for profiles, additional-tradition introductions, dated events, routes and heritage content rather than creating a second set of identity rules. It does not request remote pages, edit records or automatically certify factual accuracy.

```bash
npm run content:audit
npm run content:audit -- --as-of 2026-11-05
npm run content:audit -- --as-of 2026-11-05 --format json
```

The default audit date uses `Asia/Taipei`. Pin `--as-of` when comparing releases so source ages and upcoming-event flags are reproducible. Markdown is the default format; JSON is suitable for further inspection. The command returns a nonzero exit code for curated structural errors or government structural errors. Editorial advisories do not fail the command.

The release's generated results belong in [content-audit-output.md](content-audit-output.md). Keep that output distinct from this explanation and regenerate it from the CLI when the underlying data changes. Do not hand-edit counts to make an advisory disappear.

## Baseline findings

The V1.4 assessment observes **551 government records**. The government JSON is unchanged. The baseline has **0 structural errors**, no duplicate IDs/name-address candidates and no coordinate outliers. It has **341 advisory occurrences**:

| Observation | Occurrences | Interpretation |
| --- | ---: | --- |
| Missing festival information | 280 | No festival text was supplied; this does not mean the organization has no activities. |
| Other or Uncategorized religion | 50 | The source does not establish a more specific classification. Do not infer one from a name. |
| Explicit registration-status annotation | 11 | Source text may describe a dated status change; consult current official notices before deciding present status. |

These categories can overlap on the same organization. **341 occurrences are not 341 distinct organizations.** Status annotations are investigation candidates, not an automatic declaration that a place is currently closed. The assessment does not delete records, change map filtering, alter government registration totals or turn advisory counts into measures of religious importance.

The curated profile collection grew from four to eight, adding Qingshan, Qingshui, Xia-Hai and Lee Chun-sheng Memorial Church. Coverage reports count only safely matched, published profiles against the current dataset. They describe editorial scope, not popularity, influence or proportional representation. Other modules currently include three additional-tradition introductions, one dated event, two routes, nine milestones, two stories and six story chapters; consult the generated output for current counts.

## Errors and editorial advisories

Structural errors include missing evidence, empty bilingual fields, unsafe source URLs, invalid review/date metadata, future check dates, duplicate IDs, conflicting source identifiers, stale organization identities and broken story/milestone/route references. These require correction before publication. Pending items are review work and remain withheld by their feature's publication rules.

Shared source URLs are not inherently invalid: a government heritage page can support more than one profile, route stop or milestone. The audit reports reuse under different identifiers and differing copies of editorial metadata for inspection, while preserving each claim location. Consolidate inconsistent metadata when appropriate; do not erase evidence merely to reduce an advisory count.

| Review policy | Threshold | Meaning |
| --- | ---: | --- |
| Upcoming or ongoing confirmed events | More than 30 days since the oldest relevant event/source check | Reverify dates and attendance conditions before relying on the notice. |
| General source/reference checks | More than 365 days | Prioritize renewed reading; age alone does not make a historical fact false. |

The report records source-check age, not publication age or a guarantee that a page still exists. A successful URL response would only establish a network response, not that the exact claim remains supported. Regular CI remains network independent. The four V1.4 additions have **2026-11-05** checks; older profiles and historical content retain their actual earlier dates. No release-wide recheck is implied.

Coordinate observations use the project's existing broad Taipei bounding box and finite/world-coordinate checks; they are not a parcel-level, district-boundary or address-geocoding verification. Qualified status annotations are also reused by the route guard as a reason for further verification, never as an automatic current-inactivity determination. The snapshot and Dashboard totals remain intact.

## Performance and accessibility evidence

The recorded **2026-11-05** offline run completed successfully: **0 curated structural errors**, **0 government structural errors**, **9 duplicate-URL editorial advisories**, and **341 overlapping government-data advisories**. The upcoming Qingshan notice remains within the 30-day check window; that observation is not a new verification of its arrangements. See the generated [offline report](content-audit-output.md).

A separate unauthenticated link audit observed **19 reachable HTTP 200 responses** and **1 blocked HTTP 403 response**. The blocked Tenrikyo reference needs manual investigation; the response does not establish that its earlier verified content is false or permanently unavailable. See [source-link observations](source-link-audit-output.md). No source records or review dates were rewritten.

Related-content navigation is deliberately one hop from About This Place: a return control restores the originating place and the previous calendar/story/route selection. Related links are omitted in a further modal while that excursion is active, avoiding an additional navigation-history system. Primary navigation dismisses the excursion. Only validated explicit relationships are offered; no proximity or religion-based recommendations are generated.

The measured pre-V1.4 initial JavaScript baseline was **542.13 kB**, **168.94 kB gzip**. Compare a production build using the same Vite base configuration and report actual final chunk sizes separately; do not infer an improvement from the number of lazy modules. `axe-core` is development-only and belongs to tests, not the production application. The release's [accessibility review](accessibility-review.md) distinguishes structural DOM checks from unavailable browser, contrast, real-device and screen-reader evaluation.

The final **2026-11-05** GitHub Pages build measured **546.16 kB**, **170.09 kB gzip**, for the initial JavaScript chunk. This is an increase of **4.03 kB raw / 1.15 kB gzip** for the added navigation and accessibility behavior, not a performance-speedup claim. Additional profile data and related catalogs remain lazy-loaded; audit tooling and `axe-core` are absent from the production UI. No runtime timing benchmark or rendering bottleneck was established, so the existing rendering architecture was retained. The existing 500 kB build advisory remains.

The final offline checks passed: **229 tests in 35 files**, the production build (including TypeScript), and `npm run content:audit`. Six axe test cases covered eleven rendered states with the JSDOM contrast rule excluded. Browser visual and real assistive-technology checks remain pending.

## 繁體中文

稽核是對政府快照與人工內容的離線唯讀檢查，重用場所介紹、教別簡介、活動、路線及歷史內容的驗證，不另造身分規則。上方指令預設使用臺北日期，可用 `--as-of` 固定比較日期，`--format json` 取得結構化輸出。人工內容或政府資料的結構錯誤會使指令回傳失敗，編輯提醒則不會。實際執行結果另存於[產生的報告](content-audit-output.md)，不要手改數字消除提醒。

本版政府快照為 **551筆**、**0項結構錯誤**，未發現重複 ID／名稱地址候選或座標異常；原始 JSON 未改動。**341次提醒**分別為280筆缺少祭典文字、50筆其他／未分類、11筆含明確登記狀態註記。這些類別會重疊，**不等於341個不同團體**。缺漏祭典資料不代表沒有活動，狀態文字也不是目前歇業的自動判定；檢查不刪除紀錄、不更改地圖篩選或儀表板總數。

場所介紹由四筆增加為八筆，新增青山宮、清水巖、霞海城隍廟及李春生紀念教會。涵蓋數只計入安全匹配且可發布的介紹，是編輯收錄範圍，不是宗教人氣、影響力或代表比例。其他內容目前有三則教別簡介、一筆具體活動、兩條路線、九則史事、兩個故事與六章；最新數量以產生的報告為準。

結構錯誤包含引用缺漏、雙語空白、不安全網址、無效或未來核對日期、重複 ID、衝突來源身分、過期場所匹配及斷裂引用。重用同一來源網址本身不是錯誤，多個場所或路線可由同一政府頁面支持；不同識別碼或不同版本的核對資料會提醒人工檢視，不應為減少提醒而刪除證據。

即將舉行或進行中的已確認活動，相關核對超過 **30日**時提醒重新確認日期與參與條件；一般參考超過 **365日**時提醒重新閱讀，並非判定史實失效。來源年齡是核對資訊，不是發表年齡或連線保證；網址能回應也不代表內容仍支持主張。四筆新介紹的核對日期為 **2026-11-05**，舊內容保留原日期，不暗示本版全部重新查核。

V1.4修改前量得初始 JavaScript 為 **542.13 kB／gzip 168.94 kB**。最終應以相同建置設定的實際輸出比較，不從延遲載入模組數量推估改善。`axe-core` 僅供開發測試，不加入正式應用程式；[無障礙紀錄](accessibility-review.md)另外標示 DOM 檢查與尚未完成的瀏覽器、對比、實機及螢幕閱讀器驗證。

相同 GitHub Pages 設定下，本版最終初始 JavaScript 為 **546.16 kB／gzip 170.09 kB**，增加 **4.03 kB／gzip 1.15 kB**；這是新增導覽與無障礙行為的實際大小，並非速度改善宣稱。其餘場所內容與相關目錄仍按需載入，稽核工具與 axe 不進入正式介面。未建立執行時間瓶頸或速度基準，因此保留原渲染架構；既有 500 kB 建置提醒仍存在。**35個測試檔案、229項測試**、型別檢查、正式建置及內容稽核成功；六項 axe 測試涵蓋十一個介面狀態，但不包含實際對比與輔助科技驗證。

## Monthly workflow

V2.1c reuses the structural and URL checks in a dedicated monthly review. Read the report's retrieval status before interpreting any comparison. A timeout or 403 calls for a later source check. Compare changed facts with the actual publication and confirm identities before making an editorial change. Review dates record human verification. See [monthly maintenance](monthly-content-maintenance.md).
