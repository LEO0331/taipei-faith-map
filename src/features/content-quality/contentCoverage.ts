import type { ReligiousOrganization } from '../../types';
import { RELIGION_TYPES } from '../../utils/data';
import { resolveOrganizationIdentity } from '../../utils/curatedContent';
import { getPlaceProfile } from '../faith-spaces/placeProfileLookup';
import type { PlaceProfile } from '../faith-spaces/placeProfileTypes';
import type { ContentCoverage } from './auditTypes';

/** Editorial coverage counts are not measures of religious significance or popularity. */
export function getContentCoverage(profiles: PlaceProfile[], organizations: ReligiousOrganization[]): ContentCoverage {
  const matched = new Map<string, ReligiousOrganization>();
  for (const profile of profiles) {
    const organization = resolveOrganizationIdentity(profile, organizations);
    if (!organization || !RELIGION_TYPES.includes(organization.religion)) continue;
    if (getPlaceProfile(organization, profiles)) matched.set(profile.id, organization);
  }
  const pendingProfiles = profiles.filter(profile => profile.editorialReviewStatus === 'pending').length;
  return {
    totalProfiles: profiles.length,
    publishedProfiles: matched.size,
    pendingProfiles,
    unmatchedOrInvalidProfiles: profiles.length - matched.size - pendingProfiles,
    byReligion: RELIGION_TYPES.map(religion => ({ religion,
      organizations: organizations.filter(organization => organization.religion === religion).length,
      profiles: [...matched.values()].filter(organization => organization.religion === religion).length,
    })),
  };
}
