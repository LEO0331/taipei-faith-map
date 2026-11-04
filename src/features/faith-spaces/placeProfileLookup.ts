import type { ReligiousOrganization } from '../../types';
import { placeProfiles } from './placeProfiles';
import type { PlaceProfile, TraditionContent, VerifiedFact } from './placeProfileTypes';
import { matchesOrganizationDetails as matchesIdentity, nonempty, checkLocalized, checkSources, checkEditorial } from '../../utils/curatedContent';

function checkFacts(facts: VerifiedFact[], path: string, errors: string[]) {
  if (!Array.isArray(facts) || facts.length === 0) {
    errors.push(`${path} must include at least one sourced fact`);
    return;
  }
  const ids = new Set<string>();
  for (const [index, fact] of facts.entries()) {
    const factPath = `${path}[${index}]`;
    if (!nonempty(fact.id)) errors.push(`${factPath}.id must be nonempty`);
    else if (ids.has(fact.id)) errors.push(`${factPath}.id duplicates a fact`);
    ids.add(fact.id);
    checkLocalized(fact.title, `${factPath}.title`, errors);
    checkLocalized(fact.description, `${factPath}.description`, errors);
    checkSources(fact.sources, `${factPath}.sources`, errors);
  }
}

function checkProfile(profile: PlaceProfile, path: string, errors: string[]) {
  for (const field of ['id', 'organizationId', 'organizationName', 'district', 'address'] as const) {
    if (!nonempty(profile[field])) errors.push(`${path}.${field} must be nonempty`);
  }
  checkLocalized(profile.introduction, `${path}.introduction`, errors);
  checkSources(profile.sources, `${path}.sources`, errors);
  checkFacts(profile.facts, `${path}.facts`, errors);
  checkEditorial(profile, path, errors);
}

/** Fail closed on stale IDs, identity changes, ambiguous mappings or unreviewed content. */
export function getPlaceProfile(organization: ReligiousOrganization, profiles: PlaceProfile[] = placeProfiles): PlaceProfile | undefined {
  const candidates = profiles.filter(profile => profile.organizationId === organization.id);
  if (candidates.length !== 1) return undefined;
  const profile = candidates[0];
  const errors: string[] = [];
  checkProfile(profile, profile.id, errors);
  if (errors.length || profile.editorialReviewStatus === 'pending') return undefined;
  if (profiles.filter(other => other.id === profile.id).length !== 1) return undefined;
  if (profiles.filter(other => matchesIdentity(other, organization)).length !== 1) return undefined;
  return matchesIdentity(profile, organization) ? profile : undefined;
}

/** Offline CI validation against the current generated dataset, never a network request. */
export function validatePlaceProfiles(profiles: PlaceProfile[], organizations: ReligiousOrganization[]): string[] {
  const errors: string[] = [];
  const profileIds = new Set<string>();
  const organizationIds = new Set<string>();
  for (const [index, profile] of profiles.entries()) {
    const path = `profiles[${index}] (${profile.id})`;
    checkProfile(profile, path, errors);
    if (profileIds.has(profile.id)) errors.push(`${path}: duplicate profile identifier`);
    if (organizationIds.has(profile.organizationId)) errors.push(`${path}: duplicate organization mapping`);
    profileIds.add(profile.id);
    organizationIds.add(profile.organizationId);
    const idMatches = organizations.filter(organization => organization.id === profile.organizationId);
    if (idMatches.length === 0) errors.push(`${path}: missing organization ${profile.organizationId}`);
    else if (idMatches.length > 1) errors.push(`${path}: duplicate organization ID matches`);
    else if (!matchesIdentity(profile, idMatches[0])) errors.push(`${path}: mismatched organization name, district or address`);
    const identityMatches = organizations.filter(organization => matchesIdentity(profile, organization));
    if (identityMatches.length > 1) errors.push(`${path}: duplicate organization identity matches`);
  }
  return errors;
}

export function validateTraditionContent(content: TraditionContent[]): string[] {
  const errors: string[] = [];
  const religions = new Set<string>();
  for (const [index, tradition] of content.entries()) {
    const path = `traditions[${index}] (${tradition.religion})`;
    if (!nonempty(tradition.religion)) errors.push(`${path}.religion must be nonempty`);
    if (religions.has(tradition.religion)) errors.push(`${path}: duplicate tradition mapping`);
    religions.add(tradition.religion);
    checkLocalized(tradition.title, `${path}.title`, errors);
    checkLocalized(tradition.introduction, `${path}.introduction`, errors);
    checkSources(tradition.sources, `${path}.sources`, errors);
    checkFacts(tradition.concepts, `${path}.concepts`, errors);
    checkEditorial(tradition, path, errors);
  }
  return errors;
}
