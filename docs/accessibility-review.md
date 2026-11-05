# V1.4 accessibility review / 無障礙檢查

Review date: **2026-11-05**. This is a scoped engineering record, not a WCAG conformance certificate or a religious-community review.

## Findings and implementation changes

| Finding | Change in V1.4 | Evidence scope |
| --- | --- | --- |
| Repeated Sources landmarks and inconsistent source-heading levels made repeated claim citations harder to navigate. | Source groups use local headings/lists, with explicit heading depth appropriate to their context rather than repeated identically named landmark regions. | DOM structure; rendered reading experience still needs browser/screen-reader review. |
| Modal focus enumeration could include controls hidden by CSS or within closed details. | Focus eligibility excludes hidden/inert ancestors, hidden computed styles and controls inside closed details except the visible summary. | DOM keyboard and focus regression tests. |
| Loading/error shell focus could escape through programmatic focus changes. | The shell now contains focus and removes its listener during cleanup while keeping Escape/return controls available. | DOM loading-shell regression tests. |
| Language controls did not expose the group and current selection fully. | Language controls use a localized group label and `aria-pressed` on both buttons. | DOM semantics and language-selection tests. |
| Timeline card focus did not include the preceding historical date and precision. | Cards reference their source date/precision text with `aria-describedby`. | DOM association and precision checks. |
| Map zoom controls retained English names in Chinese mode. | Both title and accessible label update without changing the map view. | Mocked Leaflet control regression. |
| Returning from related content could leave the old invoking node detached. | Stable organization/action keys recover the current profile or historical-map control after restoring the original feature state. | Cross-feature integration and focus regressions. |

These changes preserve the current map/modal architecture. New related-content actions should keep meaningful names, an orderly focus sequence and a return to the originating place. They must not create a focus trap in a hidden route, calendar or story panel.

## Automated scope

`src/__tests__/accessibility.test.tsx` adds development-only `axe-core` structural checks in JSDOM for the following English-language states:

- Faith Space free exploration, guided tour, verified place profile (English and Chinese), and a lazy related-content panel.
- A sourced tradition introduction in the neutral gallery.
- Calendar agenda and selected event details.
- A selected cultural route and its stop controls.
- Heritage timeline and a story chapter.

The fixture renders meaningful main headings around standalone sections. The `color-contrast` rule is deliberately disabled because JSDOM does not provide rendered layout or reliable colour computation. These checks can find structural/ARIA issues, but cannot establish contrast, visible clipping, touch comfort, zoom behavior or actual assistive-technology announcements. Run `npm test` to obtain execution results; this document does not substitute for that output.

The six `axe-core` test cases passed on **2026-11-05**, covering eleven rendered states with zero violations under the enabled rules. Additional DOM tests exercise skip-link targets, dialog focus containment, historical date descriptions, bilingual map controls and return to the original place/action. This is structural test evidence only; the manual checks below remain outstanding.

## Unverified manual checks

The browser-control attempt failed before initialization because its required kernel asset path was unavailable. No V1.4 manual desktop/mobile browser inspection was completed. Earlier-release screenshots or prior test runs do not establish the V1.4 result.

| Planned check | Current status |
| --- | --- |
| Responsive layout at 320, 375, 390 and 768 CSS pixels, plus desktop | Unverified: browser infrastructure could not initialize. |
| Real mobile device, touch targets, safe areas and browser zoom | Not performed. |
| Visible colour contrast and focus contrast | Unverified; DOM contrast rule disabled. |
| NVDA, VoiceOver or another real screen reader | Not performed. |
| Browser-level axe, visible focus traversal and reduced-motion rendering | Unverified. |
| Long bilingual source text, external-link announcements and 200%/400% zoom | Pending manual review. |

When browser access is available, inspect every primary destination and the modal in both languages. Traverse with Tab/Shift+Tab, activate using Enter/Space, verify Escape and return focus, open/close details, change guided steps, follow a related link and return to the same place, and confirm that hidden views are never focusable. Repeat with reduced-motion preference and at the planned widths. Record the browser/device, viewport, date, exact state and any remaining defect; avoid marking the entire app accessible from one passing page.

## 繁體中文

檢查日期為 **2026-11-05**，屬於有範圍的工程紀錄，不是 WCAG 合規證明或宗教社群審查。已識別並處理的問題包括：重複「資料來源」地標與標題層級、CSS隱藏／關閉details內控制項被列入焦點、載入介面未攔截程式化外移焦點，以及語言控制缺少完整群組／選取語意。各項變更由對應 DOM 結構或回歸測試檢查，實際閱讀與視覺效果仍需人工驗證。

新增的 `axe-core` 僅供開發測試，JSDOM檢查英語的自由探索、文化導覽、場所介紹、日曆清單／活動、路線及歷史時間軸／故事章節。因沒有可靠的實際版面與顏色，刻意停用色彩對比規則；不能因此聲稱已驗證對比、觸控、縮放或真正的輔助科技宣告。執行結果應以 `npm test` 輸出為準。

瀏覽器工具在初始化前因所需kernel資源路徑缺失而失敗，因此本版尚未完成320、375、390、768像素及桌面人工檢查，也未執行實機、NVDA／VoiceOver、瀏覽器axe、實際對比或減少動態效果檢查。先前版本的畫面與結果不能代替本版證據。工具可用後，須以雙語逐一檢查所有目的地、對話框、Tab順序、Enter／Space、Escape、焦點還原、導覽步驟、相關內容往返、隱藏區域與放大版面，並記錄裝置／瀏覽器、尺寸、日期與確切狀態。
