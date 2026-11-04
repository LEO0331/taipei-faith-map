# Historical content contributor guide / 歷史內容貢獻指南

## English

### Scope and evidence

V1.3's **History & Stories** destination contains a Historical Timeline and Heritage Stories. These are documented reading experiences about temples, buildings, congregations and heritage designation. A historical milestone is not a current event occurrence and is not added to the religious Calendar. Current government records supply present-day registration details; they do not establish an institution's founding date, past geographic extent, historic legal continuity or population.

The collection lives under `src/features/heritage`:

| Module | Responsibility |
| --- | --- |
| `historicalMilestones.ts` | Historical claims, source dates, precision, themes and references to stories/current places |
| `heritageStories.ts` | Bilingual story introductions and chapters referencing existing milestone IDs |
| `heritageOrganizations.ts` | Explicit, sourced links to current dataset identities |
| `heritageTypes.ts` | Historical dates, milestones, stories, chapters and manifest types |
| `heritageValidation.ts` / `heritageLookup.ts` | Offline structural validation, identity checks, available content and deterministic ordering |

Read primary institutional publications or government heritage records before adding a claim. Give every milestone and chapter its own evidence references; the story's introductory narrative also needs supporting sources. Attach bilingual source titles, direct safe HTTP(S) URLs, publisher names and the dates actually checked. A source index does not replace claim-level references. Shared source objects and milestone IDs are preferable to copied factual paragraphs that could drift apart.

### Preserve date precision

`HistoricalDate` records `precision`, `calendarSystem` and a bilingual `displayLabel`, with numeric fields only where supported:

| Precision | Authoring rule |
| --- | --- |
| `exact` | Supply a valid, established Gregorian `exactDate` (`YYYY-MM-DD`) and matching `startYear`. Do not derive one from an unconverted lunar date. |
| `year` | Supply the documented `startYear`; do not add an `exactDate` or an invented January 1. |
| `approximate` | Use a source-supported approximate year as `startYear`, retain the uncertainty in `displayLabel`, and omit any exact date. |
| `range` | Supply documented chronological `startYear` and `endYear`, with a label retaining the interval. Do not invent the months or days at its boundaries. |
| `unknown` | Keep year and exact-date fields absent. Say that the date is unknown instead of assigning a sorting year. |

Known milestones sort by their documented start year. Stable precision/date/range/ID tie-breaks make the same collection appear consistently across runs; unknown dates remain last. Sorting an approximate year or interval does not turn it into an exact historical sequence. Display the original uncertainty even when a numeric year is needed for ordering. Preserve the documented calendar system and do not silently convert lunar or other-calendar evidence.

When sources disagree, narrow the claim or record the uncertainty. For example, the initial Zhongshan Church milestone uses **1937**, because the institutional chronology and government profile disagree on the completion month. The separately documented **15 December 1947** congregation establishment is its own milestone. A building's completion, a congregation's establishment and a legal entity's registration are not interchangeable.

### Associate current places safely

The `heritageOrganizations.ts` manifest contains each `HeritagePlaceReference` with the exact `organizationId`, full registered `organizationName`, `district` and `address`, plus a sourced bilingual `relationship`. Match all identity fields against the current `religious-organizations.json` using the shared curated-content helpers. Never fall back to array positions, a similar name, legal-name removal or guessed aliases. Reverify the manifest after regenerating the dataset.

Milestones and chapters reference manifest entries through `organizationIds`. Empty arrays are valid when no current organization can be safely associated: keep the sourced history readable without a map action. The initial chapter about an earlier mosque on Lishui Street intentionally uses no current place. Today's Xinsheng South Road registration does not verify that earlier site's coordinates.

**View current registered location** is an explicit, temporary map action. It highlights current records and provides a return to the same historical reading context and prior viewport. It is not a historical-coordinate layer. Opening a verified place profile uses the existing Faith Space's **About This Place** panel; general scene artwork remains illustrative. A story's `routeIds` may link only to existing, validated curated Walking Routes, whose own stop narratives and navigation cautions still apply.

### Add a milestone or story

1. Research a small, defensible claim and record the source's actual date precision. Keep its description bilingual and distinguish founding, construction, rebuilding, community and heritage milestones.
2. Add a unique milestone `id`, title, summary, theme, date, evidence and actual `lastReviewed`. Use `pending` until internal checking is complete; `internal-reviewed` describes project source checking, not external or religious-community approval.
3. If relevant, add or reuse a manifest identity. Explain the relationship between the historical account and today's registered place without assuming continuity or historic coordinates.
4. Add a story with a unique `id`, bilingual title, subtitle and introduction, supported theme, evidence and review metadata. Each chapter needs its own unique `id`, title, content, source references, `milestoneIds` and `organizationIds`. A chapter can have no mapped place.
5. Reuse existing milestones by ID. Keep milestone `storyIds` and chapter references reciprocal. Reference only existing route IDs; do not create a new route merely to make a story look geographically connected.
6. Run `npm test` and `npm run build`. Inspect both languages, date labels, source destinations, narrow-screen reading, keyboard/focus behavior and the return from map/profile/route actions. Regular CI must remain offline; reading and rechecking remote sources is an editorial task.

Validation detects missing or duplicate IDs, missing references, inconsistent story/milestone relationships, duplicate translation identities, invalid date combinations, unsafe/incomplete sources, empty bilingual text and stale or ambiguous manifest identities. Invalid collections fail closed, and pending material with unresolved dependencies is withheld. Structural validation cannot prove that a publication is accurate, current or a license to reuse its media.

### Initial stories and primary sources

The first collection contains **nine milestones** and **two stories, each with three chapters**, internally checked on **2026-11-04**. It includes no recorded external religious-community review or endorsement.

| Story | Evidence |
| --- | --- |
| Reading Bangka's temple layers | [Lungshan Temple heritage](https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=13), [Qingshui Temple heritage](https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12), [Qingshan Temple heritage](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211) — Ministry of the Interior |
| Buildings and communities: different dates | [Zhongshan Church chronology](https://www.sevenstar.org.tw/church/c02004/), [Zhongshan Church heritage](https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=213), [Taipei Grand Mosque official history](https://www.taipeimosque.org.tw/guided.php?lang=tw), [Taipei Grand Mosque heritage](https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=39) |

These are reading sequences across published accounts, not claims of an otherwise undocumented common cause or direct historical relationship between different communities.

### Limits and V1.4 priorities

No archival photographs or external media are included because appropriate assets and reuse licenses were not verified. A publicly readable image does not imply permission to redistribute it. Existing original SVG scenes must not be presented as historical visual evidence. The feature does not reconstruct historic district boundaries, produce historic population maps or infer religious participation from registration counts.

Prioritize renewed source checks, documented external cultural review and real-device visual/screen-reader evaluation for V1.4. Keep selections ephemeral and avoid religious-history browsing analytics. Add images only after recording their provenance, license, required attribution and connection to the specific claim.

## 繁體中文

### 範圍與證據

V1.3 的「歷史與故事」包含宗教歷史時間軸與臺北信仰文化故事，依公開史料閱讀寺廟、建築、堂會與文化資產。歷史里程碑不是當代活動，不加入宗教行事曆。政府資料只提供目前登記資訊，不能單憑它判定創建年代、歷史範圍、法人延續或人口。

上方模組表列出 `src/features/heritage` 的檔案分工：`historicalMilestones.ts` 存史事，`heritageStories.ts` 存章節，`heritageOrganizations.ts` 存現址身分對照，型別、驗證與查找則由相鄰工具負責。新增內容前先讀官方機構出版品或政府文化資產資料；每則史事、章節及故事導讀都須有對應證據。來源應附雙語標題、安全的直接 HTTP(S) 網址、具名出版者與實際核對日期。來源索引不能代替逐項引用，宜共用來源物件與里程碑 ID，避免複製後文意不一致。

### 保留日期精度

`HistoricalDate` 明列 `precision`、`calendarSystem` 與雙語 `displayLabel`，只填史料支持的數值：

- `exact`：已確立的有效國曆 `exactDate`（`YYYY-MM-DD`），並有一致的 `startYear`；不得從未換算的農曆日期自行推得。
- `year`：只填已知 `startYear`，不補確切日期或一月一日。
- `approximate`：填來源支持的概略年份，顯示標籤保留「約」等不確定性，不填確切日期。
- `range`：填有證據且前後順序正確的 `startYear`、`endYear`，保留區間，不補工程兩端沒有記載的日月。
- `unknown`：年份與確切日期欄位留空，明確說明未定，不為排序而編造年份。

已知年代依史料起始年份排序，同年再以固定的精度、日期、區間及 ID 規則排列，未定日期置後。概略年份與區間的顯示順序不代表已確定的事件先後；即使用年份排序，也須保留不確定性與原曆法，不偷偷轉換農曆或其他曆法。

來源有歧異時縮小主張或保留說明。例如中山教堂的機構簡史與政府記錄對完工月份記載不同，首批時間軸只列雙方共同支持的 **1937年**；另有機構明列的 **1947年12月15日** 堂會成立史事。建築完工、堂會成立與法人登記日期不得互換。

### 安全連結現代場所

`heritageOrganizations.ts` 的 `HeritagePlaceReference` 逐筆記錄完整 `organizationId`、登記 `organizationName`、`district`、`address` 與有來源的雙語 `relationship`。利用共用工具對目前 `religious-organizations.json` 核對所有身分欄位，不回退到陣列位置、相似名稱、去掉法人名稱或猜測別名。重新產生資料集後，必須再核對對照表。

史事與章節以 `organizationIds` 連到對照表。沒有安全的現代對應場所時，可使用空陣列，保留可閱讀的史料而不提供地圖操作。首批麗水街清真寺舊址章節即採此方式；新生南路的現代登記位置不能驗證麗水街舊址座標。

「查看目前登記位置」是使用者明確觸發的暫時地圖操作，標示現代紀錄並提供回到同一閱讀脈絡及先前視野的入口，不是歷史座標圖層。「經查證場所介紹」直接開啟原有信仰空間的「認識這個場所」，一般插圖仍為示意。故事 `routeIds` 只可引用既有且有效的人工核對散步路線，其原有敘述與導航注意事項仍適用。

### 新增史事或故事

1. 先查核一個精簡、可支持的主張，記下來源的日期精度，以雙語敘述並區分創建、營建、重建、社群與文化資產里程碑。
2. 加入唯一的史事 `id`、標題、摘要、主題、日期、證據及實際 `lastReviewed`。未完成核對時用 `pending`；`internal-reviewed` 只表示本專案查核來源，不是外部或宗教社群認可。
3. 有需要時新增或重用現址對照，解釋史料與目前登記場所的關係，不預設歷史延續或歷史座標。
4. 故事填唯一 `id`、雙語標題、副標、導讀、支援主題、來源與核對資訊；每章另有唯一 `id`、標題、內容、來源、`milestoneIds` 與 `organizationIds`。章節可以沒有可標示現址。
5. 以 ID 重用既有里程碑，保持里程碑 `storyIds` 與章節引用互相對應。只引用已存在的路線，不為了把故事連起來而虛構地理路線。
6. 執行 `npm test`、`npm run build`，檢查雙語、精度標籤、來源目的地、窄螢幕閱讀、鍵盤焦點與地圖／場所介紹／路線返回操作。CI 維持離線，實際閱讀與重查遠端來源屬於編輯工作。

驗證會找出缺漏或重複 ID、缺漏引用、故事與史事關係不一致、重複翻譯身分、無效日期組合、不安全或不完整來源、雙語空白，以及過期或有歧義的場所身分。無效內容不顯示；待核對及依賴尚未解決的內容也會暫停提供。結構驗證無法證明出版內容正確、仍有效或已授權重用影像。

### 首批來源與後續限制

首批為 **九則史事、兩個各含三章的故事**，於 **2026-11-04** 完成內部資料核對。上方來源表列出艋舺龍山寺、清水巖、青山宮的政府文化資產資料，以及中山教會與台北清真寺的機構歷史、政府資料。沒有記錄外部宗教社群審閱或場所背書。故事將多份公開史料並列閱讀，不推定不同群體間有未記載的共同成因或直接歷史關係。

尚未核實適合的歷史照片及重用授權，因此本版不收錄外部影像；網頁可讀不表示可以再散布。原創 SVG 也不能當作歷史視覺證據。本功能不重建歷史行政邊界、不製作歷史人口圖，也不從登記數推定宗教參與。

V1.4 宜優先重新核對來源、安排有紀錄的外部文化審閱及實機視覺／螢幕閱讀器評估。選擇狀態維持短暫，不新增宗教歷史閱讀分析。未來加入影像前，須記錄出處、授權、必要署名及影像與具體主張的關聯。
