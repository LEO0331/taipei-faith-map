import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, resolve } from 'node:path';
import { inflateRawSync } from 'node:zlib';
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

const DEFAULT_SOURCE_PATH = '/Users/Leo/Downloads/臺北市已立案宗教團體點位資料.ods';

export function convertReligiousOrganizations(sourceArg?: string): ConversionReport {
  const sourcePath = resolve(sourceArg ?? DEFAULT_SOURCE_PATH);
  const outputDir = resolve('public/data');
  const { sheetName, rows } = readOdsSheet(sourcePath);
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
  writeJson('religious-organizations.json', organizations, outputDir);
  writeJson('religious-summary.json', summary, outputDir);
  writeJson('conversion-report.json', report, outputDir);

  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = convertReligiousOrganizations(process.argv[2]);
  console.log(
    `Converted ${report.outputRows} records from ${report.inputRows} rows. ` +
      `${report.skippedRows.length} skipped, ${report.coordinateOutliers.length} coordinate outliers.`,
  );
}

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

function writeJson(filename: string, data: unknown, outputDir: string): void {
  writeFileSync(resolve(outputDir, filename), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readOdsSheet(filePath: string): { sheetName: string; rows: RawRow[] } {
  const contentXml = extractZipEntry(readFileSync(filePath), 'content.xml').toString('utf8');
  const tableMatch = contentXml.match(/<table:table\b([^>]*)>([\s\S]*?)<\/table:table>/);
  if (!tableMatch) {
    throw new Error('ODS file does not contain a table.');
  }

  const [, tableAttrs, tableXml] = tableMatch;
  const sheetName = decodeXml(getXmlAttribute(tableAttrs, 'table:name') ?? 'Sheet1');
  const parsedRows: RawRow[] = [];
  let headers: string[] | undefined;

  for (const rowMatch of tableXml.matchAll(/<table:table-row\b([^>]*)>([\s\S]*?)<\/table:table-row>/g)) {
    const [, rowAttrs, rowXml] = rowMatch;
    const cells = parseOdsCells(rowXml, headers?.length ?? 32);
    const repeatedRows = Number(getXmlAttribute(rowAttrs, 'table:number-rows-repeated') ?? '1');

    if (!headers) {
      const candidateHeaders = cells.map((cell) => cell.trim()).filter(Boolean);
      if (candidateHeaders.length === 0) continue;
      headers = candidateHeaders;
      continue;
    }

    if (cells.every((cell) => cell.trim().length === 0)) continue;

    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const repeatCount = Number.isFinite(repeatedRows) && repeatedRows > 0 ? repeatedRows : 1;
    for (let index = 0; index < repeatCount; index += 1) {
      parsedRows.push(row);
    }
  }

  return { sheetName, rows: parsedRows };
}

export function parseOdsCells(rowXml: string, maxColumns: number): string[] {
  const cells: string[] = [];
  const cellPattern = /<table:table-cell\b([^>]*?)(?:\s*\/>|>([\s\S]*?)<\/table:table-cell>)/g;

  for (const cellMatch of rowXml.matchAll(cellPattern)) {
    if (cells.length >= maxColumns) break;

    const [, attrs, cellXml = ''] = cellMatch;
    const repeatedColumns = Number(getXmlAttribute(attrs, 'table:number-columns-repeated') ?? '1');
    const repeatCount = Number.isFinite(repeatedColumns) && repeatedColumns > 0 ? repeatedColumns : 1;
    const value = parseOdsCellValue(attrs, cellXml);

    for (let index = 0; index < repeatCount && cells.length < maxColumns; index += 1) {
      cells.push(value);
    }
  }

  return cells;
}

function parseOdsCellValue(attrs: string, cellXml: string): string {
  const paragraphs = [...cellXml.matchAll(/<text:p\b[^>]*>([\s\S]*?)<\/text:p>/g)].map((match) =>
    decodeXml(stripXmlTags(match[1])),
  );

  if (paragraphs.length > 0) {
    return paragraphs.join('\n');
  }

  const value = getXmlAttribute(attrs, 'office:value');
  return value ? decodeXml(value) : '';
}

function stripXmlTags(value: string): string {
  return value
    .replace(/<text:line-break\s*\/>/g, '\n')
    .replace(/<text:s(?:\s+text:c="(\d+)")?\s*\/>/g, (_match, count: string | undefined) =>
      ' '.repeat(count ? Number(count) : 1),
    )
    .replace(/<[^>]+>/g, '');
}

function getXmlAttribute(attrs: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return attrs.match(new RegExp(`${escapedName}="([^"]*)"`))?.[1];
}

function decodeXml(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|apos|#(\d+)|#x([\da-fA-F]+));/g, (entity, named, decimal, hex) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));

    const entities: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
    };
    return entities[named] ?? entity;
  });
}

function extractZipEntry(zipFile: Buffer, entryName: string): Buffer {
  const eocdOffset = findEndOfCentralDirectory(zipFile);
  const centralDirectorySize = zipFile.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = zipFile.readUInt32LE(eocdOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  let offset = centralDirectoryOffset;

  while (offset < centralDirectoryEnd) {
    if (zipFile.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Invalid ZIP central directory header.');
    }

    const compressionMethod = zipFile.readUInt16LE(offset + 10);
    const compressedSize = zipFile.readUInt32LE(offset + 20);
    const fileNameLength = zipFile.readUInt16LE(offset + 28);
    const extraLength = zipFile.readUInt16LE(offset + 30);
    const commentLength = zipFile.readUInt16LE(offset + 32);
    const localHeaderOffset = zipFile.readUInt32LE(offset + 42);
    const fileNameStart = offset + 46;
    const fileName = zipFile.subarray(fileNameStart, fileNameStart + fileNameLength).toString('utf8');

    if (fileName === entryName) {
      return readZipEntryData(zipFile, localHeaderOffset, compressedSize, compressionMethod);
    }

    offset = fileNameStart + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`ODS file is missing ${entryName}.`);
}

function readZipEntryData(
  zipFile: Buffer,
  localHeaderOffset: number,
  compressedSize: number,
  compressionMethod: number,
): Buffer {
  if (zipFile.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error('Invalid ZIP local file header.');
  }

  const fileNameLength = zipFile.readUInt16LE(localHeaderOffset + 26);
  const extraLength = zipFile.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const compressedData = zipFile.subarray(dataStart, dataStart + compressedSize);

  if (compressionMethod === 0) return compressedData;
  if (compressionMethod === 8) return inflateRawSync(compressedData);

  throw new Error(`Unsupported ZIP compression method: ${compressionMethod}.`);
}

function findEndOfCentralDirectory(zipFile: Buffer): number {
  const minimumOffset = Math.max(0, zipFile.length - 0xffff - 22);
  for (let offset = zipFile.length - 22; offset >= minimumOffset; offset -= 1) {
    if (zipFile.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error('Invalid ZIP file: end of central directory not found.');
}
