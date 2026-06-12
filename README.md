# Taipei Registered Religious Groups Map / 台北宗教團體地圖

Mobile-first bilingual web app for exploring Taipei registered religious organization locations from a public ODS dataset.

## Purpose

This project provides a public map and lightweight dashboard for the dataset `臺北市已立案宗教團體點位資料`. It is designed for browsing registered organization locations, filtering by district or religion type, checking festival-date text when available, and finding nearby registered organizations with browser geolocation.

## Data Source

- Source file: `臺北市已立案宗教團體點位資料.ods`
- Sheet: `工作表1`
- Generated app data:
  - `public/data/religious-organizations.json`
  - `public/data/religious-summary.json`
  - `public/data/conversion-report.json`

The public UI intentionally does not display `負責人` by default.

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

實際資訊請以主管機關及現場公告為準。
