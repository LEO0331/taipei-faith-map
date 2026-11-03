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

V1.2 should prioritize documented external cultural review, more safely matched profiles, renewed source checks and evaluation with real devices and screen readers. Ambient sound remains optional and deferred until suitable original or licensed environmental audio is verified. Do not add religious activity tracking or persist tour/reflection history.

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

V1.2 宜優先安排有紀錄的外部文化審閱、更多安全匹配的場所、重新核對來源，以及實機與螢幕閱讀器評估。環境音仍為選配，待原創或授權素材確認後再考慮加入。不要新增宗教活動追蹤，也不要儲存導覽或靜心活動紀錄。
