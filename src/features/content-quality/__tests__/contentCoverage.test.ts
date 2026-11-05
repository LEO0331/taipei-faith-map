import { describe, expect, it } from 'vitest';
import organizationsJson from '../../../../public/data/religious-organizations.json';
import type { ReligiousOrganization } from '../../../types';
import { placeProfiles } from '../../faith-spaces/placeProfiles';
import { RELIGION_TYPES } from '../../../utils/data';
import { getContentCoverage } from '../contentCoverage';

const organizations = organizationsJson as ReligiousOrganization[];
const profile = placeProfiles[0];
const organization = organizations.find(item => item.id === profile.organizationId)!;

describe('editorial coverage reporting', () => {
  it('counts valid profiles using the existing taxonomy without ranking religions', () => {
    const report = getContentCoverage(placeProfiles, organizations);
    expect(report.totalProfiles).toBe(placeProfiles.length);
    expect(report.publishedProfiles).toBe(placeProfiles.length);
    expect(report.byReligion.map(item => item.religion)).toEqual(RELIGION_TYPES);
    expect(report.byReligion.reduce((sum, item) => sum + item.profiles, 0)).toBe(report.publishedProfiles);
    expect(report.byReligion.reduce((sum, item) => sum + item.organizations, 0)).toBe(organizations.length);
  });

  it('does not count pending, duplicate, stale or ambiguous profile mappings', () => {
    expect(getContentCoverage([{ ...profile, editorialReviewStatus: 'pending' }], [organization]).publishedProfiles).toBe(0);
    expect(getContentCoverage([profile, profile], [organization]).publishedProfiles).toBe(0);
    expect(getContentCoverage([profile], [{ ...organization, address: 'Changed' }]).publishedProfiles).toBe(0);
    expect(getContentCoverage([profile], [organization, { ...organization, id: 'duplicate-details' }]).publishedProfiles).toBe(0);
  });
});
