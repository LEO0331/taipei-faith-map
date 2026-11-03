# Taipei Registered Religious Groups Map

Mobile-first bilingual web app for exploring Taipei registered religious organization locations from a public ODS dataset.

[繁體中文說明](README-zh.md)

## Purpose

This project provides a public map and lightweight dashboard for the "Taipei City Registered Religious Organizations Location Data" dataset. It is designed for browsing registered organization locations, filtering by district or religion type, checking festival-date text when available, and finding nearby registered organizations with browser geolocation.

## Faith Spaces V1

Choose **Explore Faith Space** in a map popup or organization record to open an illustrated cultural exhibition. Five original SVG scenes cover Taoism, Buddhism, Christianity, Catholicism and Islam; other classifications use a neutral gallery. Numbered hotspots, visitor etiquette and an optional 1/3/5-minute reflection timer support Chinese and English. Scenes describe architectural traditions, never the selected location's actual interior.

The feature loads on demand. The map remains mounted underneath an inert background so filters, nearby results and the map view survive closing. Popup actions use escaped organization IDs and scoped, cleaned-up event delegation. Configuration and bilingual content live in `src/features/faith-spaces/faithSpaceConfig.ts`; artwork, modal, timer and feature CSS are adjacent. Reflection activity is never persisted or transmitted.

DOM tests use the existing Vitest runner with `@testing-library/react` for accessible interaction queries and `jsdom` for document, focus and timer behavior; both are development-only dependencies. On Windows environments that restrict the system temp directory, set `TEMP` and `TMP` to an existing writable local directory before running `npm test`.

V1.1 priorities: have tradition representatives review the educational copy, add reviewed introductions for more classifications, and extend real-device/screen-reader checks. The generic gallery intentionally remains available until dedicated content has been reviewed.

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
