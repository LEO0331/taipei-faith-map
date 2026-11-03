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

The release records internal source checking, not religious-community approval. See the [bilingual cultural-content contributor guide](docs/cultural-content.md) for the editorial workflow, source inventory and instructions for adding profiles. Catholic church profiles are deferred because examined dataset records describe orders or offices rather than safely matched church buildings. Ambient audio is deferred because no suitable licensed asset was verified. V1.2 priorities include external cultural review, additional verified profiles and real-device/screen-reader evaluation; no unperformed accessibility or community review is claimed.

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
