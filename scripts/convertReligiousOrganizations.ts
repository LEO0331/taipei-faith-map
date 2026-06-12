import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import XLSX from 'xlsx';
import {
  buildSummary,
  createStableId,
  normalizeEmpty,
  normalizeReligion,
  parseFestivalDates,
  SOURCE_NAME,
} from '../src/utils/data';
import { convertTwd97ToWgs84, isCoordinateOutlier, TAIPEI_BOUNDS } from '../src/utils/geo';
import type { ReligiousOrganization } from '../src/types';

type RawRow = Record<string, unknown>;

type ConversionReport = {
  sourceFile: string;
  sheetName: string;
  generatedAt: string;
  inputRows: number;
  outputRows: number;
  skippedRows: Array<{
    rowNumber: number;
    reason: string;
  }>;
  coordinateOutliers: Array<{
    id: string;
    name: string;
    longitude: number;
    latitude: number;
  }>;
  taipeiBounds: typeof TAIPEI_BOUNDS;
  notes: string[];
};

const sourceArg = process.argv[2];
const sourcePath = resolve(
  sourceArg ?? '/Users/Leo/Downloads/臺北市已立案宗教團體點位資料.ods',
);
const outputDir = resolve('public/data');

const workbook = XLSX.readFile(sourcePath, { cellDates: false });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '', raw: false });

const skippedRows: ConversionReport['skippedRows'] = [];
const organizations: ReligiousOrganization[] = [];

rows.forEach((row, index) => {
  const trimmedRow = trimKeys(row);
  const name = normalizeEmpty(trimmedRow['寺廟名稱']);
  const district = normalizeEmpty(trimmedRow['行政區']);
  const address = normalizeEmpty(trimmedRow['地址']);
  const originalX = toNumber(trimmedRow['X座標']);
  const originalY = toNumber(trimmedRow['Y座標']);
  const rowNumber = index + 2;

  if (!name || !district || !address) {
    skippedRows.push({ rowNumber, reason: 'Missing required name, district, or address' });
    return;
  }

  if (originalX === undefined || originalY === undefined) {
    skippedRows.push({ rowNumber, reason: 'Missing or invalid TWD97 coordinates' });
    return;
  }

  const { longitude, latitude } = convertTwd97ToWgs84(originalX, originalY);
  const outlier = isCoordinateOutlier(longitude, latitude);
  const id = createStableId([name, district, address, originalX, originalY], index);
  const village = normalizeEmpty(trimmedRow['里']);
  const phone = normalizeEmpty(trimmedRow['電話']);

  organizations.push({
    id,
    name,
    district,
    ...(village ? { village } : {}),
    religion: normalizeReligion(normalizeEmpty(trimmedRow['教別'])),
    festivalDates: parseFestivalDates(normalizeEmpty(trimmedRow['祭典日期'])),
    ...(phone ? { phone } : {}),
    address,
    originalX,
    originalY,
    longitude: roundCoordinate(longitude),
    latitude: roundCoordinate(latitude),
    source: SOURCE_NAME,
    ...(outlier ? { isCoordinateOutlier: true } : {}),
  });
});

const summary = buildSummary(organizations);
const report: ConversionReport = {
  sourceFile: basename(sourcePath),
  sheetName,
  generatedAt: new Date().toISOString(),
  inputRows: rows.length,
  outputRows: organizations.length,
  skippedRows,
  coordinateOutliers: organizations
    .filter((item) => item.isCoordinateOutlier)
    .map((item) => ({
      id: item.id,
      name: item.name,
      longitude: item.longitude,
      latitude: item.latitude,
    })),
  taipeiBounds: TAIPEI_BOUNDS,
  notes: [
    'Coordinates were converted from TWD97 / TM2 (EPSG:3826) to WGS84 for Leaflet.',
    'Blank religion values were normalized to 未分類.',
    '負責人 was intentionally excluded from generated public JSON.',
    'Festival date text is split on | and kept in its original lunar-calendar wording.',
  ],
};

mkdirSync(outputDir, { recursive: true });
writeJson('religious-organizations.json', organizations);
writeJson('religious-summary.json', summary);
writeJson('conversion-report.json', report);

console.log(
  `Converted ${organizations.length} records from ${rows.length} rows. ` +
    `${skippedRows.length} skipped, ${report.coordinateOutliers.length} coordinate outliers.`,
);

function trimKeys(row: RawRow): RawRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value]));
}

function toNumber(value: unknown): number | undefined {
  const normalized = normalizeEmpty(value);
  if (!normalized) return undefined;
  const parsed = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(7));
}

function writeJson(filename: string, data: unknown): void {
  writeFileSync(resolve(outputDir, filename), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}
