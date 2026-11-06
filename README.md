# Taipei Registered Religious Groups Map

Mobile-first bilingual web app for exploring Taipei registered religious organization locations from a public ODS dataset.

[繁體中文說明](README-zh.md)

## Purpose

This project provides a public map and lightweight dashboard for the "Taipei City Registered Religious Organizations Location Data" dataset. It is designed for browsing registered organization locations, filtering by district or religion type, checking festival-date text when available, and finding nearby registered organizations with browser geolocation.

## Faith Spaces V1

Choose **Explore Faith Space** in a map popup or organization record to open an illustrated cultural exhibition. Five original SVG scenes cover Taoism, Buddhism, Christianity, Catholicism and Islam; other classifications use a neutral gallery. Numbered hotspots, visitor etiquette and an optional 1/3/5-minute reflection timer support Chinese and English. Scenes describe architectural traditions, never the selected location's actual interior.

The feature loads on demand. The map remains mounted underneath an inert background so filters, nearby results and the map view survive closing. Popup actions use escaped organization IDs and scoped, cleaned-up event delegation. Configuration and bilingual content live in `src/features/faith-spaces/faithSpaceConfig.ts`; artwork, modal, timer and feature CSS are adjacent. Reflection activity is never persisted or transmitted.

DOM tests use the existing Vitest runner with `@testing-library/react` for accessible interaction queries and `jsdom` for document, focus and timer behavior; both are development-only dependencies. On Windows environments that restrict the system temp directory, set `TEMP` and `TMP` to an existing writable local directory before running `npm test`.

## Faith Spaces V1.1 — Cultural Discovery

**Cultural Scene** retains free hotspot exploration and adds an optional **Guided Tour** through the same topics in configuration order. Previous, Next, completion, restart and exit controls are self-paced; changing language preserves the current step. Tour progress stays in React memory and is never stored or transmitted. **About This Place** separately shows source-backed facts about the selected location, with citations beside each introduction and fact, review dates and an explicit distinction from government registration data. Locations without a profile retain the cultural scene and a clear availability message.

The initial profiles cover [Songshan Ciyou Temple](https://www.ssjyg.org.tw/About.aspx?View=11), [Bangka Lungshan Temple](https://whdo.gov.taipei/News_Content.aspx?n=2B790586BA4E1E7A&s=039849E84D5B9C7B&sms=15EB41D4C772E746), [Taipei Grand Mosque](https://www.taipeimosque.org.tw/guided.php?lang=tw), and [Zhongshan Presbyterian Church](https://www.sevenstar.org.tw/church/c02004/). Additional references accompany individual architectural facts. The neutral gallery now includes sourced introductory reading for I-Kuan Tao, the Bahá’í Faith and Tenrikyo; it does not invent buildings or religious symbols for them.

Curated data lives in `placeProfiles.ts` and `traditionContent.ts` alongside the Faith Spaces components, separately from generated JSON. Profile lookup checks the organization ID **and** registered name, district and address; stale or ambiguous matches are withheld. Offline Vitest validation checks nonempty bilingual content, per-claim evidence, source metadata and HTTP(S) URLs, review dates and unique mappings against the current dataset. Source links reject unsafe destinations. All cultural content remains within the lazy-loaded feature.

The release records internal source checking, not religious-community approval. See the [bilingual cultural-content contributor guide](docs/cultural-content.md) for the editorial workflow, source inventory and instructions for adding profiles. Catholic church profiles are deferred because examined dataset records describe orders or offices rather than safely matched church buildings. Ambient audio is deferred because no suitable licensed asset was verified. Ongoing editorial priorities include external cultural review, additional verified profiles and real-device/screen-reader evaluation; no unperformed accessibility or community review is claimed.

## V1.2 — Calendar and Cultural Walking Routes

The primary **Map / Calendar / Walking Routes** navigation adds two ways to discover places while preserving map filters, location and nearby-search context. Calendar and route interfaces load on first use. Their selections remain in React memory; they do not add accounts, analytics or religious-activity storage. Calendar entries and route stops can open the existing Faith Space or show the corresponding registered place on the map.

**Calendar** distinguishes original **Festival References** from confirmed, dated events. Government festival text is displayed as supplied, with lunar/Gregorian/unknown labels; it is not converted into this year's schedule or placed on calendar dates. Month and agenda views show curated Gregorian occurrences using `Asia/Taipei`, including multi-day and cross-year date ranges. Confirmed, cancelled and postponed statuses are explicit; upcoming entries exclude cancelled or postponed occurrences. The initial dated example is [Qingshan Temple's announced night patrol and procession, 28–30 November 2026](https://www.religiouscarnival.com/edcontent.php?id=1155&lang=tw&tb=8), also listed in a [government cultural notice](https://www.ilccb.gov.tw/News_Content.aspx?n=10203&s=410445&sms=12921). Public participation is supported by that notice, but daily times and participation arrangements still need confirmation. Events show source-check dates and a reminder that announcements can change.

**Walking Routes** begins with two short editorial sequences: **Three temple stories in Bangka** (Lungshan Temple → Qingshan Temple → Qingshui Temple) and **A church and a City God temple in Dadaocheng** (Lee Chun-sheng Memorial Church → Xia-Hai City God Temple). Each stop has bilingual cultural context and specific institutional or government sources. Numbered markers show the ordered places rather than a surveyed pedestrian path. Walking directions open externally in Google Maps; the URL builder falls back to individual legs if waypoint or URL limits prevent a full route. The app supplies no estimated duration or distance and does not assume interior access, step-free passage or continuous sidewalks.

Curated occurrences live in `src/features/religious-calendar/culturalEvents.ts`; festival references are derived separately by `festivalReferences.ts`. Route definitions live in `src/features/cultural-routes/culturalRoutes.ts`. These modules reuse the shared identity, bilingual-text, date, editorial-status and source checks in `src/utils/curatedContent.ts`, also used by V1.1 profiles. Event and route validation requires exact registered identity and published evidence; routes additionally reject invalid coordinates, repeated stops and records marked inactive. Invalid, ambiguous or pending content is withheld. See the [contributor guide](docs/cultural-content.md#v12-calendar-and-route-contributions) for authoring rules and the V1.2 source inventory, checked on **2026-11-04**.

The collection is manually maintained and intentionally small. There are no automatic event feeds, scraping, lunar-date conversion or guarantees of public access. Source availability and announced arrangements can change. Ongoing priorities are renewed event/source checks, documented external cultural review and real-device/screen-reader evaluation. Ambient audio remains deferred.

## V1.3 — Historical Timeline and Heritage Stories

**History & Stories** adds a lazy-loaded primary destination with **Historical Timeline** and **Heritage Stories** views. The timeline supports religion, district and theme filters, selected milestone details, source references and links to related reading. Stories have an introduction, three self-paced chapters and a conclusion; chapter navigation and language changes preserve the current reading state. The initial collection contains nine historical milestones and two stories: **Reading Bangka's temple layers** and **Buildings and communities: different dates**.

Historical dates retain the evidence's precision: exact Gregorian dates, year only, approximate dates, year ranges or unknown dates. A year is never turned into an invented January 1 date. Known records sort by documented start year with deterministic tie-breaks; undated records remain last. Historical milestones are separate from Calendar's current dated occurrences. Founding, construction, congregation establishment, relocation and heritage designation are described as distinct events.

Content lives in `src/features/heritage/historicalMilestones.ts`, `heritageStories.ts` and the current-place manifest `heritageOrganizations.ts`, with shared types, validation and lookup helpers. Chapters reference existing milestone IDs rather than creating another historical timeline. The manifest must match the current government record by ID, full name, district and address; a chapter without a safely matched current place remains readable. Sources accompany every milestone and chapter, and the content records internal source checking on **2026-11-04**, without claiming religious-community review or endorsement.

**View current registered location** temporarily highlights present-day records on the existing map. These coordinates do not establish historical locations or boundaries. Returning to History & Stories restores the reading context and previous map viewport; verified-profile links open **About This Place** directly in the existing Faith Space, and related-route links use only existing curated Walking Routes. The Lishui Street mosque chapter deliberately has no current-place map link, because the Xinsheng South Road registration cannot verify that earlier site's coordinates.

The [bilingual historical-content guide](docs/historical-content.md) explains date precision, identity validation, chapter/milestone references and the primary-source inventory. Initial sources cover government heritage records for Bangka temples, [Zhongshan Church's institutional chronology](https://www.sevenstar.org.tw/church/c02004/) and heritage record, and [Taipei Grand Mosque's official history](https://www.taipeimosque.org.tw/guided.php?lang=tw) and heritage record. Archival images remain deferred because no reusable assets and licenses were verified. The feature does not reconstruct historic boundaries or infer population or religious-participation trends from current registration counts. Ongoing priorities include documented external cultural review, renewed source checks and real-device visual/screen-reader evaluation.

## V1.4 — Content Quality and Accessibility Review

V1.4 expands **About This Place** from four to eight internally checked profiles, adding [Bangka Qingshan Temple](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211), [Bangka Qingshui Temple](https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12), [Taipei Xia-Hai City God Temple](https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=58), and [Lee Chun-sheng Memorial Church](https://www.pct.org.tw/churchdata.aspx?strOrgNo=C03001). The additions were checked on **2026-11-05**; earlier source-check dates remain unchanged. A Catholic parish at Tonghua Street **178** was not attached to the dataset's order record at **172**. Identity and address evidence take priority over increasing category coverage.

Compact related-content actions in a place profile connect safely matched historical milestones, stories, existing walking routes and dated cultural events. They reuse the current navigation and provide a return to the originating place context. They do not create another primary destination or persist browsing history.

Run `npm run content:audit` for a read-only offline audit of profiles, tradition introductions, events, routes, heritage milestones/stories and government-data quality. Use `-- --as-of 2026-11-05 --format json` for a reproducible dated JSON report. Structural errors fail the command; editorial advisories identify review work without rewriting the data or declaring a claim false. Upcoming event checks older than 30 days and reference checks older than 365 days receive attention flags. The current government snapshot contains **551 records**, **0 structural errors** and **341 advisory occurrences**: 280 missing festival descriptions, 50 Other/Uncategorized classifications and 11 explicit registration-status annotations. Categories can overlap, so 341 is not a count of distinct organizations. No records or Dashboard totals were changed by this assessment.

The release adds development-only `axe-core` checks and improves source-list heading/landmark structure, modal and loading-shell focus containment, and language-selection semantics. DOM checks do not measure rendered contrast, real-device layout or screen-reader usability. Browser initialization failed in this environment, so manual checks at 320, 375, 390 and 768 pixels and desktop, real-device testing, contrast and screen-reader checks remain unverified for V1.4. See the [accessibility review](docs/accessibility-review.md), [content-audit guide](docs/content-audit.md) and [prepared cultural-review workflow](docs/cultural-review-workflow.md) for evidence boundaries and follow-up work. External community review has not been performed; the workflow does not imply outreach, consent or endorsement.

## V1.5a — Faith Moments

Faith Spaces now includes an original small vector visitor. Hotspot text appears immediately while an optional, brief walk and observing gesture runs. Walk, sit, wave, observe and rest controls remain neutral; a new action or closing the scene cancels previous movement. There is no opening animation or audio.

Animation On/Off is available throughout the scene. The device's reduced-motion preference takes precedence; an explicit Off setting stays off across scenes. Only this motion preference is stored locally. `VITE_FAITH_MOMENTS_ENABLED=false` hides the visitor and its controls. Shared-service flags remain off by default and are reserved for separately reviewed releases. See [Faith Moments](docs/faith-moments.md) and `.env.example`.

## Data Source

- Source file: `臺北市已立案宗教團體點位資料.ods`
- Sheet: `工作表1`
- Generated app data:
  - `public/data/religious-organizations.json`
  - `public/data/religious-summary.json`
  - `public/data/conversion-report.json`

The public UI intentionally does not display the person in charge by default.

## Coordinate Conversion

The ODS coordinates are TWD97 / TM2, likely EPSG:3826. The conversion script defines EPSG:3826 with `proj4`, converts each `X座標` / `Y座標` pair to WGS84 longitude and latitude, then validates the converted result against broad Taipei bounds before Leaflet renders it.

Leaflet receives coordinates as `[latitude, longitude]`.

## Install

```bash
npm install
```

## Run ODS Conversion

By default, the converter reads:

```txt
/Users/Leo/Downloads/臺北市已立案宗教團體點位資料.ods
```

Run:

```bash
npm run convert:data
```

Or pass a source file path:

```bash
npm run convert:data -- /path/to/臺北市已立案宗教團體點位資料.ods
```

## Develop

```bash
npm run dev
```

## Test

```bash
npm test
```

## Build

```bash
npm run build
```

## Deploy

### Vercel

Use the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

### Netlify

Use:

- Build command: `npm run build`
- Publish directory: `dist`

### GitHub Pages

Build locally or in GitHub Actions:

```bash
npm run build
```

Publish the `dist` directory. If deploying under a repository subpath, set the Vite `base` option before building.

## Data Disclaimer

This dataset is a snapshot of registered religious organizations. Registered organization counts do not represent popularity, number of followers, attendance, activity level, or religious influence.

For current information, refer to the responsible government authority and on-site notices.
