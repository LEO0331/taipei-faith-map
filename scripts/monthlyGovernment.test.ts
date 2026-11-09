import { crc32 } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import type { ReligiousOrganization } from '../src/types';
import { compareCurrentGovernment, compareGovernmentRecords, discoverGovernmentResource, GOVERNMENT_DATASET_URL } from './monthlyGovernment';

const resource = 'https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const mime = 'application/vnd.oasis.opendocument.spreadsheet';
const date = '2021-04-29 16:00:16';
const row: ReligiousOrganization = {
  id: 'org-1-original', name: '和平教會', district: '大安區', address: '和平路1號', religion: '基督教',
  originalX: 306000, originalY: 2768000, longitude: 121.5, latitude: 25.0, festivalDates: ['農曆3月2日', '2026-01-08'],
  source: 'Reviewed source',
};
const landing = (updated = date, href = resource) => `<table><tr><td>ODS</td><td>${updated}</td><td><a href="${href}">下載</a></td></tr></table>`;

function makeOds(values = ['和平教會', '大安區', '和平路1號', '306000', '2768000', '基督教', '農曆3月2日|2026-01-08', 'PRIVATE-PERSON-123']) {
  const columns = ['寺廟名稱', '行政區', '地址', 'X座標', 'Y座標', '教別', '祭典日期', '負責人'];
  const xmlRows = [columns, values].map(cells => `<table:table-row>${cells.map(cell => `<table:table-cell><text:p>${cell}</text:p></table:table-cell>`).join('')}</table:table-row>`).join('');
  const entries = [['mimetype', mime], ['content.xml', `<table:table table:name="Sheet1">${xmlRows}</table:table>`]];
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const [name, contents] of entries) {
    const filename = Buffer.from(name);
    const data = Buffer.from(contents);
    const file = Buffer.alloc(30);
    file.writeUInt32LE(0x04034b50);
    file.writeUInt16LE(20, 4);
    file.writeUInt32LE(crc32(data), 14);
    file.writeUInt32LE(data.length, 18);
    file.writeUInt32LE(data.length, 22);
    file.writeUInt16LE(filename.length, 26);
    local.push(file, filename, data);
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt32LE(crc32(data), 16);
    header.writeUInt32LE(data.length, 20);
    header.writeUInt32LE(data.length, 24);
    header.writeUInt16LE(filename.length, 28);
    header.writeUInt32LE(offset, 42);
    central.push(header, filename);
    offset += file.length + filename.length + data.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(Buffer.concat(central).length, 12);
  end.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...local, ...central, end]));
}

function fetchFixture(html = landing(), ods = makeOds()) {
  return vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } }))
    .mockResolvedValueOnce(new Response(ods, { headers: { 'content-type': mime } }));
}

describe('government semantic review', () => {
  it('ignores ordering, identifiers, private fields and equivalent formatting', () => {
    const other = { ...row, id: 'org-2-original', name: '第二教會' };
    const adjusted = { ...row, id: 'org-9-reordered', name: '和平 教會', phone: 'PRIVATE-PHONE', address: '和平路１號',
      festivalDates: ['2026/1/8', '農曆 03 月 02 日'] };
    const result = compareGovernmentRecords([row, other], [other, adjusted]);
    expect(result).toEqual({ added: [], removed: [], modified: [], ambiguous: 0, baselineCount: 2, currentCount: 2 });
    expect(JSON.stringify(result)).not.toContain('PRIVATE-PHONE');
  });

  it('returns only safe record identifiers and changed fields', () => {
    const next = { ...row, name: 'PRIVATE-NEW-NAME', festivalDates: ['PRIVATE-DATE-TEXT'] };
    const removed = { ...row, id: 'org-2-removed', name: 'Removed', address: 'Other address', originalX: 307000 };
    const added = { ...row, name: 'PRIVATE-ADDITION', address: 'PRIVATE-ADDRESS', originalX: 309000 };
    const result = compareGovernmentRecords([row, removed], [added, next]);
    expect(result.removed).toEqual(['org-2-removed']);
    expect(result.added).toEqual([expect.stringMatching(/^source-[a-f0-9]{20}$/)]);
    expect(result.modified).toEqual([{ id: row.id, fields: ['name', 'festivalDates'], fingerprint: expect.stringMatching(/^[a-f0-9]{20}$/) }]);
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
    expect(compareGovernmentRecords([removed, row], [next, added])).toEqual(result);
  });

  it('withholds ambiguous identity matches from additions and removals', () => {
    const first = { ...row, address: 'First' };
    const second = { ...row, id: 'org-2-original', address: 'Second' };
    const moved = { ...row, address: 'Third' };
    const result = compareGovernmentRecords([first, second], [moved]);
    expect(result).toMatchObject({ ambiguous: 3, added: [], removed: [], modified: [] });
  });

  it('distinguishes a changed district, address and coordinates for a unique name', () => {
    const result = compareGovernmentRecords([row], [{ ...row, district: '中山區', address: '另一個地址', originalX: 307000 }]);
    expect(result.modified[0]?.fields).toEqual(['district', 'address', 'coordinates']);
  });

  it('sanitizes an unexpected baseline identifier', () => {
    const result = compareGovernmentRecords([{ ...row, id: 'PRIVATE-BASELINE-ID' }], []);
    expect(result.removed[0]).toMatch(/^baseline-[a-f0-9]{20}$/);
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
});

describe('official ODS checks', () => {
  it('discovers the listed official resource and reports metadata separately from an unchanged comparison', async () => {
    const fetcher = fetchFixture(landing('2026-11-09 09:23:00'));
    const result = await compareCurrentGovernment([row], fetcher);
    expect(result).toMatchObject({ status: 'complete', sourceUrl: GOVERNMENT_DATASET_URL, resourceUrl: resource, metadata: { updatedAt: '2026-11-09 09:23:00' }, added: [], removed: [], modified: [] });
    expect(fetcher.mock.calls.map(([url]) => url.toString())).toEqual([GOVERNMENT_DATASET_URL, resource]);
    expect(JSON.stringify(result)).not.toContain('PRIVATE-PERSON');
  });

  it('rejects a nonofficial or missing ODS link', () => {
    expect(() => discoverGovernmentResource(landing(date, resource.replace('data.taipei', 'untrusted.example')))).toThrow('one trusted ODS resource');
    expect(() => discoverGovernmentResource('<h1>No resource</h1>')).toThrow('one trusted ODS resource');
  });

  it('classifies HTTP 403 as unavailable without including the response body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('PRIVATE-ERROR-CONTENT', { status: 403 }));
    await expect(compareCurrentGovernment([row], fetcher)).rejects.toThrow(/^Government landing unavailable \(HTTP 403\)\.$/);
  });

  it('refuses a redirect to an untrusted destination before issuing a second request', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://untrusted.example/?secret=PRIVATE' } }));
    await expect(compareCurrentGovernment([row], fetcher)).rejects.toThrow('allowed official path');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid ODS even with the correct response type', async () => {
    await expect(compareCurrentGovernment([row], fetchFixture(landing(), new Uint8Array([1, 2, 3])))).rejects.toThrow('spreadsheet is invalid');
  });

  it('withholds comparison for an ODS row missing required fields', async () => {
    await expect(compareCurrentGovernment([row], fetchFixture(landing(), makeOds(['和平教會'])))).rejects.toThrow('incomplete records');
  });

  it('rejects a response exceeding the streamed size limit', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(512 * 1024 + 1), { headers: { 'content-type': 'text/html' } }));
    await expect(compareCurrentGovernment([row], fetcher)).rejects.toThrow('exceeded its size limit');
  });
});
