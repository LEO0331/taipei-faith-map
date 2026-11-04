import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import { culturalEvents } from '../culturalEvents';
import { resolveCulturalEvents, validateCulturalEvents } from '../calendarValidation';
import { testEvent, testOrganization } from './calendarFixtures';

describe('event content validation', () => {
  it('validates production sources and identities offline against the actual dataset', () => {
    expect(validateCulturalEvents(culturalEvents, organizationsJson as ReligiousOrganization[])).toEqual([]);
  });

  it('resolves a unique organization only when every identity field agrees', () => {
    expect(validateCulturalEvents([testEvent], [testOrganization])).toEqual([]);
    expect(resolveCulturalEvents([testEvent], [testOrganization])[0].organization).toBe(testOrganization);
    for (const mismatch of [{ ...testOrganization, id: 'other' }, { ...testOrganization, address: 'another address' }, { ...testOrganization, district: '大安區' }, { ...testOrganization, name: 'another organization' }]) {
      expect(resolveCulturalEvents([testEvent], [mismatch])).toEqual([]);
    }
    expect(resolveCulturalEvents([testEvent], [testOrganization, testOrganization])).toEqual([]);
    expect(resolveCulturalEvents([testEvent, { ...testEvent }], [testOrganization])).toEqual([]);
  });

  it('rejects unsafe sources, incomplete translations, invalid dates and missing evidence', () => {
    const event = structuredClone(testEvent);
    event.title.en = '';
    event.startDate = '2026-02-30';
    event.sources[0].url = 'javascript:alert(1)';
    const errors = validateCulturalEvents([event], [testOrganization]).join(' ');
    expect(errors).toContain('title.en');
    expect(errors).toContain('invalid date range');
    expect(errors).toContain('safe absolute HTTP(S)');
    expect(resolveCulturalEvents([event], [testOrganization])).toEqual([]);
    expect(validateCulturalEvents([{ ...testEvent, sources: [] }], [testOrganization]).join(' ')).toContain('source references');
  });

  it('checks temporal ordering, timezone, times, status and registration links', () => {
    expect(validateCulturalEvents([{ ...testEvent, endDate: '2026-11-27' }], [testOrganization]).join(' ')).toContain('invalid date range');
    expect(validateCulturalEvents([{ ...testEvent, startTime: '25:01' }], [testOrganization]).join(' ')).toContain('invalid start time');
    expect(validateCulturalEvents([{ ...testEvent, endTime: '16:00' }], [testOrganization]).join(' ')).toContain('requires a start time');
    expect(validateCulturalEvents([{ ...testEvent, endDate: testEvent.startDate, startTime: '16:00', endTime: '15:00' }], [testOrganization]).join(' ')).toContain('precedes');
    expect(validateCulturalEvents([{ ...testEvent, registrationUrl: '//evil.test' }], [testOrganization]).join(' ')).toContain('unsafe registration');
    expect(resolveCulturalEvents([{ ...testEvent, editorialReviewStatus: 'pending' }], [testOrganization])).toEqual([]);
  });
});
