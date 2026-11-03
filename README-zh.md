# 臺北市已立案宗教團體地圖

這是一個以行動裝置為優先的雙語網站，使用公開 ODS 資料集呈現臺北市已立案宗教團體的位置。

[English README](README.md)

## 專案目的

本專案為「臺北市已立案宗教團體點位資料」提供公開地圖與輕量儀表板。使用者可瀏覽已立案團體的位置、依行政區或宗教別篩選、查看可取得的慶典日期文字，並透過瀏覽器定位功能尋找附近的已立案團體。

## 信仰空間 V1

從地圖標記或團體清單選擇「探索信仰空間」，即可進入道教、佛教、基督教、天主教或伊斯蘭教的原創 SVG 文化場景；其他教別使用中性展間。包含雙語互動熱點、參訪禮儀及可選的 1／3／5 分鐘靜心計時器。所有場景均為文化示意，並非該團體的實際內部配置。

場景按需載入，開啟時保留底層地圖與篩選、附近搜尋、視野狀態。Leaflet popup 使用已跳脫的團體 ID 與限定範圍、可清理的事件代理。雙語內容設定集中於 `src/features/faith-spaces/faithSpaceConfig.ts`；繪圖、對話框、計時器與樣式放在同一功能目錄。靜心活動不會儲存或傳送。

測試沿用 Vitest，新增僅供開發使用的 `@testing-library/react` 與 `jsdom`，分別支援無障礙互動查詢，以及文件、焦點與計時器測試。Windows 若限制系統暫存目錄，可將 `TEMP` 與 `TMP` 指向可寫入的本機目錄後執行 `npm test`。

V1.1 建議由各傳統代表審閱文化內容、逐步加入其他教別的介紹，並增加實機與螢幕閱讀器驗證；專屬內容完成審閱前保留中性展間。

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
