# Cultural content contributor guide / 文化內容貢獻指南

## English

### Three kinds of information

The **Cultural Scene** is an original illustration of general architectural traditions. It is not a reconstruction, photograph or evidence of the selected location's features. Free Exploration and Guided Tour share the hotspot definitions in `src/features/faith-spaces/faithSpaceConfig.ts`; changing modes must not create a second version of the educational copy.

**About This Place** contains curated, source-backed statements about a particular registered organization. `placeProfileTypes.ts` defines the model; `placeProfiles.ts` stores the initial collection. Each introduction has its own `sources`, and every entry in `facts` carries evidence for that specific claim. The **Public Open Data** section presents the selected record from the generated government dataset. Do not edit that dataset to add cultural descriptions.

`traditionContent.ts` stores general introductions for additional traditions, with the same evidence and review metadata. Those introductions remain in the neutral gallery and must not assign a particular building, symbol, practice or schedule to a registered organization.

### Add or revise a place profile

1. Find the exact record in `public/data/religious-organizations.json`. Copy its `id`, full `name`, `district` and `address` into `organizationId`, `organizationName`, `district` and `address`. Give the profile a unique descriptive `id`. Array positions and loosely similar names are not identities.
2. Verify the real-world identity and address independently. Prefer the organization's official publications, government heritage records or other institutional sources. A familiar place name is insufficient: a registered foundation, church building and regional office may be different locations.
3. Read each source and write short, conservative Traditional Chinese and English paraphrases. Attach evidence to the introduction and each fact. If a source supports only a year, do not invent a precise date. If sources conflict, narrow the claim to the supported common ground or leave it out.
4. Give each source a descriptive unique `id`, bilingual `title`, direct `url`, named `publisher` and the date actually read as `verifiedAt` (`YYYY-MM-DD`). Cite the page containing the evidence, not a search-results page. Use absolute HTTP(S) URLs without credentials or hidden controls. The UI exposes the publisher and destination and uses safe external-link attributes.
5. Record `lastReviewed` and an honest `editorialReviewStatus`. Use `pending` while work is unfinished. `internal-reviewed` means the project checked the published evidence; it does not imply review by the location or a religious representative. Only use `community-reviewed` when an external review actually happened and its scope and supporting record are documented in the contribution.
6. Run `npm test` and `npm run build`. Review the result in both languages, including the source links, fallback message, keyboard navigation and a narrow viewport. A network check of the references is an editorial task; regular CI must stay offline.

### Validation and failure behavior

`placeProfileLookup.ts` compares ID plus name, district and address. Identity normalization is limited to Unicode NFC, trimming and whitespace normalization; it does not guess aliases, strip legal names or substitute street numbers. Missing, mismatched, duplicated or pending profiles are withheld rather than attached to a different record.

The `placeProfiles.test.ts` suite validates the entire curated collection against the current JSON. It checks nonempty bilingual text, evidence on every introduction and fact, source IDs/titles/publishers, safe HTTP(S) URLs, valid review dates, unique profile IDs, unique organization mappings and exact record identity. It also validates tradition introductions and tests invalid cases. These structural checks do not prove that a source is accurate or still available: contributors must read it again when reviewing content or refreshing dataset identities.

### Initial source inventory

All initial content was internally checked on **2026-11-03**. No external religious-community review or endorsement is recorded.

| Profile | Evidence |
| --- | --- |
| Songshan Ciyou Temple | [Official history and address](https://www.ssjyg.org.tw/About.aspx?View=11); [Tourism Administration description of roof sculpture](https://www.tad.gov.tw/m1.aspx?id=227&sNo=0001016) |
| Bangka Lungshan Temple | [Wanhua District Office: founding, designation and layout](https://whdo.gov.taipei/News_Content.aspx?n=2B790586BA4E1E7A&s=039849E84D5B9C7B&sms=15EB41D4C772E746); [official Sanchuan Hall caisson guide](https://lungshan.org.tw/tw/03_2_2_art.php) |
| Taipei Grand Mosque | [Official history, address and architecture guide](https://www.taipeimosque.org.tw/guided.php?lang=tw) |
| Zhongshan Presbyterian Church | [Government heritage profile](https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=213); [Seven Star Presbytery chronology and address](https://www.sevenstar.org.tw/church/c02004/) |

The source records within the data module remain the evidence associated with each claim; this table is a contributor index, not a substitute for per-claim citations.

| General tradition introduction | Evidence |
| --- | --- |
| I-Kuan Tao | [Baoguang Shaoxing Chonghua Foundation introduction](https://www.bgshchsty.org/about/); [Executive Yuan / Ministry of the Interior account of education and charity](https://www.ey.gov.tw/state/D00B53C98CD4F08F/0fe638e7-c0bf-401e-b9f2-3db11eecd508) |
| Bahá’í Faith | [Official worldwide community: Essential Relationships](https://www.bahai.org/beliefs/essential-relationships) |
| Tenrikyo | [Mission Headquarters in America & Canada: Introduction to Tenrikyo](https://tenrikyoamericacanada.org/introduction-to-tenrikyo-2) |

### Limits and next steps

This small collection does not imply that unprofiled places are less important. The examined Catholic records describe orders or offices and could not safely be treated as church-building records, so no Catholic church profile was inferred. The Zhongshan sources disagree on the month of building completion; the profile uses the agreed year, 1937. Schedules and access arrangements can change and should be checked directly before a visit.

Ongoing editorial work should prioritize documented external cultural review, more safely matched profiles, renewed source checks and evaluation with real devices and screen readers. Ambient sound remains optional and deferred until suitable original or licensed environmental audio is verified. Do not add religious activity tracking or persist tour/reflection history.

## 繁體中文

### 三種資訊的界線

「文化示意」是呈現一般建築傳統的原創插圖，不是所選場所的重建、照片或實際建築特徵的證據。自由探索與文化導覽共用 `src/features/faith-spaces/faithSpaceConfig.ts` 的熱點設定，不應另外複製一份導覽文案。

「認識這個場所」是針對特定登記團體、逐項附有公開證據的文化敘述。資料模型定義於 `placeProfileTypes.ts`，首批內容存於 `placeProfiles.ts`。介紹本身有 `sources`，每個 `facts` 項目也必須附上支持該項敘述的來源。「公開資料」另行呈現政府資料集中的所選紀錄；不要為加入文化文案而修改產生的政府 JSON。

其他教別的一般性介紹放在 `traditionContent.ts`，同樣記錄引用與核對資訊。這些介紹仍使用中性展間，不應推定個別團體的建築、符號、實踐或活動時間。

### 新增或修訂場所介紹

1. 在 `public/data/religious-organizations.json` 找到確切紀錄，將 `id`、完整 `name`、`district`、`address` 分別填入 `organizationId`、`organizationName`、`district`、`address`，另給介紹一個唯一且可辨識的 `id`。陣列位置與相近名稱不能當作場所身分。
2. 透過官方出版品、政府文化資產紀錄或其他可信機構來源，獨立核對身分與地址。登記基金會、聖堂建築與區域辦公室可能位於不同場所，不可只看熟悉的名稱便連結內容。
3. 實際閱讀來源，以精簡、保守的繁體中文與英文改寫。介紹與每項事實都要附證據。來源只有年份時不要補出日期；來源互相矛盾時，縮小到可共同支持的敘述，或暫不收錄。
4. 每個來源應有可辨識的唯一 `id`、雙語 `title`、直接 `url`、具名 `publisher`，以及實際讀取日期 `verifiedAt`（`YYYY-MM-DD`）。連到含有證據的頁面，不要連搜尋結果。使用無帳密、無隱藏控制字元的絕對 HTTP(S) 網址；介面會標示出版者與目的地，並採用安全的外部連結屬性。
5. 誠實記錄 `lastReviewed` 與 `editorialReviewStatus`。未完成時用 `pending`；`internal-reviewed` 表示本專案核對了公開證據，不代表場所或宗教代表審閱。只有實際完成外部審閱、且在貢獻紀錄中附上範圍與證明時，才能使用 `community-reviewed`。
6. 執行 `npm test` 與 `npm run build`，檢查雙語內容、來源連結、無介紹時的說明、鍵盤操作與窄螢幕版面。人工查核來源是否可連線屬於編輯工作，例行 CI 測試保持離線。

### 驗證與不匹配處理

`placeProfileLookup.ts` 同時比對 ID、名稱、行政區與地址。正規化僅限 Unicode NFC、去除前後空白與統一空白，不猜測別名、不刪除法人名稱，也不替換門牌。缺漏、不符、重複或待核對的介紹不會被附到其他紀錄。

`placeProfiles.test.ts` 將完整人工內容與目前 JSON 一起驗證：雙語非空、介紹與事實均附證據、來源 ID／標題／出版者完整、HTTP(S) 網址安全、核對日期有效、介紹 ID 與團體映射唯一，且身分欄位一致。其他教別介紹也接受驗證，並有錯誤案例測試。結構驗證不能證明來源內容正確或持續可用，修訂內容及更新資料集身分時仍應重新閱讀來源。

### 首批內容與限制

上方來源表列出松山慈祐宮、艋舺龍山寺、台北清真寺及中山基督長老教會，以及一貫道、巴哈伊信仰、天理教的一般介紹來源。全部於 **2026-11-03** 完成內部資料核對，沒有記錄外部宗教社群審閱或背書。表格只是貢獻者索引，不能取代資料模組內每項敘述的引用。

沒有場所介紹不代表文化重要性較低。已檢視的天主教紀錄屬於修會或辦公處，不能安全當成聖堂建築紀錄，因此未推定聖堂介紹。中山教會的來源對建築完工月份記載不同，介紹僅使用一致的 1937 年。參訪時段及開放規則會變動，出發前請向場所確認。

後續編輯工作宜優先安排有紀錄的外部文化審閱、更多安全匹配的場所、重新核對來源，以及實機與螢幕閱讀器評估。環境音仍為選配，待原創或授權素材確認後再考慮加入。不要新增宗教活動追蹤，也不要儲存導覽或靜心活動紀錄。

## V1.2 Calendar and Route Contributions

### English: festival references and dated occurrences

`src/features/religious-calendar/festivalReferences.ts` derives references from each record's original `festivalDates`. These strings remain government-data references, with their original text and an unparsed interpretation status. A lunar/Gregorian/unknown label only identifies the wording; it does not verify a current occurrence. Do not convert a lunar anniversary to a Gregorian date, infer a recurrence year, or treat an annual tradition as this year's confirmed event.

To add a dated occurrence in `culturalEvents.ts`:

1. Find a dated, event-specific organizer announcement or trustworthy public notice. Read the actual page and establish the occurrence's Gregorian year, dates, location and attendance conditions. General histories and recurring festival references cannot supply these details.
2. Copy the exact dataset identity: `organizationId`, `organizationName`, `district` and `address`. Keep the registered address distinct from `location`, which can describe the announced event area. Give the occurrence a unique `id`, bilingual `title`, `description` and `location`, and direct evidence in `sources`.
3. Set `startDate` and `endDate` as inclusive `YYYY-MM-DD` Gregorian dates, including the complete years for cross-year events. Use `timeZone: 'Asia/Taipei'`. Add optional `startTime` and `endTime` only when verified, in 24-hour `HH:mm` format; leave unknown times absent rather than using midnight as a placeholder.
4. Record `attendance` as `public`, `registration-required`, `restricted` or `unknown`. Free participation supported by a notice does not promise unrestricted access to every related activity or interior. Add a safe `registrationUrl` only when applicable and published. Do not infer attendance rules from an organization's religion.
5. Record `status` as `confirmed`, `cancelled` or `postponed`, plus the actual `verifiedAt`, source dates and editorial status. Preserve a cancellation or postponement visibly rather than silently changing its old dates to a guess. Pending or invalid entries are withheld; cancelled and postponed entries do not appear as upcoming confirmed events.

Calendar helpers use Taipei's current date and compare date ranges, so multi-day and cross-year occurrences can appear in each overlapping month. The UI's source-check date and freshness reminder are editorial context, not a live confirmation of the announcement. Recheck the organizer before a visit or when updating the entry. There is no event scraping or automatic feed, and regular tests do not contact source sites.

The initial **28–30 November 2026 Qingshan Temple night patrol and procession** was internally checked on **2026-11-04** against the [organizer's dated event page](https://www.religiouscarnival.com/edcontent.php?id=1155&lang=tw&tb=8) and a [government cultural notice](https://www.ilccb.gov.tw/News_Content.aspx?n=10203&s=410445&sms=12921). Daily times were left unspecified. The government notice supports free public participation; visitors must still confirm current daily arrangements.

### English: adding a cultural route

`src/features/cultural-routes/culturalRoutes.ts` contains editorial sequences of two to five distinct registered organizations. Add a unique route `id`, bilingual title and description, district labels, a supported theme, review date and honest editorial status. Each stop needs the full exact organization identity, its own bilingual title and description, and `sourceReferences` supporting its location-specific claims. A route narrative must follow the evidence at its stops and must not imply institutional endorsement or guarantee that the sites are open to visitors.

The route resolver validates identities against the current dataset, required bilingual content, source metadata and safe URLs, review dates, themes, district labels and unique stops. It rejects missing or ambiguous records, invalid/outlier Taipei coordinates, and registrations whose names explicitly indicate revocation, dissolution or transfer. Pending routes are withheld. The shared helpers in `src/utils/curatedContent.ts` also serve V1.1 profiles and calendar entries; do not create looser matching rules for a route.

Map markers number the stops and highlight the selected place. They do not establish a surveyed path between coordinates. `walkingDirections.ts` builds an external Google Maps URL with walking mode and ordered waypoints, falling back to per-leg links when a whole-route URL exceeds supported waypoint or length limits. Do not draw a straight line and call it a walkable route, and do not add estimated time or distance without evidence. No walking-safety, step-free-access or continuous-sidewalk survey is implied.

The **Map / Calendar / Walking Routes** navigation keeps the original map mounted and preserves its filters, geolocation and nearby-search state. Calendar state and route selection are ephemeral. Opening a Faith Space from an event or stop uses the existing modal and return-focus behavior. Keep new cultural content behind the feature's lazy-loading boundary and maintain a usable return-to-map path.

### V1.2 route source index / 路線來源索引

The following sources were internally checked on **2026-11-04**. Each stop's source records remain attached to its claims; this index does not replace those citations.

| Route / 路線 | Stops and evidence / 站點與證據 |
| --- | --- |
| Three temple stories in Bangka / 艋舺三處廟宇文化 | [Lungshan Temple heritage](https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=13) → [Qingshan Temple heritage](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211) → [Qingshui Temple heritage](https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12) |
| A church and a City God temple in Dadaocheng / 大稻埕的教會與城隍廟 | [Lee Chun-sheng Memorial Church identity](https://www.pct.org.tw/churchdata.aspx?strOrgNo=C03001) and [government heritage history](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=356) → [Xia-Hai City God Temple heritage](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=58) |

### 繁體中文：祭典參考與具體活動

`src/features/religious-calendar/festivalReferences.ts` 從各筆登記資料的 `festivalDates` 產生參考項目。原文仍是政府資料的祭典參考，保留未解析狀態；農曆／國曆／未確認曆法標籤只判斷文字，不等於今年有活動。不要自行將農曆紀念日換算成國曆、推定重複年份，或將傳統祭典視為今年已確認的活動。

在 `culturalEvents.ts` 新增具體活動時：

1. 找到具日期、針對該次活動的主辦公告或可信公開通知，實際閱讀並確認國曆年份、日期、地點與參與條件。一般歷史沿革與每年祭典文字不能代替這些證據。
2. 複製資料集的完整身分：`organizationId`、`organizationName`、`district`、`address`。登記地址與活動 `location` 分開記錄，後者可描述公告的活動範圍。另填唯一 `id`、雙語 `title`、`description`、`location` 及直接證據 `sources`。
3. `startDate`、`endDate` 使用包含起訖日在內的國曆 `YYYY-MM-DD`，跨年活動需填完整年份；`timeZone` 固定為 `Asia/Taipei`。只有查證時刻後才填選用的 `startTime`、`endTime`（24小時制 `HH:mm`），未知時刻留空，不用午夜作占位值。
4. `attendance` 明確填 `public`、`registration-required`、`restricted` 或 `unknown`。公告免費參與不代表所有相關活動或室內均可自由進入。適用且有公告時才填安全的 `registrationUrl`；不得從宗教別推定參與規則。
5. 誠實記錄 `confirmed`、`cancelled` 或 `postponed` 的活動狀態、實際 `verifiedAt`、來源日期與編輯狀態。取消或延期應保留明確標示，不將舊日期靜默改成猜測值。待核對或無效項目不顯示；取消及延期項目不列入即將舉行的已確認活動。

日期工具以臺北當日日期與區間判斷跨日、跨月及跨年活動。來源核對日期與時效提醒是編輯資訊，不代表系統正即時確認公告。參訪或更新內容前應再次向主辦單位核實。系統不爬取活動、不接自動資料流，例行測試也不連線檢查來源。

首筆 **2026年11月28日至30日艋舺青山宮暗訪暨遶境** 於 **2026-11-04** 核對上方主辦活動頁與政府藝文公告；每日時刻留空。政府通知支持免費公開參與，但當日安排仍應向主辦單位確認。

### 繁體中文：新增文化路線

`src/features/cultural-routes/culturalRoutes.ts` 存放由二至五個不同登記團體組成的文化停靠順序。新增唯一 `id`、雙語標題與介紹、行政區標籤、支援的主題、核對日期及誠實的編輯狀態。每站都要有完整登記身分、雙語標題與說明，以及支持場所特定敘述的 `sourceReferences`。整條路線的敘述應由各站證據支持，不暗示機構背書或保證開放參訪。

路線查找依目前資料集驗證身分、雙語必填欄位、來源資料與安全網址、核對日期、主題、行政區標籤及站點唯一性。找不到或有歧義的紀錄、臺北座標異常，以及名稱明示廢止、解散或改隸的登記均會被拒絕；待核對路線不顯示。`src/utils/curatedContent.ts` 與 V1.1 場所介紹、行事曆共用，勿另造較寬鬆的路線身分比對規則。

地圖編號僅表示順序並標示目前場所，不代表兩點之間有經實測路徑。`walkingDirections.ts` 以步行模式及依序途經點產生外部 Google 地圖連結，整條網址超過支援點數或長度時，改為逐段連結。不要把直線稱為可步行路徑，也不要加入無證據的時間、距離推估。本導覽未暗示已調查步行安全、全程無階梯或連續人行道。

「地圖／行事曆／散步路線」保留原地圖掛載與篩選、定位及附近搜尋狀態；日曆與路線選擇僅存在記憶體。活動或站點開啟信仰空間時沿用現有對話框及焦點還原。新內容應維持按需載入，並提供可用的返回地圖入口。

### Ongoing editorial priorities / 後續編輯工作

The calendar and routes are a manually curated sample, not an exhaustive directory or live availability service. Reverify dates and attendance before refreshing events, and recheck identities after regenerating government data. Ongoing priorities are source renewal, documented external cultural review, more safely matched content and evaluation with real devices and screen readers. Audio remains deferred until appropriate original or licensed assets are verified; no tracking should be added.

行事曆與路線為人工精選樣本，不是完整活動目錄或即時開放服務。更新活動時重新核對日期與參與條件，重產政府資料後也要再比對場所身分。後續宜優先更新來源、安排有紀錄的外部文化審閱、補充安全匹配內容，以及實機與螢幕閱讀器評估。環境音待原創或授權素材確認後再考慮，不新增追蹤。

## V1.3 Historical Content / 歷史內容

Historical milestones and heritage stories use separate modules under `src/features/heritage`; they are not current Calendar events or amendments to government registration data. The [historical-content contributor guide](historical-content.md) covers evidence precision, deterministic ordering, the strict current-place manifest, chapters without place links, existing-route references and the initial source inventory. Each milestone, story and chapter requires source evidence and honest review metadata. The collection does not imply verified historical coordinates, community endorsement or archival-image reuse rights.

歷史里程碑與文化故事獨立存於 `src/features/heritage`，不是行事曆的當代活動，也不改寫政府登記紀錄。[歷史內容貢獻指南](historical-content.md)說明史料精度、固定排序、嚴格的現址對照、無場所連結章節、既有路線引用及首批來源。史事、故事與章節皆需來源與誠實的核對資訊；內容不暗示歷史座標已驗證、社群背書或歷史影像重用授權。
