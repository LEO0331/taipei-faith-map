import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import { getSafeSourceUrl } from '../culturalSources';
import { getPlaceProfile, validatePlaceProfiles, validateTraditionContent } from '../placeProfileLookup';
import { placeProfiles } from '../placeProfiles';
import { traditionContent } from '../traditionContent';
import type { PlaceProfile, SourceReference } from '../placeProfileTypes';

const organizations = organizationsJson as ReligiousOrganization[];
const source: SourceReference = {
  id: 'reference', title: { zh: '測試資料來源', en: 'Test reference' },
  url: 'https://example.org/history', publisher: 'Example institution', verifiedAt: '2026-11-03',
};
const organization = organizations[0];
const profile: PlaceProfile = {
  id: 'profile-fixture', organizationId: organization.id, organizationName: organization.name,
  district: organization.district, address: organization.address,
  introduction: { zh: '經資料來源支持的介紹。', en: 'An introduction supported by its source.' },
  sources: [source], facts: [{ id: 'history', title: { zh: '歷史', en: 'History' },
    description: { zh: '有來源的敘述。', en: 'A sourced statement.' }, sources: [source] }],
  lastReviewed: '2026-11-03', editorialReviewStatus: 'internal-reviewed',
};

describe('curated profile identity and content', () => {
  it('validates every curated place against the real government dataset offline', () => {
    expect(placeProfiles.length).toBeGreaterThanOrEqual(3);
    expect(validatePlaceProfiles(placeProfiles, organizations)).toEqual([]);
    for (const item of placeProfiles) {
      const matched = organizations.find(record => record.id === item.organizationId)!;
      expect(getPlaceProfile(matched)).toBe(item);
      expect(item.editorialReviewStatus).toBe('internal-reviewed');
    }
  });

  it('returns no profile for an unrelated organization, even with a matching name or stale ID', () => {
    expect(getPlaceProfile(organization, [profile])).toBe(profile);
    expect(getPlaceProfile({ ...organization, id: 'different-id' }, [profile])).toBeUndefined();
    expect(getPlaceProfile({ ...organization, name: `${organization.name}分堂` }, [profile])).toBeUndefined();
    expect(getPlaceProfile({ ...organization, district: '不同區' }, [profile])).toBeUndefined();
    expect(getPlaceProfile({ ...organization, address: `${organization.address}2樓` }, [profile])).toBeUndefined();
    expect(getPlaceProfile(organization, [])).toBeUndefined();
  });

  it('detects missing, duplicate and mismatched dataset records instead of attaching by array position', () => {
    expect(validatePlaceProfiles([profile], []).join(' ')).toContain('missing organization');
    expect(validatePlaceProfiles([profile], [organization, organization]).join(' ')).toContain('duplicate organization ID');
    expect(validatePlaceProfiles([profile], [organization, { ...organization, id: 'same-identity' }]).join(' ')).toContain('duplicate organization identity');
    expect(validatePlaceProfiles([profile], [{ ...organization, address: '另一地址' }]).join(' ')).toContain('mismatched organization');
    expect(validatePlaceProfiles([profile], [...organizations].reverse())).toEqual([]);
  });

  it('rejects duplicate profile identifiers and duplicate organization mappings', () => {
    const duplicateMapping = { ...profile, id: 'second-profile' };
    expect(validatePlaceProfiles([profile, duplicateMapping], organizations).join(' ')).toContain('duplicate organization mapping');
    expect(getPlaceProfile(organization, [profile, duplicateMapping])).toBeUndefined();
    const another = organizations[1];
    const duplicateId = { ...profile, organizationId: another.id, organizationName: another.name, district: another.district, address: another.address };
    expect(validatePlaceProfiles([profile, duplicateId], organizations).join(' ')).toContain('duplicate profile identifier');
    expect(getPlaceProfile(organization, [profile, duplicateId])).toBeUndefined();
    const duplicateIdentity = { ...profile, id: 'other-id', organizationId: 'stale-id' };
    expect(getPlaceProfile(organization, [profile, duplicateIdentity])).toBeUndefined();
  });

  it('checks bilingual copy, fact sources, source metadata and real calendar dates', () => {
    const invalid = structuredClone(profile);
    invalid.introduction.en = ' ';
    invalid.sources[0].publisher = '';
    invalid.sources[0].verifiedAt = '2026-02-30';
    invalid.facts[0].title.zh = '';
    invalid.facts[0].sources = [];
    invalid.lastReviewed = 'yesterday';
    const errors = validatePlaceProfiles([invalid], organizations).join(' ');
    for (const field of ['introduction.en', 'publisher', 'verifiedAt', 'title.zh', 'source references', 'lastReviewed']) expect(errors).toContain(field);
    expect(getPlaceProfile(organization, [invalid])).toBeUndefined();
  });

  it('never publishes a pending profile or content with unsafe sources', () => {
    expect(getPlaceProfile(organization, [{ ...profile, editorialReviewStatus: 'pending' }])).toBeUndefined();
    const invalid = structuredClone(profile);
    invalid.facts[0].sources[0].url = 'javascript:alert(1)';
    expect(validatePlaceProfiles([invalid], organizations).join(' ')).toContain('safe absolute HTTP(S) URL');
    expect(getPlaceProfile(organization, [invalid])).toBeUndefined();
  });

  it('requires evidence for the introduction as well as each fact', () => {
    const invalid = { ...profile, sources: [] };
    expect(validatePlaceProfiles([invalid], organizations).join(' ')).toContain('sources must include source references');
    expect(getPlaceProfile(organization, [invalid])).toBeUndefined();
  });

  it('validates additional-tradition introductions and rejects ambiguous content', () => {
    expect(validateTraditionContent(traditionContent)).toEqual([]);
    expect(new Set(traditionContent.map(item => item.religion))).toEqual(new Set(['一貫道', '巴哈伊教', '天理教']));
    const invalid = structuredClone(traditionContent[0]);
    invalid.introduction.zh = '';
    invalid.sources = [];
    invalid.concepts[0].description.en = '';
    expect(validateTraditionContent([invalid]).join(' ')).toContain('introduction.zh');
    expect(validateTraditionContent([invalid]).join(' ')).toContain('source references');
    expect(validateTraditionContent([invalid]).join(' ')).toContain('description.en');
    expect(validateTraditionContent([traditionContent[0], traditionContent[0]]).join(' ')).toContain('duplicate tradition mapping');
  });
});

describe('external cultural source destinations', () => {
  it.each(['https://example.org/heritage?q=臺北', 'http://example.org/history#architecture'])('allows an absolute web source: %s', url => {
    expect(getSafeSourceUrl(url)).toBe(new URL(url).href);
  });

  it.each(['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', '//example.org', '/history', 'https://user:secret@example.org', 'https://example.org\n.evil.test', ' https://example.org', 'https:\\example.org', '', 'https://'])('rejects unsafe or ambiguous source URLs: %s', url => {
    expect(getSafeSourceUrl(url)).toBeUndefined();
  });
});
