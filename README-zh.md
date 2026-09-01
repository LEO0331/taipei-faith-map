# 臺北市已立案宗教團體地圖

這是一個以行動裝置為優先的雙語網站，使用公開 ODS 資料集呈現臺北市已立案宗教團體的位置。

[English README](README.md)

## 專案目的

本專案為「臺北市已立案宗教團體點位資料」提供公開地圖與輕量儀表板。使用者可瀏覽已立案團體的位置、依行政區或宗教別篩選、查看可取得的慶典日期文字，並透過瀏覽器定位功能尋找附近的已立案團體。

## 資料來源

- 來源檔案：`臺北市已立案宗教團體點位資料.ods`
- 工作表：`工作表1`
- 產生的應用程式資料：
  - `public/data/religious-organizations.json`
  - `public/data/religious-summary.json`
  - `public/data/conversion-report.json`

公開介面預設不顯示「負責人」欄位。

## 座標轉換

ODS 檔案的座標為 TWD97 / TM2，推測使用 EPSG:3826。轉換程式使用 `proj4` 定義 EPSG:3826，將每組「X座標」與「Y座標」轉為 WGS84 經緯度，並在 Leaflet 繪製前，以臺北市的大致範圍驗證結果。

Leaflet 使用的座標順序為 `[緯度, 經度]`。

## 安裝

```bash
npm install
```

## 執行 ODS 資料轉換

轉換程式預設讀取：

```txt
/Users/Leo/Downloads/臺北市已立案宗教團體點位資料.ods
```

執行：

```bash
npm run convert:data
```

或指定來源檔案路徑：

```bash
npm run convert:data -- /path/to/臺北市已立案宗教團體點位資料.ods
```

## 開發

```bash
npm run dev
```

## 測試

```bash
npm test
```

## 建置

```bash
npm run build
```

## 部署

### Vercel

使用預設 Vite 設定：

- 建置指令：`npm run build`
- 輸出目錄：`dist`

### Netlify

使用：

- 建置指令：`npm run build`
- 發布目錄：`dist`

### GitHub Pages

在本機或 GitHub Actions 中建置：

```bash
npm run build
```

發布 `dist` 目錄。若部署在儲存庫的子路徑下，請在建置前設定 Vite 的 `base` 選項。

## 資料聲明

本資料集為已立案宗教團體的資料快照。已立案團體數量不代表其受歡迎程度、信徒人數、出席人數、活動程度或宗教影響力。

實際資訊請以主管機關及現場公告為準。
