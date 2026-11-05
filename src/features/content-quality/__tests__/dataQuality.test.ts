import { describe, expect, it } from 'vitest';
import organizations from '../../../../public/data/religious-organizations.json';
import { assessGovernmentData, getRegistrationStatusObservation, registrationStatusNotice } from '../dataQuality';

const record = {
  id: 'record-1', name: '測試宮', district: '萬華區', address: '測試路1號', religion: '道教',
  latitude: 25.04, longitude: 121.51, festivalDates: ['農曆10月22日'],
};

describe('government snapshot quality assessment', () => {
  it('separates structural errors from incomplete information and never mutates input', () => {
    const records = [Object.freeze({ ...record, festivalDates: Object.freeze([]) })];
    Object.freeze(records);
    const report = assessGovernmentData(records);
    expect(report.total).toBe(1);
    expect(report.errors).toEqual([]);
    expect(report.counts['missing-festival-information']).toBe(1);
    expect(report.warnings[0].organizationId).toBe(record.id);
    expect(records[0].festivalDates).toEqual([]);
  });

  it('reports missing fields and rejects malformed records and classification values', () => {
    const report = assessGovernmentData([null, { ...record, id: '', name: '', district: undefined, address: ' ', religion: 'unknown religion', festivalDates: 10 }]);
    const codes = report.errors.map(issue => issue.code);
    for (const code of ['invalid-record', 'missing-id', 'missing-name', 'missing-district', 'missing-address', 'invalid-religion', 'invalid-festival-dates']) expect(codes).toContain(code);
    expect(report.warnings.map(issue => issue.code)).toContain('missing-festival-information');
  });

  it.each([{ latitude: NaN }, { longitude: Infinity }, { latitude: '25.04' }, { latitude: 91 }, { longitude: -181 }])('rejects invalid geographic coordinates: %j', coordinates => {
    const report = assessGovernmentData([{ ...record, ...coordinates }]);
    expect(report.errors.map(issue => issue.code)).toEqual(['invalid-coordinates']);
    expect(report.warnings.map(issue => issue.code)).not.toContain('coordinate-outlier');
  });

  it('flags finite Taipei-area outliers without claiming that they are invalid worldwide coordinates', () => {
    const report = assessGovernmentData([{ ...record, latitude: 24.5 }, { ...record, id: 'another', name: '另一處', isCoordinateOutlier: true }]);
    expect(report.errors).toEqual([]);
    expect(report.counts['coordinate-outlier']).toBe(2);
  });

  it('reports all affected duplicate IDs and duplicate-looking name/address candidates', () => {
    const report = assessGovernmentData([record, { ...record, name: ` ${record.name} ` }, { ...record, id: 'another-id' }]);
    expect(report.counts['duplicate-id']).toBe(2);
    expect(report.counts['duplicate-name-address']).toBe(3);
    expect(report.errors.every(issue => issue.code === 'duplicate-id')).toBe(true);
    expect(report.warnings.filter(issue => issue.code === 'duplicate-name-address').map(issue => issue.recordIndex)).toEqual([0, 1, 2]);
  });

  it('keeps Other/Uncategorized classifications as advisory observations', () => {
    for (const religion of ['其他', '未分類']) {
      const report = assessGovernmentData([{ ...record, religion }]);
      expect(report.errors).toEqual([]);
      expect(report.counts['ambiguous-religion']).toBe(1);
    }
  });

  it('assesses the actual snapshot without changing any record, dashboard input or festival text', () => {
    const before = JSON.stringify(organizations);
    const report = assessGovernmentData(organizations);
    expect(report.total).toBe(organizations.length);
    expect(report.errors).toEqual([]);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(JSON.stringify(organizations)).toBe(before);
  });
});

describe('qualified registration-text observations', () => {
  it.each(['金鶴宮(108.10.5廢止)', '某會（已解散）', '某法人(102年5月29日 改隸新北市政府民政局)', '某法人(94.6.1移轉為全國性法人)', '某會已撤銷', '某寺廢止寺廟登記'])('flags explicit source-status wording without determining current status: %s', name => {
    expect(getRegistrationStatusObservation(name)?.code).toBe('registration-status-text');
  });

  it.each(['廢止制度研究會', '解散歷史研究堂', '移轉文化協會', '某會（研究廢止制度）', '某寺尚未解散', '測試宮', undefined, null])('does not classify unusual names or non-status text: %s', name => {
    expect(getRegistrationStatusObservation(name)).toBeUndefined();
  });

  it('keeps both public notices carefully qualified', () => {
    expect(registrationStatusNotice.zh).toContain('可能');
    expect(registrationStatusNotice.en).toContain('may');
  });
});
